/**
 * Load test: N pacientes concorrentes criando cobrança de avaliação.
 *
 * Pré-requisito:
 *   npx supabase db query --linked -f data/supabase/seed-load-test-assessment-charges.sql
 *
 * Uso:
 *   node scripts/load-test-assessment-charges.mjs
 *   node scripts/load-test-assessment-charges.mjs --patients 50 --concurrency 50
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dataDir = resolve(root, 'data', 'supabase')

const args = process.argv.slice(2)
const patientCount = Number(args[args.indexOf('--patients') + 1] || 100)
const concurrency = Number(args[args.indexOf('--concurrency') + 1] || 10)
const raceConcurrency = Number(args[args.indexOf('--race') + 1] || 30)

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ?? 'https://kispjnlmklzfhxhtdyvm.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpc3Bqbmxta2x6Zmh4aHRkeXZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MjAyODgsImV4cCI6MjA5NjE5NjI4OH0.CcU6bg_o-kjusi3mm185BPIoYQe-321u-oGl-PdSj8w'
const PASSWORD = process.env.E2E_PACIENTE_PASSWORD ?? 'LarsanaCare2026!'

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

function percentile(values, p) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return sorted[Math.max(0, index)]
}

async function runPool(tasks, limit) {
  const results = []
  let index = 0
  async function worker() {
    while (index < tasks.length) {
      const current = index++
      results[current] = await tasks[current]()
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()))
  return results
}

async function createChargeForPatient(patientIndex, attempt = 1) {
  const email = `load-charge+${patientIndex}@larsanacare.test`
  const patientId = `e4100000-0000-4000-8000-${patientIndex.toString(16).padStart(12, '0')}`
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const start = performance.now()
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password: PASSWORD,
  })
  if (loginError) {
    if (/rate limit/i.test(loginError.message) && attempt < 4) {
      await sleep(1500 * attempt)
      return createChargeForPatient(patientIndex, attempt + 1)
    }
    return {
      patientIndex,
      patientId,
      ok: false,
      ms: performance.now() - start,
      error: loginError.message,
      chargeId: null,
      rateLimited: /rate limit/i.test(loginError.message),
    }
  }

  const { data, error } = await supabase.rpc('patient_create_assessment_request_charge', {
    p_payment_method: 'PIX',
  })
  const ms = performance.now() - start

  if (error && /rate limit/i.test(error.message) && attempt < 4) {
    await sleep(1500 * attempt)
    return createChargeForPatient(patientIndex, attempt + 1)
  }

  return {
    patientIndex,
    patientId,
    ok: !error && Boolean(data?.charge_id),
    ms,
    error: error?.message ?? null,
    chargeId: data?.charge_id ?? null,
    alreadyExists: data?.already_exists ?? false,
    alreadyPaid: data?.already_paid ?? false,
    rateLimited: Boolean(error && /rate limit/i.test(error.message)),
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  console.log('\n=== Load test: cobrança de avaliação ===\n')
  console.log(`Pacientes: ${patientCount} | Concorrência: ${concurrency} | Race: ${raceConcurrency}\n`)

  const seeded = dbQuery(
    "SELECT count(*)::int AS n FROM patients WHERE id::text LIKE 'e4100000-%';",
  )[0]?.n ?? 0

  if (seeded < patientCount) {
    console.error(
      `Seed insuficiente (${seeded}/${patientCount}). Rode:\n  npx supabase db query --linked -f data/supabase/seed-load-test-assessment-charges.sql`,
    )
    process.exit(1)
  }

  dbQuery("UPDATE regions SET patient_service_available = true WHERE code IN ('A','B','C');")
  dbQuery(
    "DELETE FROM patient_responsibles pr WHERE pr.user_id::text LIKE 'e4000000-%' AND pr.patient_id::text NOT LIKE 'e4100000-%';",
  )
  dbQuery(
    "DELETE FROM charges WHERE patient_id::text LIKE 'e4100000-%' AND charge_kind = 'assessment_request' AND payment_status = 'pendente';",
  )

  const indices = Array.from({ length: patientCount }, (_, i) => i + 1)
  const tasks = indices.map((i) => () => createChargeForPatient(i))
  const started = performance.now()
  const results = await runPool(tasks, concurrency)
  const totalMs = performance.now() - started

  const okResults = results.filter((r) => r.ok)
  const latencies = okResults.map((r) => r.ms)
  const chargeIds = okResults.map((r) => r.chargeId).filter(Boolean)
  const uniqueCharges = new Set(chargeIds)

  const dupPatients = dbQuery(
    `SELECT patient_id, count(*)::int AS n FROM charges
     WHERE charge_kind = 'assessment_request' AND payment_status = 'pendente'
       AND patient_id::text LIKE 'e4100000-%'
     GROUP BY patient_id HAVING count(*) > 1;`,
  )

  const racePatientIndex = 1
  const racePatientId = `e4100000-0000-4000-8000-${racePatientIndex.toString(16).padStart(12, '0')}`
  dbQuery(
    `DELETE FROM charges WHERE patient_id = '${racePatientId}' AND charge_kind = 'assessment_request' AND payment_status = 'pendente';`,
  )

  const raceTasks = Array.from({ length: raceConcurrency }, () => () =>
    createChargeForPatient(racePatientIndex),
  )
  const raceStarted = performance.now()
  const raceResults = await Promise.all(raceTasks.map((t) => t()))
  const raceMs = performance.now() - raceStarted
  const raceChargeIds = [...new Set(raceResults.filter((r) => r.chargeId).map((r) => r.chargeId))]
  const racePendingCount = dbQuery(
    `SELECT count(*)::int AS n FROM charges WHERE patient_id = '${racePatientId}'
     AND charge_kind = 'assessment_request' AND payment_status = 'pendente';`,
  )[0]?.n ?? 0

  const rateLimited = results.filter((r) => r.rateLimited).length
  const logicErrors = results.filter((r) => !r.ok && !r.rateLimited).length

  const report = {
    generatedAt: new Date().toISOString(),
    config: { patientCount, concurrency, raceConcurrency },
    bulkCreate: {
      totalMs,
      success: okResults.length,
      errors: results.length - okResults.length,
      uniqueChargeIds: uniqueCharges.size,
      duplicateChargeIds: chargeIds.length - uniqueCharges.size,
      duplicatePatientsInDb: dupPatients.length,
      latencyMs: {
        min: latencies.length ? Math.min(...latencies) : 0,
        max: latencies.length ? Math.max(...latencies) : 0,
        avg: latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
        p50: percentile(latencies, 50),
        p95: percentile(latencies, 95),
        p99: percentile(latencies, 99),
      },
      errorSamples: results.filter((r) => !r.ok).slice(0, 5),
      rateLimited,
      logicErrors,
    },
    raceSamePatient: {
      totalMs: raceMs,
      concurrentCalls: raceConcurrency,
      distinctChargeIdsReturned: raceChargeIds.length,
      pendingChargesInDb: racePendingCount,
      ok: racePendingCount <= 1 && raceChargeIds.length <= 1,
    },
    verdict: {
      noDuplicates: dupPatients.length === 0 && racePendingCount <= 1,
      bulkOk: false,
      raceOk: racePendingCount <= 1 && raceChargeIds.length <= 1,
      overallOk: false,
    },
  }

  report.verdict.bulkOk = okResults.length >= patientCount * 0.9
  report.verdict.overallOk = report.verdict.noDuplicates && report.verdict.raceOk

  const reportPath = resolve(root, 'scripts', 'load-test-assessment-charges-report.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log(`Sucesso bulk: ${okResults.length}/${patientCount} (rate limit: ${rateLimited}, lógica: ${logicErrors})`)
  console.log(`Duplicatas no DB: ${dupPatients.length} pacientes`)
  console.log(
    `Race (${raceConcurrency}x mesmo paciente): ${racePendingCount} cobrança(s) pendente(s), p95 bulk ${report.bulkCreate.latencyMs.p95.toFixed(0)}ms`,
  )
  console.log(`\nRelatório: scripts/load-test-assessment-charges-report.json`)
  console.log(report.verdict.overallOk ? '✅ LOAD TEST OK' : '❌ LOAD TEST COM PROBLEMAS')

  process.exit(report.verdict.overallOk ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
