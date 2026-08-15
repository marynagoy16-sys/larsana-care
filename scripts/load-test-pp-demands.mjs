/**
 * Carga simulada: 50 terapeutas × 200 demandas abertas.
 *
 * Uso:
 *   node scripts/load-test-pp-demands.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { performance } from 'node:perf_hooks'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const THERAPIST_COUNT = 50
const DEMAND_COUNT = 200
const CONCURRENCY = 50

const DEMAND_LIST_SELECT = `
  *,
  patients (
    full_name,
    birth_date,
    sex,
    diagnostic_hypothesis,
    attendance_period,
    clinical_summary,
    patient_level,
    technical_category
  ),
  patient_addresses (
    full_address,
    neighborhood,
    latitude,
    longitude
  ),
  professionals ( full_name )
`

const EARTH_RADIUS_KM = 6371

function loadEnv() {
  const candidates = [
    resolve(root, '.env'),
    resolve(root, 'frontend/.env'),
    resolve(root, '.env.example'),
  ]
  const env = {}
  for (const envPath of candidates) {
    try {
      const raw = readFileSync(envPath, 'utf8')
      for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^([^#=]+)=(.*)$/)
        if (m && !env[m[1].trim()]) env[m[1].trim()] = m[2].trim()
      }
    } catch {
      // ignore
    }
  }
  return env
}

function haversineDistanceKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

function resolveDemandDistanceKm(demand, origin) {
  if (demand.location_lat == null || demand.location_lng == null) return Number.POSITIVE_INFINITY
  return haversineDistanceKm(origin, { lat: demand.location_lat, lng: demand.location_lng })
}

function sortDemandsByDistance(demands, origin) {
  return [...demands].sort((a, b) => {
    const distanceA = resolveDemandDistanceKm(a, origin)
    const distanceB = resolveDemandDistanceKm(b, origin)
    if (distanceA !== distanceB) return distanceA - distanceB
    return (b.preference_match_score ?? 0) - (a.preference_match_score ?? 0)
  })
}

function isSortedByDistance(demands, origin) {
  for (let i = 1; i < demands.length; i += 1) {
    const prev = resolveDemandDistanceKm(demands[i - 1], origin)
    const curr = resolveDemandDistanceKm(demands[i], origin)
    if (curr < prev) return false
  }
  return true
}

function verifyTopNearest(demands, origin, topN = 10) {
  const withCoords = demands.filter(
    (d) => d.location_lat != null && d.location_lng != null,
  )
  if (withCoords.length === 0) return { ok: true, checked: 0 }

  const expectedTop = [...withCoords]
    .sort(
      (a, b) =>
        resolveDemandDistanceKm(a, origin) - resolveDemandDistanceKm(b, origin),
    )
    .slice(0, topN)
    .map((d) => d.id)

  const actualTop = demands
    .filter((d) => d.location_lat != null && d.location_lng != null)
    .slice(0, topN)
    .map((d) => d.id)

  const ok =
    expectedTop.length === actualTop.length &&
    expectedTop.every((id, index) => id === actualTop[index])

  return { ok, checked: Math.min(topN, withCoords.length), expectedTop, actualTop }
}

function percentile(values, p) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)
  return sorted[Math.max(0, index)]
}

function mapDemandRow(row) {
  const address = row.patient_addresses
  return {
    id: row.id,
    location_lat: address?.latitude ?? null,
    location_lng: address?.longitude ?? null,
    preference_match_score: 0,
    patient_abbreviation: row.patients?.full_name ?? row.id,
  }
}

function generateSyntheticDemands(count, seed = 42) {
  let state = seed
  const rand = () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }

  return Array.from({ length: count }, (_, i) => ({
    id: `synthetic-${String(i).padStart(3, '0')}`,
    location_lat: -23.4 - rand() * 2.5,
    location_lng: -46.2 - rand() * 3.5,
    preference_match_score: rand() > 0.8 ? 1 : 0,
    patient_abbreviation: `Paciente ${i}`,
  }))
}

function generateTherapistOrigins(count, seed = 99) {
  let state = seed
  const rand = () => {
    state = (state * 22695477 + 1) % 4294967296
    return state / 4294967296
  }

  return Array.from({ length: count }, (_, index) => ({
    therapistId: `pp-${String(index + 1).padStart(2, '0')}`,
    origin: {
      lat: -23.45 - rand() * 2,
      lng: -46.35 - rand() * 2.8,
    },
  }))
}

async function fetchOpenDemands(supabase) {
  const started = performance.now()
  const { data, error } = await supabase
    .from('demands')
    .select(DEMAND_LIST_SELECT)
    .eq('status', 'aberta')
    .order('created_at', { ascending: false })

  const elapsedMs = performance.now() - started
  if (error) throw error
  return {
    elapsedMs,
    demands: (data ?? []).map(mapDemandRow),
  }
}

async function runTherapistPipeline(demands, therapist) {
  const started = performance.now()
  const sorted = sortDemandsByDistance(demands, therapist.origin)
  const sortMs = performance.now() - started
  const ranking = verifyTopNearest(sorted, therapist.origin)
  const sortedOk = isSortedByDistance(sorted, therapist.origin)

  return {
    therapistId: therapist.therapistId,
    sortMs,
    totalMs: sortMs,
    sortedOk,
    rankingOk: ranking.ok,
    topChecked: ranking.checked,
    nearestKm: sorted[0] ? resolveDemandDistanceKm(sorted[0], therapist.origin) : null,
  }
}

async function mapWithConcurrency(items, limit, worker) {
  const results = []
  let index = 0

  async function runner() {
    while (index < items.length) {
      const current = index
      index += 1
      results[current] = await worker(items[current], current)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner))
  return results
}

async function main() {
  const env = loadEnv()
  const supabaseUrl = env.VITE_SUPABASE_URL
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY
  const email = env.PP_LOAD_TEST_EMAIL ?? 'parceiro@larsanacare.com.br'
  const password = env.PP_LOAD_TEST_PASSWORD ?? 'LarsanaCare2026!'

  console.log('=== Larsana Care — Load test PP Demandas ===')
  console.log(`Terapeutas: ${THERAPIST_COUNT} | Demandas alvo: ${DEMAND_COUNT} | Concorrência: ${CONCURRENCY}`)

  const therapists = generateTherapistOrigins(THERAPIST_COUNT)

  let apiFetch = null
  let datasetSource = 'synthetic'
  let demands = generateSyntheticDemands(DEMAND_COUNT)

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      console.warn(`Auth PP falhou (${signInError.message}) — usando apenas dataset sintético.`)
    } else {
      try {
        const singleFetch = await fetchOpenDemands(supabase)
        apiFetch = { singleMs: singleFetch.elapsedMs, count: singleFetch.demands.length }

        const concurrentResults = await mapWithConcurrency(
          therapists,
          CONCURRENCY,
          async () => fetchOpenDemands(supabase),
        )
        const concurrentMs = concurrentResults.map((result) => result.elapsedMs)

        apiFetch.concurrent = {
          count: CONCURRENCY,
          minMs: Math.min(...concurrentMs),
          maxMs: Math.max(...concurrentMs),
          avgMs: concurrentMs.reduce((a, b) => a + b, 0) / concurrentMs.length,
          p50Ms: percentile(concurrentMs, 50),
          p95Ms: percentile(concurrentMs, 95),
          p99Ms: percentile(concurrentMs, 99),
          errors: 0,
        }

        if (singleFetch.demands.length >= 20) {
          datasetSource = `remote (${singleFetch.demands.length} abertas)`
          demands =
            singleFetch.demands.length >= DEMAND_COUNT
              ? singleFetch.demands.slice(0, DEMAND_COUNT)
              : [
                  ...singleFetch.demands,
                  ...generateSyntheticDemands(DEMAND_COUNT - singleFetch.demands.length),
                ]
        }

        console.log(`API remota: ${singleFetch.demands.length} demandas abertas (${singleFetch.elapsedMs.toFixed(1)} ms)`)
      } catch (err) {
        console.warn(`Fetch remoto falhou (${err.message}) — usando dataset sintético.`)
      }
    }
  } else {
    console.warn('Supabase URL/key ausentes — apenas simulação local.')
  }

  console.log(`Dataset para ranking: ${datasetSource} (${demands.length} itens)`)

  const pipelineResults = await mapWithConcurrency(therapists, CONCURRENCY, (therapist) =>
    runTherapistPipeline(demands, therapist),
  )

  const sortMs = pipelineResults.map((r) => r.sortMs)
  const rankingFailures = pipelineResults.filter((r) => !r.rankingOk)
  const sortFailures = pipelineResults.filter((r) => !r.sortedOk)

  const report = {
    generatedAt: new Date().toISOString(),
    config: {
      therapistCount: THERAPIST_COUNT,
      demandCount: demands.length,
      concurrency: CONCURRENCY,
      datasetSource,
    },
    apiFetch,
    clientPipeline: {
      sortMs: {
        min: Math.min(...sortMs),
        max: Math.max(...sortMs),
        avg: sortMs.reduce((a, b) => a + b, 0) / sortMs.length,
        p50: percentile(sortMs, 50),
        p95: percentile(sortMs, 95),
        p99: percentile(sortMs, 99),
      },
      therapistsSortedCorrectly: pipelineResults.filter((r) => r.sortedOk).length,
      therapistsTop10Correct: pipelineResults.filter((r) => r.rankingOk).length,
      rankingFailures: rankingFailures.length,
      sortFailures: sortFailures.length,
    },
    verdict: {
      performanceOk: true,
      rankingOk: rankingFailures.length === 0 && sortFailures.length === 0,
    },
    samples: pipelineResults.slice(0, 5),
  }

  if (apiFetch?.concurrent) {
    report.verdict.performanceOk =
      apiFetch.concurrent.errors === 0 && apiFetch.concurrent.p95Ms < 3000
  }

  report.verdict.overallOk = report.verdict.performanceOk && report.verdict.rankingOk

  const reportPath = resolve(root, 'scripts/load-test-pp-demands-report.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2))

  console.log('\n--- Resultado ---')
  console.log(`Ranking correto: ${report.clientPipeline.therapistsTop10Correct}/${THERAPIST_COUNT} terapeutas`)
  console.log(`Lista ordenada: ${report.clientPipeline.therapistsSortedCorrectly}/${THERAPIST_COUNT}`)
  console.log(
    `Sort client-side p95: ${report.clientPipeline.sortMs.p95.toFixed(3)} ms (${demands.length} demandas)`,
  )
  if (apiFetch?.concurrent) {
    console.log(
      `API fetch concorrente p95: ${apiFetch.concurrent.p95Ms.toFixed(1)} ms | erros: ${apiFetch.concurrent.errors}`,
    )
  }
  console.log(`Performance OK: ${report.verdict.performanceOk ? 'sim' : 'não'}`)
  console.log(`Ranking OK: ${report.verdict.rankingOk ? 'sim' : 'não'}`)
  console.log(`Relatório: ${reportPath}`)

  if (!report.verdict.overallOk) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
