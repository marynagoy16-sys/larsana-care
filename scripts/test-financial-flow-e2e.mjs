/**
 * Teste E2E: fluxo financeiro + proposta + cenários negativos
 *
 * Uso:
 *   node scripts/test-financial-flow-e2e.mjs              # completo
 *   node scripts/test-financial-flow-e2e.mjs --proposal-only
 *   node scripts/test-financial-flow-e2e.mjs --negative-only
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dataDir = resolve(root, 'data', 'supabase')

const PROPOSAL_ONLY = process.argv.includes('--proposal-only')
const NEGATIVE_ONLY = process.argv.includes('--negative-only')

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? 'https://kispjnlmklzfhxhtdyvm.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpc3Bqbmxta2x6Zmh4aHRkeXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MjAyODgsImV4cCI6MjA5NjE5NjI4OH0.CcU6bg_o-kjusi3mm185BPIoYQe-321u-oGl-PdSj8w'

const PACIENTE_EMAIL = process.env.E2E_PACIENTE_EMAIL ?? 'cliente@larsanacare.com.br'
const PACIENTE_PASSWORD = process.env.E2E_PACIENTE_PASSWORD ?? 'LarsanaCare2026!'
const LOAD_CHARGE_EMAIL = 'load-charge+1@larsanacare.test'
const DEMO_PATIENT_ID = 'd1000000-0000-4000-8000-000000000002'
const LOAD_PATIENT_ID = 'e4100000-0000-4000-8000-000000000001'
const DEMO_PP_ID = 'd1000000-0000-4000-8000-000000000001'
const REGION_A = 'a0000000-0000-4000-8000-000000000001'
const REGION_B = 'a0000000-0000-4000-8000-000000000002'

const PREPARE_ARGS = {
  p_patient_full_name: 'Paciente Demonstração',
  p_patient_cpf: '52998224725',
  p_birth_date: '1985-03-15',
  p_attendance_period: 'MANHA',
  p_diagnostic_hypothesis: 'Teste E2E fluxo financeiro Larsana Care',
  p_referral_source: 'INDICACAO',
  p_responsible_full_name: 'Responsável Demo',
  p_responsible_cpf: '39053344705',
  p_birth_place: 'Mauá, SP',
  p_marital_status: 'SOLTEIRO',
  p_gender: 'NAO_INFORMADO',
  p_terms_accepted: true,
}

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

const report = {
  generatedAt: new Date().toISOString(),
  environment: SUPABASE_URL,
  paciente: PACIENTE_EMAIL,
  phases: { infra: [], avaliacao: [], proposta: [], negativos: [] },
  success: false,
  summary: {},
}

function phaseName(phase) {
  if (phase === report.phases.infra) return 'infra'
  if (phase === report.phases.avaliacao) return 'avaliação'
  if (phase === report.phases.proposta) return 'proposta'
  return 'negativos'
}

function step(phase, name, ok, detail, extra = {}) {
  phase.push({ name, ok: Boolean(ok), detail, ...extra })
  console.log(`${ok ? '✓' : '✗'} [${phaseName(phase)}] ${name}${detail ? `: ${detail}` : ''}`)
}

async function login(supabase, email = PACIENTE_EMAIL, password = PACIENTE_PASSWORD) {
  return supabase.auth.signInWithPassword({ email, password })
}

async function runInfraChecks() {
  const p = report.phases.infra
  const cronRows = dbQuery(
    "SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'process_session_presence_reminders';",
  )
  step(p, 'Cron pg_cron (15 min)', cronRows[0]?.active === true, cronRows[0]?.schedule ?? 'n/a')

  const settings = dbQuery(
    'SELECT assessment_fee_cents, assessment_pp_share_cents, early_cycle_discount_pct, max_weekly_sessions_pp FROM platform_settings LIMIT 1;',
  )[0]
  report.summary.platformSettings = settings
  step(
    p,
    'platform_settings',
    settings?.assessment_fee_cents === 15000,
    `avaliação R$${((settings?.assessment_fee_cents ?? 0) / 100).toFixed(2)} | repasse PP R$${((settings?.assessment_pp_share_cents ?? 0) / 100).toFixed(2)}`,
  )

  const indexes = dbQuery(
    "SELECT indexname FROM pg_indexes WHERE indexname IN ('idx_charges_one_pending_assessment', 'idx_demands_one_active_per_patient');",
  )
  step(
    p,
    'Índices UNIQUE parciais (cobrança/demanda)',
    indexes.length === 2,
    indexes.map((r) => r.indexname).join(', ') || 'não encontrados',
  )
}

async function runAvaliacaoFlow(supabase) {
  const p = report.phases.avaliacao
  const paidBefore =
    dbQuery(
      `SELECT count(*)::int AS n FROM charges WHERE patient_id = '${DEMO_PATIENT_ID}' AND charge_kind = 'assessment_request' AND payment_status = 'pago';`,
    )[0]?.n ?? 0

  const { data: prep, error: prepError } = await supabase.rpc(
    'patient_prepare_service_request',
    PREPARE_ARGS,
  )
  step(
    p,
    'patient_prepare_service_request',
    !prepError && prep?.success,
    prepError?.message ?? `checkout=${prep?.can_checkout} fee=${prep?.assessment_fee_cents}`,
  )

  let chargeId = null
  if (paidBefore > 0) {
    chargeId = dbQuery(
      `SELECT id FROM charges WHERE patient_id = '${DEMO_PATIENT_ID}' AND charge_kind = 'assessment_request' AND payment_status = 'pago' ORDER BY paid_at DESC LIMIT 1;`,
    )[0]?.id
    step(p, 'Taxa avaliação já paga (skip cobrança)', !!chargeId, chargeId ?? 'n/a')
  } else {
    const { data: chargeMeta, error: chargeError } = await supabase.rpc(
      'patient_create_assessment_request_charge',
      { p_payment_method: 'PIX' },
    )
    chargeId =
      chargeMeta?.charge_id ??
      dbQuery(
        `SELECT id FROM charges WHERE patient_id = '${DEMO_PATIENT_ID}' AND charge_kind = 'assessment_request' AND payment_status = 'pendente' ORDER BY created_at DESC LIMIT 1;`,
      )[0]?.id
    step(p, 'patient_create_assessment_request_charge', !chargeError && !!chargeId, chargeError?.message ?? chargeId)

    if (chargeId) {
      const chargeStatus = dbQuery(`SELECT payment_status FROM charges WHERE id = '${chargeId}';`)[0]
        ?.payment_status
      if (chargeStatus !== 'pago') {
        const { data: payResult, error: payError } = await supabase.rpc('simulate_charge_payment', {
          p_charge_id: chargeId,
        })
        step(p, 'simulate_charge_payment', !payError, payError?.message ?? `demand=${payResult?.demand_id}`)
      } else {
        step(p, 'simulate_charge_payment', true, 'já pago')
      }
    }
  }

  report.summary.assessmentChargeId = chargeId
  const chargeRow = chargeId
    ? dbQuery(
        `SELECT payment_status, charge_kind, demand_id, amount_cents FROM charges WHERE id = '${chargeId}';`,
      )[0]
    : null
  step(
    p,
    'Cobrança avaliação confirmada',
    chargeRow?.payment_status === 'pago' && chargeRow?.charge_kind === 'assessment_request',
    chargeRow ? JSON.stringify(chargeRow) : 'sem cobrança',
  )
}

function closePendingProposals(patientId = DEMO_PATIENT_ID) {
  dbQuery(
    `UPDATE initial_assessments SET status = 'respondida_nao', family_response = 'NAO', updated_at = now()
     WHERE patient_id = '${patientId}' AND status IN ('proposta_enviada','em_analise') AND family_response IS NULL;`,
  )
}

function setupProposalFixture(patientId = DEMO_PATIENT_ID) {
  closePendingProposals(patientId)
  const rows = dbQuery(
    `INSERT INTO initial_assessments (
      patient_id, evaluator_professional_id, crefito_number, clinical_content,
      status, proposal_sent_at, response_deadline_at,
      proposed_weekly_frequency, proposed_session_count,
      suggested_patient_level, proposed_patient_level, level_confirmed,
      primary_diagnosis, functionality, mobility
    ) VALUES (
      '${patientId}', '${DEMO_PP_ID}', '308315-F', 'Avaliação E2E automatizada.',
      'proposta_enviada', now(), now() + interval '5 days',
      2, 12, 'N2', 'N2', true,
      'Lombalgia', 'Deambula com auxílio', 'Deambula com auxílio'
    ) RETURNING id;`,
  )
  return rows[0]?.id
}

async function runPropostaFlow(supabase) {
  const p = report.phases.proposta
  const assessmentId = setupProposalFixture()
  report.summary.testAssessmentId = assessmentId
  step(p, 'Fixture proposta (2x/sem, 12 sessões)', !!assessmentId, assessmentId ?? 'falhou insert')
  if (!assessmentId) return

  const { data: preview, error: previewError } = await supabase.rpc('get_patient_proposal_preview', {
    p_assessment_id: assessmentId,
  })
  const options = preview?.options ?? []
  const freqs = options.map((o) => o.weekly_frequency).sort((a, b) => a - b)
  const hasThreeDynamic = freqs.length === 3 && freqs[0] === 1 && freqs[1] === 2 && freqs[2] === 3
  step(
    p,
    'get_patient_proposal_preview (3 opções)',
    !previewError && hasThreeDynamic,
    previewError?.message ??
      options.map((o) => `${o.weekly_frequency}x R$${(o.total_amount_cents / 100).toFixed(2)}`).join(' | '),
  )

  const chosenFreq = options.find((o) => o.is_recommended)?.weekly_frequency ?? 2
  const { data: acceptResult, error: acceptError } = await supabase.rpc('accept_assessment_proposal', {
    p_assessment_id: assessmentId,
    p_response: 'SIM',
    p_chosen_weekly_frequency: chosenFreq,
    p_payment_timing: 'antecipado',
  })
  step(
    p,
    'accept_assessment_proposal (SIM)',
    !acceptError && !!acceptResult?.charge_id,
    acceptError?.message ?? `charge=${acceptResult?.charge_id}`,
  )

  if (acceptResult?.charge_id) {
    const { error: payError } = await supabase.rpc('simulate_charge_payment', {
      p_charge_id: acceptResult.charge_id,
    })
    const sessions =
      dbQuery(
        `SELECT count(*)::int AS n FROM care_sessions WHERE cycle_id = '${acceptResult.cycle_id}';`,
      )[0]?.n ?? 0
    step(p, 'Pagamento ciclo + sessões', !payError && sessions > 0, `sessões=${sessions}`)
  }
}

async function runNegativeScenarios(supabase) {
  const p = report.phases.negativos

  const regionBackup =
    dbQuery(`SELECT region_id::text AS id FROM patients WHERE id = '${DEMO_PATIENT_ID}';`)[0]?.id ??
    REGION_A
  dbQuery(`UPDATE regions SET patient_service_available = false WHERE id = '${regionBackup}';`)
  const { data: noCov, error: noCovErr } = await supabase.rpc(
    'patient_prepare_service_request',
    PREPARE_ARGS,
  )
  step(
    p,
    'Sem cobertura (no_coverage)',
    !noCovErr && noCov?.success === false && noCov?.reason === 'no_coverage' && noCov?.can_checkout === false,
    noCov?.message ?? noCovErr?.message ?? 'n/a',
  )
  dbQuery(`UPDATE regions SET patient_service_available = true WHERE id = '${regionBackup}';`)

  const { data: alreadyPaid, error: paidErr } = await supabase.rpc(
    'patient_create_assessment_request_charge',
    { p_payment_method: 'PIX' },
  )
  step(
    p,
    'Cobrança já paga (already_paid)',
    !paidErr && alreadyPaid?.already_paid === true,
    alreadyPaid?.message ?? paidErr?.message ?? 'n/a',
  )

  dbQuery(
    `DELETE FROM patient_responsibles WHERE user_id = 'e4000000-0000-4000-8000-000000000001' AND patient_id <> '${LOAD_PATIENT_ID}';`,
  )
  dbQuery(
    `DELETE FROM charges WHERE patient_id = '${LOAD_PATIENT_ID}' AND charge_kind = 'assessment_request' AND payment_status = 'pendente';`,
  )
  const loadClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { error: loadLoginErr } = await login(loadClient, LOAD_CHARGE_EMAIL, PACIENTE_PASSWORD)
  if (loadLoginErr) {
    step(
      p,
      'Cobrança duplicada (load patient login)',
      false,
      `${loadLoginErr.message} — rode seed-load-test-assessment-charges.sql`,
    )
  } else {
    const [first, second] = await Promise.all([
      loadClient.rpc('patient_create_assessment_request_charge', { p_payment_method: 'PIX' }),
      loadClient.rpc('patient_create_assessment_request_charge', { p_payment_method: 'PIX' }),
    ])
    const id1 = first.data?.charge_id
    const id2 = second.data?.charge_id
    const rpcOk = !first.error && !second.error
    const pendingCount =
      dbQuery(
        `SELECT count(*)::int AS n FROM charges WHERE patient_id = '${LOAD_PATIENT_ID}'
         AND charge_kind = 'assessment_request' AND payment_status = 'pendente';`,
      )[0]?.n ?? 0
    step(
      p,
      'Cobrança duplicada bloqueada (race)',
      rpcOk && pendingCount === 1 && id1 && id2 && id1 === id2,
      `charge1=${id1} charge2=${id2} pendentes=${pendingCount}${first.error ? ` err=${first.error.message}` : ''}`,
    )
    dbQuery(
      `DELETE FROM charges WHERE patient_id = '${LOAD_PATIENT_ID}' AND charge_kind = 'assessment_request' AND payment_status = 'pendente';`,
    )
  }

  await login(supabase)

  const rejectId = setupProposalFixture()
  const { data: rejectData, error: rejectErr } = await supabase.rpc('accept_assessment_proposal', {
    p_assessment_id: rejectId,
    p_response: 'NAO',
    p_chosen_weekly_frequency: null,
    p_payment_timing: 'antecipado',
  })
  step(
    p,
    'Proposta recusada (NAO)',
    !rejectErr && rejectData?.family_response === 'NAO',
    rejectErr?.message ?? rejectData?.family_response ?? 'n/a',
  )

  const doubleId = setupProposalFixture()
  await supabase.rpc('accept_assessment_proposal', {
    p_assessment_id: doubleId,
    p_response: 'SIM',
    p_chosen_weekly_frequency: 2,
    p_payment_timing: 'antecipado',
  })
  const { error: doubleErr } = await supabase.rpc('accept_assessment_proposal', {
    p_assessment_id: doubleId,
    p_response: 'SIM',
    p_chosen_weekly_frequency: 2,
    p_payment_timing: 'antecipado',
  })
  step(
    p,
    'Duplo aceite bloqueado',
    !!doubleErr && /respondida|pendente/i.test(doubleErr.message),
    doubleErr?.message ?? 'deveria falhar',
  )

  const invalidId = setupProposalFixture()
  const { error: freqErr } = await supabase.rpc('accept_assessment_proposal', {
    p_assessment_id: invalidId,
    p_response: 'SIM',
    p_chosen_weekly_frequency: 99,
    p_payment_timing: 'antecipado',
  })
  step(
    p,
    'Frequência inválida rejeitada',
    !!freqErr && /Frequência/i.test(freqErr.message),
    freqErr?.message ?? 'deveria falhar',
  )
}

function finalizeReport() {
  const allSteps = [
    ...report.phases.infra,
    ...report.phases.avaliacao,
    ...report.phases.proposta,
    ...report.phases.negativos,
  ]
  report.success = allSteps.every((s) => s.ok)
  report.summary.passed = allSteps.filter((s) => s.ok).length
  report.summary.failed = allSteps.filter((s) => !s.ok).length
  report.summary.total = allSteps.length
}

function writeReport() {
  writeFileSync(
    resolve(root, 'scripts', 'test-financial-flow-e2e-report.json'),
    JSON.stringify(report, null, 2),
  )
  console.log('\nRelatório JSON: scripts/test-financial-flow-e2e-report.json')
}

async function main() {
  console.log('\n=== E2E Larsana Care — Financeiro + Proposta + Negativos ===\n')

  await runInfraChecks()

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data: authData, error } = await login(supabase)
  step(report.phases.infra, 'Login paciente demo', !error && !!authData.session, error?.message ?? PACIENTE_EMAIL)
  if (error || !authData.session) {
    finalizeReport()
    writeReport()
    process.exit(1)
  }

  if (NEGATIVE_ONLY) {
    await runNegativeScenarios(supabase)
  } else {
    if (!PROPOSAL_ONLY) await runAvaliacaoFlow(supabase)
    if (!PROPOSAL_ONLY) await runPropostaFlow(supabase)
    await runNegativeScenarios(supabase)
  }

  finalizeReport()
  writeReport()

  console.log(`\n${'='.repeat(50)}`)
  console.log(`Resultado: ${report.summary.passed}/${report.summary.total} passos OK`)
  console.log(report.success ? '✅ E2E COMPLETO PASSOU' : '❌ E2E COM FALHAS')
  console.log(`${'='.repeat(50)}\n`)

  process.exit(report.success ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
