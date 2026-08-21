/**
 * E2E: repasse ciclo (NF → validação → wallet) + repasse avaliação R$50
 *
 * Uso: node scripts/test-transfer-repasse-e2e.mjs
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
const PP_EMAIL = process.env.E2E_PP_EMAIL ?? 'parceiro@larsanacare.com.br'
const PASSWORD = process.env.E2E_PACIENTE_PASSWORD ?? 'LarsanaCare2026!'
const DEMO_PP_ID = 'd1000000-0000-4000-8000-000000000001'
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
  console.log('\n=== E2E Repasse Terapeutas ===\n')

  const cycleRow = dbQuery(
    `SELECT cc.id, cc.total_amount_cents, cc.assigned_professional_id
     FROM care_cycles cc
     WHERE cc.patient_id = '${DEMO_PATIENT_ID}'
       AND cc.payment_status = 'pago'
       AND cc.status = 'ativo'
     ORDER BY cc.created_at DESC LIMIT 1;`,
  )[0]

  if (!cycleRow?.id) {
    step('Fixture ciclo pago', false, 'Nenhum ciclo ativo pago — rode test-financial-flow-e2e primeiro')
    writeReport()
    process.exit(1)
  }

  const cycleId = cycleRow.id
  dbQuery(`UPDATE care_cycles SET status = 'encerrado', closed_at = now() WHERE id = '${cycleId}';`)

  const transfer = dbQuery(
    `SELECT id, status, pp_transfer_amount_cents FROM transfers WHERE cycle_id = '${cycleId}';`,
  )[0]
  step('Transfer criado ao encerrar ciclo', !!transfer?.id, transfer ? `${transfer.id} R$${((transfer.pp_transfer_amount_cents ?? 0) / 100).toFixed(2)}` : 'n/a')

  if (!transfer?.id) {
    writeReport()
    process.exit(1)
  }

  const { supabase: ppClient, error: ppLoginErr } = await login(PP_EMAIL)
  step('Login PP', !ppLoginErr, ppLoginErr?.message ?? PP_EMAIL)
  if (ppLoginErr) {
    writeReport()
    process.exit(1)
  }

  const fakePath = `${DEMO_PP_ID}/${transfer.id}/e2e-nf.pdf`
  const { error: nfError } = await ppClient.rpc('submit_pp_transfer_invoice', {
    p_transfer_id: transfer.id,
    p_storage_path: fakePath,
    p_file_name: 'e2e-nf.pdf',
  })
  step('PP envia NF', !nfError, nfError?.message ?? fakePath)

  const statusAfterNf = dbQuery(`SELECT status FROM transfers WHERE id = '${transfer.id}';`)[0]?.status
  step('Status aguardando_validacao', statusAfterNf === 'aguardando_validacao', statusAfterNf)

  const { supabase: finClient, error: finLoginErr } = await login(FINANCEIRO_EMAIL)
  step('Login financeiro', !finLoginErr, finLoginErr?.message ?? FINANCEIRO_EMAIL)
  if (finLoginErr) {
    writeReport()
    process.exit(1)
  }

  const { data: validateData, error: validateErr } = await finClient.rpc('staff_validate_transfer_invoice', {
    p_transfer_id: transfer.id,
  })
  step('Validar NF (liberado)', !validateErr && validateData?.status === 'liberado', validateErr?.message ?? validateData?.status)

  const { data: simData, error: simErr } = await finClient.rpc('simulate_transfer_wallet', {
    p_transfer_id: transfer.id,
  })
  step('Simular wallet → transferido', !simErr && simData?.status === 'transferido', simErr?.message ?? simData?.status)

  const finalTransfer = dbQuery(`SELECT status, asaas_transfer_id FROM transfers WHERE id = '${transfer.id}';`)[0]
  report.summary.cycleTransfer = finalTransfer
  step('Status final ciclo', finalTransfer?.status === 'transferido', JSON.stringify(finalTransfer))

  const demandRow = dbQuery(
    `SELECT id FROM demands WHERE patient_id = '${DEMO_PATIENT_ID}' AND status = 'alocada' ORDER BY created_at DESC LIMIT 1;`,
  )[0]

  if (demandRow?.id) {
    dbQuery(
      `SELECT public.ensure_assessment_pp_repasse('${demandRow.id}'::uuid, '${DEMO_PP_ID}'::uuid) AS id;`,
    )
    const assessmentRepasse = dbQuery(
      `SELECT id, amount_cents, status FROM assessment_pp_repasses
       WHERE professional_id = '${DEMO_PP_ID}' ORDER BY created_at DESC LIMIT 1;`,
    )[0]
    report.summary.assessmentRepasse = assessmentRepasse
    step(
      'Repasse avaliação R$50 registrado',
      assessmentRepasse?.amount_cents === 5000 && assessmentRepasse?.status === 'liberado',
      assessmentRepasse ? `R$${(assessmentRepasse.amount_cents / 100).toFixed(2)} ${assessmentRepasse.status}` : 'n/a',
    )

    if (assessmentRepasse?.id) {
      const { data: arSim, error: arErr } = await finClient.rpc('simulate_assessment_repasse_wallet', {
        p_repasse_id: assessmentRepasse.id,
      })
      step('Simular wallet avaliação', !arErr && arSim?.status === 'transferido', arErr?.message ?? arSim?.status)
    }
  } else {
    step('Repasse avaliação R$50 registrado', false, 'demanda alocada não encontrada')
  }

  report.success = report.steps.every((s) => s.ok)
  report.summary.passed = report.steps.filter((s) => s.ok).length
  report.summary.total = report.steps.length
  writeReport()

  console.log(`\n${report.summary.passed}/${report.summary.total} OK`)
  console.log(report.success ? '✅ E2E REPASSE PASSOU' : '❌ E2E REPASSE COM FALHAS')
  process.exit(report.success ? 0 : 1)
}

function writeReport() {
  writeFileSync(resolve(root, 'scripts', 'test-transfer-repasse-e2e-report.json'), JSON.stringify(report, null, 2))
  console.log('\nRelatório: scripts/test-transfer-repasse-e2e-report.json')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
