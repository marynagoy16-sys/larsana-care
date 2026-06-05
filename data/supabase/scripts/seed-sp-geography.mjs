/**
 * Popula sp_municipalities e sp_neighborhoods (645 municípios SP + bairros).
 *
 * Uso:
 *   node data/supabase/scripts/seed-sp-geography.mjs              # 8 cidades operacionais
 *   node data/supabase/scripts/seed-sp-geography.mjs --all          # todos os 645 municípios
 *   node data/supabase/scripts/seed-sp-geography.mjs --all --apply  # gera SQL e aplica no Supabase
 *   node data/supabase/scripts/seed-sp-geography.mjs --all --resume # continua do checkpoint
 *   node data/supabase/scripts/seed-sp-geography.mjs --city=São Paulo
 *
 * Saída: data/supabase/migrations/20260606120100_sp_geography_data.sql
 * Checkpoint: data/supabase/scripts/.seed-sp-geography.checkpoint.json
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const OUT = join(__dirname, '..', 'migrations', '20260606120100_sp_geography_data.sql')
const CHECKPOINT = join(__dirname, '.seed-sp-geography.checkpoint.json')
const APPLY_SCRIPT = join(__dirname, 'apply-sql-remote.mjs')

const PHOTON_PREFIXES = [
  'Centro', 'Vila', 'Jardim', 'Parque', 'Cidade', 'Conjunto', 'Cohab',
  'São', 'Santa', 'Santo', 'Alto', 'Bairro', 'Chácara', 'Sítio', 'Recanto', 'Nova',
]

const OPERATIONAL_CITIES = [
  'Mauá', 'Ribeirão Pires', 'Rio Grande da Serra', 'Diadema',
  'Santo André', 'São Bernardo do Campo', 'São Caetano do Sul', 'São Paulo',
]

const NOMINATIM_DELAY_MS = 1100
const PHOTON_DELAY_MS = 100
const RETRY_DELAY_MS = 3000
const MAX_RETRIES = 3

function esc(value) {
  return String(value).replace(/'/g, "''")
}

function normalizeName(value) {
  return value.trim().replace(/\s+/g, ' ')
}

function titleCase(value) {
  return normalizeName(value)
    .toLowerCase()
    .replace(/(^|\s)(\S)/g, (_, space, char) => space + char.toUpperCase())
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function municipalityUuid(ibgeCode) {
  const suffix = String(ibgeCode).padStart(12, '0')
  return `d1000000-0000-4000-8000-${suffix}`
}

function loadCheckpoint() {
  if (!existsSync(CHECKPOINT)) return { completed: {} }
  try {
    return JSON.parse(readFileSync(CHECKPOINT, 'utf8'))
  } catch {
    return { completed: {} }
  }
}

function saveCheckpoint(checkpoint) {
  writeFileSync(CHECKPOINT, JSON.stringify(checkpoint, null, 2), 'utf8')
}

async function fetchWithRetry(label, fn) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === MAX_RETRIES) throw error
      console.warn(`  retry ${attempt}/${MAX_RETRIES} (${label}): ${error.message}`)
      await sleep(RETRY_DELAY_MS * attempt)
    }
  }
}

async function fetchSpMunicipalities() {
  const res = await fetchWithRetry('IBGE municípios', () =>
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/35/municipios?orderBy=nome'),
  )
  if (!res.ok) throw new Error(`IBGE municípios: ${res.status}`)
  return res.json()
}

async function fetchIbgeDistrictNames(ibgeId, municipalityName) {
  const names = new Set()
  for (const type of ['distritos', 'subdistritos']) {
    const res = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${ibgeId}/${type}`,
    )
    if (!res.ok) continue
    const data = await res.json()
    for (const item of data) {
      const name = normalizeName(item.nome)
      if (name && name.localeCompare(municipalityName, 'pt-BR', { sensitivity: 'accent' }) !== 0) {
        names.add(titleCase(name))
      }
    }
  }
  return names
}

async function fetchCityBoundingBox(cityName) {
  await sleep(NOMINATIM_DELAY_MS)
  const params = new URLSearchParams({
    city: cityName,
    state: 'São Paulo',
    country: 'Brazil',
    format: 'json',
    limit: '1',
  })
  const res = await fetchWithRetry(`Nominatim ${cityName}`, () =>
    fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': 'LarsanaCare-Seed/1.0 (admin@larsana.care)' },
    }),
  )
  if (!res.ok) return null
  const results = await res.json()
  const bbox = results[0]?.boundingbox
  if (!bbox || bbox.length !== 4) return null
  const [south, north, west, east] = bbox.map(Number)
  if ([south, north, west, east].some((n) => !Number.isFinite(n))) return null
  return [west, south, east, north]
}

async function fetchPhotonNeighborhoods(cityName, bbox) {
  const names = new Set()
  const [west, south, east, north] = bbox
  for (const prefix of PHOTON_PREFIXES) {
    const params = new URLSearchParams({
      q: prefix,
      bbox: `${west},${south},${east},${north}`,
      limit: '50',
    })
    const res = await fetchWithRetry(`Photon ${cityName}/${prefix}`, () =>
      fetch(`https://photon.komoot.io/api/?${params}`),
    )
    if (!res.ok) continue
    const data = await res.json()
    for (const feature of data.features ?? []) {
      const props = feature.properties ?? {}
      if (props.city !== cityName) continue
      for (const candidate of [props.name, props.district, props.locality].filter(Boolean)) {
        const normalized = normalizeName(candidate)
        if (!normalized) continue
        if (normalized.localeCompare(cityName, 'pt-BR', { sensitivity: 'accent' }) === 0) continue
        names.add(titleCase(normalized))
      }
    }
    await sleep(PHOTON_DELAY_MS)
  }
  return names
}

async function fetchNeighborhoodsForCity(ibgeId, cityName) {
  const names = await fetchIbgeDistrictNames(ibgeId, cityName)
  try {
    const bbox = await fetchCityBoundingBox(cityName)
    if (bbox) {
      const photon = await fetchPhotonNeighborhoods(cityName, bbox)
      photon.forEach((n) => names.add(n))
    }
  } catch (error) {
    console.warn(`\n    aviso OSM (${cityName}): ${error.message}`)
  }
  if (names.size === 0) {
    names.add('Centro')
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'accent' }))
}

function buildMunicipalitiesSql(municipalities) {
  const lines = [
    'INSERT INTO public.sp_municipalities (id, ibge_code, name, state) VALUES',
    municipalities
      .map((m) => {
        const id = municipalityUuid(m.id)
        return `  ('${id}', ${m.id}, '${esc(m.nome)}', 'SP')`
      })
      .join(',\n') + '\nON CONFLICT (ibge_code) DO UPDATE SET name = EXCLUDED.name;',
  ]
  return lines.join('\n')
}

function buildNeighborhoodsSql(municipality, hoods) {
  if (hoods.length === 0) return ''
  const munId = municipalityUuid(municipality.id)
  return [
    `-- ${municipality.nome} (${hoods.length} bairros)`,
    'INSERT INTO public.sp_neighborhoods (municipality_id, name) VALUES',
    hoods.map((name) => `  ('${munId}', '${esc(name)}')`).join(',\n') +
      '\nON CONFLICT (municipality_id, name) DO NOTHING;',
  ].join('\n')
}

async function applySqlFile() {
  const { spawn } = await import('node:child_process')
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [APPLY_SCRIPT, 'data/supabase/migrations/20260606120100_sp_geography_data.sql'],
      { cwd: ROOT, stdio: 'inherit', shell: false },
    )
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`apply exit ${code}`))))
    child.on('error', reject)
  })
}

async function main() {
  const args = process.argv.slice(2)
  const allCities = args.includes('--all')
  const cityFilter = args.find((a) => a.startsWith('--city='))?.split('=')[1]
  const onlyNeighborhoods = args.includes('--neighborhoods-only')
  const shouldApply = args.includes('--apply')
  const shouldResume = args.includes('--resume')

  console.log('Buscando municípios IBGE (SP)...')
  const municipalities = await fetchSpMunicipalities()
  console.log(`  ${municipalities.length} municípios`)

  const targets = cityFilter
    ? municipalities.filter((m) =>
        m.nome.toLocaleLowerCase('pt-BR').includes(cityFilter.toLocaleLowerCase('pt-BR')),
      )
    : allCities
      ? municipalities
      : municipalities.filter((m) => OPERATIONAL_CITIES.includes(m.nome))

  const checkpoint = shouldResume ? loadCheckpoint() : { completed: {} }
  if (shouldResume) {
    const done = Object.keys(checkpoint.completed).length
    console.log(`Retomando: ${done} município(s) já processado(s) no checkpoint`)
  }

  const neighborhoodBlocks = []

  console.log(`Buscando bairros para ${targets.length} município(s)...`)
  console.log(`  Estimativa: ~${Math.ceil((targets.length * (NOMINATIM_DELAY_MS + PHOTON_PREFIXES.length * PHOTON_DELAY_MS)) / 60000)} min`)

  for (let i = 0; i < targets.length; i++) {
    const municipality = targets[i]
    const key = String(municipality.id)

    if (checkpoint.completed[key]) {
      if (checkpoint.completed[key].sql) {
        neighborhoodBlocks.push(checkpoint.completed[key].sql)
      }
      continue
    }

    process.stdout.write(`  [${i + 1}/${targets.length}] ${municipality.nome}... `)
    try {
      const hoods = await fetchNeighborhoodsForCity(municipality.id, municipality.nome)
      const block = buildNeighborhoodsSql(municipality, hoods)
      console.log(`${hoods.length} bairros`)
      if (block) neighborhoodBlocks.push(block)
      checkpoint.completed[key] = { name: municipality.nome, count: hoods.length, sql: block }
      saveCheckpoint(checkpoint)
    } catch (error) {
      console.log(`ERRO: ${error.message} — pulando, retome com --resume`)
      saveCheckpoint(checkpoint)
      continue
    }
  }

  const lines = [
    '-- LarsanaCare: catálogo SP — gerado por seed-sp-geography.mjs',
    '-- Migration: 20260606120100_sp_geography_data',
    `-- Gerado em: ${new Date().toISOString()}`,
    `-- Municípios: ${municipalities.length} | Bairros buscados em: ${targets.length}`,
    '',
  ]

  if (!onlyNeighborhoods) {
    lines.push(buildMunicipalitiesSql(municipalities))
    lines.push('')
  }

  lines.push(...neighborhoodBlocks)
  if (neighborhoodBlocks.length) lines.push('')

  lines.push('-- Vincula cidades operacionais existentes ao catálogo')
  lines.push(`UPDATE public.cities c
SET sp_municipality_id = m.id
FROM public.sp_municipalities m
WHERE c.state = 'SP'
  AND c.sp_municipality_id IS NULL
  AND c.name = m.name;`)

  writeFileSync(OUT, lines.join('\n'), 'utf8')
  console.log(`\nArquivo gerado: ${OUT}`)
  console.log(`  ${neighborhoodBlocks.length} bloco(s) de bairros`)

  if (shouldApply) {
    console.log('\nAplicando no Supabase remoto...')
    await applySqlFile()
    console.log('Aplicado com sucesso.')
  } else if (allCities) {
    console.log('\nPara aplicar no banco: node data/supabase/scripts/seed-sp-geography.mjs --all --apply')
    console.log('Ou: node data/supabase/scripts/apply-sql-remote.mjs data/supabase/migrations/20260606120100_sp_geography_data.sql')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
