/**
 * Teste E2E: indicação PP com código de referral.
 * Uso: node scripts/test-pp-referral-flow.mjs [REFERRAL_CODE]
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dataDir = resolve(root, 'data')

function loadEnv() {
  for (const p of [resolve(root, '.env'), resolve(root, 'frontend/.env')]) {
    try {
      const raw = readFileSync(p, 'utf8')
      const env = {}
      for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^([^#=]+)=(.*)$/)
        if (m) env[m[1].trim()] = m[2].trim()
      }
      if (env.VITE_SUPABASE_URL) return env
    } catch {
      // next
    }
  }
  throw new Error('VITE_SUPABASE_URL não encontrado em .env')
}

function dbQuery(sql) {
  const escaped = sql.replace(/"/g, '\\"')
  const out = execSync(`npx supabase db query --linked "${escaped}"`, {
    cwd: dataDir,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  const jsonStart = out.indexOf('{')
  if (jsonStart === -1) throw new Error(`Resposta inesperada: ${out.slice(0, 200)}`)
  const parsed = JSON.parse(out.slice(jsonStart))
  return parsed.rows ?? []
}

const REFERRAL_CODE = (process.argv[2] ?? 'D60E3BDA').trim().toUpperCase()
const ts = Date.now()
const TEST_EMAIL = `pp-referral-test+${ts}@larsanacare.test`
const TEST_PASSWORD = 'LarsanaCare2026!'
const TEST_CPF = String(10000000000 + (ts % 89999999999)).slice(0, 11)
const TEST_NAME = `Teste Indicação ${ts}`

const env = loadEnv()
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)

const report = {
  referralCode: REFERRAL_CODE,
  testEmail: TEST_EMAIL,
  testCpf: TEST_CPF,
  steps: [],
  referrerBefore: null,
  referrerAfterSignup: null,
  referrerAfterConfirm: null,
  referralRecord: null,
  referredProfessional: null,
  success: false,
}

function step(name, ok, detail) {
  report.steps.push({ name, ok, detail })
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? `: ${detail}` : ''}`)
}

async function main() {
  console.log('\n=== Teste de indicação PP ===\n')
  console.log(`Código: ${REFERRAL_CODE}`)
  console.log(`Nova conta: ${TEST_EMAIL}\n`)

  const referrers = dbQuery(
    `SELECT id, full_name, email, referral_code, patente, points_total, referral_count_pre_bronze FROM professionals WHERE upper(referral_code) = '${REFERRAL_CODE}' LIMIT 1;`,
  )
  report.referrerBefore = referrers[0] ?? null
  if (!report.referrerBefore) {
    step('Localizar indicador pelo código', false, 'Profissional não encontrado')
    writeFileSync(resolve(root, 'scripts/test-pp-referral-report.json'), JSON.stringify(report, null, 2))
    process.exit(1)
  }
  step(
    'Localizar indicador pelo código',
    true,
    `${report.referrerBefore.full_name} (${report.referrerBefore.points_total} pts, ${report.referrerBefore.referral_count_pre_bronze}/3)`,
  )

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    options: {
      data: {
        full_name: TEST_NAME,
        primary_role: 'pp',
        cpf_cnpj: TEST_CPF,
        profession: 'FISIO',
        referral_code: REFERRAL_CODE,
      },
    },
  })

  if (signUpError) {
    step('Cadastrar PP com código de indicação', false, signUpError.message)
    writeFileSync(resolve(root, 'scripts/test-pp-referral-report.json'), JSON.stringify(report, null, 2))
    process.exit(1)
  }
  step('Cadastrar PP com código de indicação', !!signUpData.user?.id, signUpData.user?.id)

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })
  step('Login da conta de teste', !signInError, signInError?.message ?? 'ok')

  const referredRows = dbQuery(
    `SELECT id, full_name, email, credentialing_status, user_id FROM professionals WHERE email = '${TEST_EMAIL}' LIMIT 1;`,
  )
  report.referredProfessional = referredRows[0] ?? null
  step(
    'Profissional criado no bootstrap',
    !!report.referredProfessional,
    report.referredProfessional
      ? `${report.referredProfessional.id} (${report.referredProfessional.credentialing_status})`
      : 'não encontrado',
  )

  if (report.referredProfessional?.id) {
    const refRows = dbQuery(
      `SELECT id, referrer_professional_id, referred_professional_id, referral_code, status, points_awarded_at FROM pp_referrals WHERE referred_professional_id = '${report.referredProfessional.id}' LIMIT 1;`,
    )
    report.referralRecord = refRows[0] ?? null
    step(
      'Registro pp_referrals após signup',
      report.referralRecord?.status === 'pendente',
      report.referralRecord
        ? `status=${report.referralRecord.status}`
        : 'Nenhum registro — indicação não vinculada',
    )
  }

  const afterSignup = dbQuery(
    `SELECT id, points_total, referral_count_pre_bronze FROM professionals WHERE id = '${report.referrerBefore.id}';`,
  )[0]
  report.referrerAfterSignup = afterSignup
  step(
    'Pontos do indicador após signup (esperado: sem mudança)',
    afterSignup.points_total === report.referrerBefore.points_total,
    `${report.referrerBefore.points_total} → ${afterSignup.points_total}`,
  )

  // Fase 2: confirmar indicação (simula envio de credenciamento)
  if (report.referredProfessional?.id && report.referralRecord?.status === 'pendente') {
    dbQuery(`SELECT public.confirm_pp_referral_points('${report.referredProfessional.id}'::uuid);`)
    step('confirm_pp_referral_points (simula credenciamento enviado)', true, 'executado')

    const refAfter = dbQuery(
      `SELECT status, points_awarded_at FROM pp_referrals WHERE id = '${report.referralRecord.id}';`,
    )[0]
    step(
      'Status da indicação após confirmação',
      refAfter?.status === 'confirmada',
      refAfter?.status ?? 'desconhecido',
    )

    const referrerFinal = dbQuery(
      `SELECT points_total, referral_count_pre_bronze, patente FROM professionals WHERE id = '${report.referrerBefore.id}';`,
    )[0]
    report.referrerAfterConfirm = referrerFinal
    const ptsOk = referrerFinal.points_total === report.referrerBefore.points_total + 50
    const countOk = referrerFinal.referral_count_pre_bronze === report.referrerBefore.referral_count_pre_bronze + 1
    step(
      'Indicador recebeu +50 pontos',
      ptsOk,
      `${report.referrerBefore.points_total} → ${referrerFinal.points_total}`,
    )
    step(
      'Contador de indicações +1',
      countOk,
      `${report.referrerBefore.referral_count_pre_bronze} → ${referrerFinal.referral_count_pre_bronze}/3`,
    )
  }

  report.success = report.steps.every((s) => s.ok)
  writeFileSync(resolve(root, 'scripts/test-pp-referral-report.json'), JSON.stringify(report, null, 2))
  console.log('\n=== Relatório salvo em scripts/test-pp-referral-report.json ===\n')
  console.log(JSON.stringify(report, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
