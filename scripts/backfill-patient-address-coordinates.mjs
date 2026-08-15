/**
 * Geocodifica retroativamente endereços de pacientes sem latitude/longitude.
 *
 * Uso:
 *   node scripts/backfill-patient-address-coordinates.mjs
 *
 * Requer Supabase CLI linkado (supabase link) em data/supabase.
 */

import { execSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const supabaseDir = resolve(root, 'data/supabase')

const NOMINATIM_DELAY_MS = 1100

const CITY_FALLBACKS = {
  'Mauá': { lat: -23.6678, lng: -46.4614 },
  Diadema: { lat: -23.6861, lng: -46.6228 },
  'São Paulo': { lat: -23.5505, lng: -46.6333 },
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms))
}

function normalizeCep(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function buildGeocodeQueries(row) {
  const city = row.city_name
  const state = row.city_state
  const queries = []

  if (row.full_address) queries.push(`${row.full_address}, Brasil`)

  const streetLine = [row.street, row.number].filter(Boolean).join(', ')
  if (streetLine && city) {
    queries.push([streetLine, row.neighborhood, `${city}/${state}`, 'Brasil'].filter(Boolean).join(', '))
  }

  const cep = normalizeCep(row.postal_code)
  if (cep.length === 8 && city) {
    queries.push(`${cep}, ${city}, ${state}, Brasil`)
  }

  if (row.neighborhood && city) {
    queries.push(`${row.neighborhood}, ${city}, ${state}, Brasil`)
  }

  if (city) {
    queries.push(`${city}, ${state}, Brasil`)
  }

  return [...new Set(queries.map((query) => query.trim()).filter(Boolean))]
}

function dbQuery(sql) {
  const tempDir = mkdtempSync(join(tmpdir(), 'larsana-sql-'))
  const tempFile = join(tempDir, 'query.sql')
  writeFileSync(tempFile, sql, 'utf8')

  try {
    const output = execSync(
      `npx supabase db query --linked --output-format json -f ${JSON.stringify(tempFile)}`,
      {
        cwd: supabaseDir,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    )

    const jsonStart = output.indexOf('{')
    if (jsonStart === -1) {
      throw new Error(`Resposta inesperada do CLI:\n${output}`)
    }

    const payload = JSON.parse(output.slice(jsonStart))
    if (payload._tag === 'Error') {
      throw new Error(payload.error?.message ?? JSON.stringify(payload.error))
    }

    return payload.rows ?? []
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

async function geocodeAddress(query) {
  const trimmed = query.trim()
  if (!trimmed) return null

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1&countrycodes=br`,
    {
      headers: {
        'Accept-Language': 'pt-BR,pt',
        'User-Agent': 'LarsanaCare-Backfill/1.0 (dev geocoding)',
      },
    },
  )

  if (!response.ok) return null

  const results = await response.json()
  const hit = results[0]
  if (!hit) return null

  return { lat: Number(hit.lat), lng: Number(hit.lon), query: trimmed }
}

async function resolveCoordinates(row) {
  const queries = buildGeocodeQueries(row)

  for (const query of queries) {
    const point = await geocodeAddress(query)
    await sleep(NOMINATIM_DELAY_MS)
    if (point) return { ...point, strategy: 'nominatim' }
  }

  const fallback = CITY_FALLBACKS[row.city_name]
  if (fallback) {
    return {
      lat: fallback.lat,
      lng: fallback.lng,
      query: `${row.city_name} (centro aproximado)`,
      strategy: 'city_fallback',
    }
  }

  return null
}

function escapeSql(value) {
  return value.replace(/'/g, "''")
}

async function main() {
  console.log('=== Backfill de coordenadas — patient_addresses ===')

  const pending = dbQuery(`
    SELECT
      pa.id,
      pa.full_address,
      pa.street,
      pa.number,
      pa.neighborhood,
      pa.postal_code,
      c.name AS city_name,
      c.state AS city_state,
      p.full_name AS patient_name
    FROM public.patient_addresses pa
    JOIN public.patients p ON p.id = pa.patient_id
    LEFT JOIN public.cities c ON c.id = pa.city_id
    WHERE pa.latitude IS NULL OR pa.longitude IS NULL
    ORDER BY pa.is_primary DESC, pa.updated_at DESC
  `)

  if (pending.length === 0) {
    console.log('Nenhum endereço pendente de geocodificação.')
    return
  }

  console.log(`Encontrados ${pending.length} endereço(s) sem coordenadas.`)

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of pending) {
    process.stdout.write(`Geocodificando ${row.patient_name ?? row.id}... `)

    const point = await resolveCoordinates(row)

    if (!point) {
      console.log('sem resultado')
      skipped += 1
      continue
    }

    dbQuery(`
      UPDATE public.patient_addresses
      SET
        latitude = ${point.lat},
        longitude = ${point.lng},
        updated_at = now()
      WHERE id = '${escapeSql(row.id)}'::uuid
    `)

    console.log(`${point.strategy} → ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)} (${point.query})`)
    updated += 1
  }

  const remaining = dbQuery(`
    SELECT count(*)::int AS pending
    FROM public.patient_addresses
    WHERE latitude IS NULL OR longitude IS NULL
  `)

  console.log('\n--- Resumo ---')
  console.log(`Atualizados: ${updated}`)
  console.log(`Sem geocode: ${skipped}`)
  console.log(`Falhas: ${failed}`)
  console.log(`Pendentes restantes: ${remaining[0]?.pending ?? '?'}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
