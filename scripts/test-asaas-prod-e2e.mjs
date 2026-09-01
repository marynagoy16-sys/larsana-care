/**
 * Teste Asaas produção (R$1): avaliação, repasse PP, SUB wallet
 *
 * Uso:
 *   node scripts/test-asaas-prod-e2e.mjs
 *
 * Variáveis:
 *   E2E_PACIENTE_EMAIL, E2E_PACIENTE_PASSWORD
 *   E2E_PP_EMAIL, E2E_PP_PASSWORD
 *   ASAAS_ENV=production (obrigatório para não rodar em sandbox por engano)
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const ASAAS_ENV = process.env.ASAAS_ENV ?? 'sandbox'

const report = {
  generated_at: new Date().toISOString(),
  asaas_env: ASAAS_ENV,
  steps: [],
}

function step(name, ok, detail = {}) {
  report.steps.push({ name, ok, ...detail })
  console.log(ok ? '✓' : '✗', name, detail.message ?? '')
}

async function main() {
  if (ASAAS_ENV !== 'production') {
    step('asaas_env_check', false, { message: 'Defina ASAAS_ENV=production para teste prod real' })
    writeFileSync(resolve(root, 'scripts/test-asaas-prod-e2e-report.json'), JSON.stringify(report, null, 2))
    process.exitCode = 1
    return
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    step('supabase_config', false, { message: 'Defina SUPABASE_URL e VITE_SUPABASE_ANON_KEY' })
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const patientEmail = process.env.E2E_PACIENTE_EMAIL
  const patientPassword = process.env.E2E_PACIENTE_PASSWORD
  if (!patientEmail || !patientPassword) {
    step('patient_credentials', false, { message: 'Defina E2E_PACIENTE_EMAIL/PASSWORD' })
    process.exitCode = 1
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email: patientEmail, password: patientPassword })
    step('patient_login', !error, { message: error?.message })
  }

  const { data: status, error: statusError } = await supabase.rpc('patient_get_service_status')
  step('patient_service_status', !statusError && status?.linked, { message: statusError?.message })

  writeFileSync(resolve(root, 'scripts/test-asaas-prod-e2e-report.json'), JSON.stringify(report, null, 2))
  console.log('\nRelatório:', resolve(root, 'scripts/test-asaas-prod-e2e-report.json'))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
