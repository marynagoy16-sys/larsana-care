/**
 * E2E: repasse avulso PPSUB (substituto por sessão) + repasse ciclo sem double-pay
 *
 * Pré-requisito: migration 20260821160000 aplicada; ciclo pago demo (test-financial-flow-e2e).
 *
 * Uso: node scripts/test-sub-repasse-e2e.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dataDir = resolve(root, 'data', 'supabase')

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? 'https://kispjnlmklzfhxhtdyvm.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpc3Bqbmxta2x6Zmh4aHRkeXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MjAyODgsImV4cCI6MjA5NjE5NjI4OH0.CcU6bg_o-kjusi3mm185BPIoYQe-321u-oGl-PdSj8w'

const FINANCEIRO_EMAIL = process.env.E2E_FINANCEIRO_EMAIL ?? 'financeiro@larsanacare.com.br'
const SUB_PP_EMAIL = process.env.E2E_SUB_PP_EMAIL ?? 'juliana.rocha@larsanacare.com.br'
const PASSWORD = process.env.E2E_PACIENTE_PASSWORD ?? 'LarsanaCare2026!'
const DEMO_PP_ID = 'd1000000-0000-4000-8000-000000000001'
const SUB_PP_ID = 'd1000000-0000-4000-8000-000000000020'
const DEMO_PATIENT_ID = 'd1000000-0000-4000-8000-000000000002'

function dbQuery(sql) {
  const escaped = sql.replace(/"/g, '\\"').replace(/\n/g, ' ')
  const out = execSync(`npx supabase db query --linked "${escaped}"`, {
    cwd: dataDir,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const jsonStart = out.indexOf('{')
  if (jsonStart === -1) throw new Error(`Resposta inesperada: ${out.slice(0, 300)}`)
  return JSON.parse(out.slice(jsonStart)).rows ?? []
}

const report = { generatedAt: new Date().toISOString(), steps: [], success: false, summary: {} }

function step(name, ok, detail) {
  report.steps.push({ name, ok: Boolean(ok), detail })
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? `: ${detail}` : ''}`)
}

async function login(email) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: PASSWORD })
  return { supabase, session: data.session, error }
}

async function main() {
  console.log('\n=== E2E Repasse SUB (PPSUB avulso) ===\n')

  const tableCheck = dbQuery(
    `SELECT to_regclass('public.sub_pp_repasses') IS NOT NULL AS exists;`,
  )[0]
  step('Tabela sub_pp_repasses', tableCheck?.exists === true, tableCheck?.exists ? 'ok' : 'aplicar migration 20260821160000')

  if (!tableCheck?.exists) {
    writeReport()
    process.exit(1)
  }

  const cycleRow = dbQuery(
    `SELECT cc.id, cc.session_unit_price_cents, cc.assigned_professional_id, cc.session_count
     FROM care_cycles cc
     WHERE cc.patient_id = '${DEMO_PATIENT_ID}'
       AND cc.payment_status = 'pago'
       AND cc.status IN ('ativo', 'encerrado')
     ORDER BY cc.created_at DESC LIMIT 1;`,
  )[0]

  if (!cycleRow?.id) {
    step('Fixture ciclo pago', false, 'Rode test-financial-flow-e2e primeiro')
    writeReport()
    process.exit(1)
  }

  const cycleId = cycleRow.id
  step('Ciclo demo encontrado', true, cycleId)

  dbQuery(
    `UPDATE care_cycles SET status = 'ativo', closed_at = NULL WHERE id = '${cycleId}';
     DELETE FROM transfers WHERE cycle_id = '${cycleId}';
     DELETE FROM transfer_queue WHERE cycle_id = '${cycleId}';
     DELETE FROM sub_pp_repasses WHERE cycle_id = '${cycleId}';`,
  )

  const sessionRow = dbQuery(
    `SELECT id, session_number FROM care_sessions
     WHERE cycle_id = '${cycleId}' AND status = 'prevista'
     ORDER BY session_number ASC LIMIT 1;`,
  )[0]

  if (!sessionRow?.id) {
    step('Sessão prevista disponível', false, 'nenhuma')
    writeReport()
    process.exit(1)
  }

  const sessionId = sessionRow.id
  step('Sessão alvo SUB', true, `#${sessionRow.session_number} ${sessionId}`)

  dbQuery(
    `UPDATE care_sessions
     SET professional_id = '${SUB_PP_ID}',
         check_in_at = NULL,
         check_out_at = NULL,
         status = 'prevista'::public.session_status
     WHERE id = '${sessionId}';

     INSERT INTO public.session_reschedule_requests (
       session_id, cycle_id, patient_id, responsible_professional_id,
       initiated_by, window_type, status,
       original_scheduled_at, proposed_scheduled_at, reschedule_deadline,
       substitute_professional_id, original_professional_id
     )
     SELECT
       '${sessionId}', '${cycleId}', cc.patient_id, cc.assigned_professional_id,
       'pp', 'late', 'completed',
       cs.scheduled_at, cs.scheduled_at, now() + interval '14 days',
       '${SUB_PP_ID}', cc.assigned_professional_id
     FROM care_sessions cs
     JOIN care_cycles cc ON cc.id = cs.cycle_id
     WHERE cs.id = '${sessionId}';`,
  )

  const { supabase: subClient, error: subLoginErr } = await login(SUB_PP_EMAIL)
  step('Login substituto', !subLoginErr, subLoginErr?.message ?? SUB_PP_EMAIL)
  if (subLoginErr) {
    writeReport()
    process.exit(1)
  }

  const { error: checkInErr } = await subClient.rpc('pp_session_check_in', { p_session_id: sessionId })
  step('Check-in SUB', !checkInErr, checkInErr?.message ?? 'ok')

  const { data: checkOutData, error: checkOutErr } = await subClient.rpc('pp_session_check_out', {
    p_session_id: sessionId,
  })
  step('Check-out SUB → realizada', !checkOutErr, checkOutErr?.message ?? JSON.stringify(checkOutData))

  const splitRow = dbQuery(
    `SELECT pp_percent FROM resolve_sub_session_split_percentages('${cycleId}'::uuid, '${SUB_PP_ID}'::uuid) LIMIT 1;`,
  )[0]
  const expectedSubCents = Math.round(
    (cycleRow.session_unit_price_cents * Number(splitRow?.pp_percent ?? 0)) / 100,
  )

  const subRepasse = dbQuery(
    `SELECT id, amount_cents, status, substitute_professional_id
     FROM sub_pp_repasses WHERE session_id = '${sessionId}';`,
  )[0]

  report.summary.subRepasse = subRepasse
  report.summary.expectedSubCents = expectedSubCents

  step(
    'sub_pp_repasses criado (liberado)',
    subRepasse?.status === 'liberado' && subRepasse?.substitute_professional_id === SUB_PP_ID,
    subRepasse ? `R$${(subRepasse.amount_cents / 100).toFixed(2)} ${subRepasse.status}` : 'n/a',
  )

  step(
    'Valor SUB = unit × % classe substituto',
    subRepasse?.amount_cents === expectedSubCents,
    `esperado ${expectedSubCents} obtido ${subRepasse?.amount_cents ?? 'n/a'}`,
  )

  const assignedRealizadas = dbQuery(
    `SELECT count(*)::int AS n FROM care_sessions
     WHERE cycle_id = '${cycleId}' AND status = 'realizada'
       AND professional_id = '${cycleRow.assigned_professional_id}';`,
  )[0]?.n ?? 0

  dbQuery(`UPDATE care_cycles SET status = 'encerrado', closed_at = now() WHERE id = '${cycleId}';`)

  const transfer = dbQuery(
    `SELECT id, pp_transfer_amount_cents FROM transfers WHERE cycle_id = '${cycleId}';`,
  )[0]

  const titularPct = dbQuery(
    `SELECT pp_percent FROM resolve_cycle_split_percentages('${cycleId}'::uuid) LIMIT 1;`,
  )[0]?.pp_percent
  const expectedTitularCents = Math.round(
    (assignedRealizadas * cycleRow.session_unit_price_cents * Number(titularPct ?? 0)) / 100,
  )

  report.summary.cycleTransfer = transfer
  report.summary.expectedTitularCents = expectedTitularCents

  step(
    'Transfer titular exclui sessão SUB',
    transfer?.pp_transfer_amount_cents === expectedTitularCents,
    `titular realizadas=${assignedRealizadas} esperado R$${(expectedTitularCents / 100).toFixed(2)} obtido R$${((transfer?.pp_transfer_amount_cents ?? 0) / 100).toFixed(2)}`,
  )

  if (subRepasse?.id) {
    const { supabase: finClient, error: finLoginErr } = await login(FINANCEIRO_EMAIL)
    step('Login financeiro', !finLoginErr, finLoginErr?.message ?? FINANCEIRO_EMAIL)

    if (!finLoginErr) {
      const { data: simData, error: simErr } = await finClient.rpc('simulate_sub_repasse_wallet', {
        p_repasse_id: subRepasse.id,
      })
      step(
        'Simular wallet SUB',
        !simErr && simData?.status === 'transferido',
        simErr?.message ?? simData?.status,
      )
    }
  }

  report.success = report.steps.every((s) => s.ok)
  report.summary.passed = report.steps.filter((s) => s.ok).length
  report.summary.total = report.steps.length
  writeReport()

  console.log(`\n${report.summary.passed}/${report.summary.total} OK`)
  console.log(report.success ? '✅ E2E SUB REPASSE PASSOU' : '❌ E2E SUB REPASSE COM FALHAS')
  process.exit(report.success ? 0 : 1)
}

function writeReport() {
  writeFileSync(resolve(root, 'scripts', 'test-sub-repasse-e2e-report.json'), JSON.stringify(report, null, 2))
  console.log('\nRelatório: scripts/test-sub-repasse-e2e-report.json')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
