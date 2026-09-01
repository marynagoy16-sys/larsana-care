/**
 * Teste de importação XLSX legada (normalização + RPC bulk_import_*)
 *
 * Uso:
 *   node scripts/test-bulk-import-xlsx.mjs
 *   node scripts/test-bulk-import-xlsx.mjs --dry-run
 *
 * Requer:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (ou login staff via E2E_ADMIN_*)
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const DRY_RUN = process.argv.includes('--dry-run')

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? process.env.E2E_STAFF_EMAIL
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? process.env.E2E_STAFF_PASSWORD

function parseSheet(filePath) {
  const workbook = XLSX.read(readFileSync(filePath), { type: 'buffer', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet, { defval: '' })
}

function normalizeDigits(value, max) {
  if (value == null || value === '') return ''
  let raw = String(value).trim()
  if (/^[\d,.]+[eE][+\-]?\d+$/.test(raw)) raw = String(Math.trunc(Number(raw)))
  const digits = raw.replace(/\D/g, '')
  return max ? digits.slice(0, max) : digits
}

function normalizeBirthDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10)
  if (typeof value === 'number' && value > 1000) {
    const ms = Math.round((value - 25569) * 86400 * 1000)
    return new Date(ms).toISOString().slice(0, 10)
  }
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (/^\d+(\.\d+)?$/.test(raw) && Number(raw) > 1000) return normalizeBirthDate(Number(raw))
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (br) return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`
  return raw
}

function normalizePatientRow(row) {
  const next = {}
  for (const [k, v] of Object.entries(row)) next[k.trim()] = v == null ? '' : String(v).trim()
  if ((next.asaas_customer_id?.length ?? 0) > 50 && !next.clinical_summary) {
    next.clinical_summary = next.asaas_customer_id
    next.asaas_customer_id = ''
  }
  next.cpf = normalizeDigits(next.cpf, 11)
  next.birth_date = normalizeBirthDate(next.birth_date)
  const level = String(next.patient_level ?? '').toUpperCase()
  next.patient_level = /^N[123]$/.test(level) ? level : (level.match(/N[ÍI]VEL\s*(\d)/)?.[1] ? `N${level.match(/N[ÍI]VEL\s*(\d)/)[1]}` : 'N1')
  const region = String(next.region_code ?? '').toUpperCase()
  next.region_code = /^[ABC]$/.test(region) ? region : (region.match(/REGI[ÃA]O\s*([ABC])/)?.[1] ?? region)
  return next
}

function normalizeProfessionalRow(row) {
  const next = {}
  for (const [k, v] of Object.entries(row)) next[k.trim()] = v == null ? '' : String(v).trim()
  next.cpf_cnpj = normalizeDigits(next.cpf_cnpj, 14)
  next.phone = normalizeDigits(next.phone, 11)
  next.patente = (next.patente || 'BRONZE').toUpperCase()
  next.email = next.email.toLowerCase()
  if (next.is_active !== '') next.is_active = ['1', 'true', 'sim', 's'].includes(String(next.is_active).toLowerCase()) ? 'true' : 'false'
  if (next.points_grandfathered !== '') next.points_grandfathered = ['1', 'true', 'sim', 's'].includes(String(next.points_grandfathered).toLowerCase()) ? 'true' : 'false'
  return next
}

async function getClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return supabase
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Defina credenciais staff ou service role')
  const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  if (error) throw error
  return supabase
}

async function runImport(supabase, rpc, rows) {
  const { data, error } = await supabase.rpc(rpc, { p_rows: rows, p_skip_duplicates: true })
  if (error) throw error
  return data
}

async function main() {
  const patientsPath = resolve(root, 'modelo_importacao_pacientes.xlsx')
  const professionalsPath = resolve(root, 'modelo_importacao_profissionais.xlsx')

  const patientRows = parseSheet(patientsPath).map(normalizePatientRow)
  const professionalRows = parseSheet(professionalsPath).map(normalizeProfessionalRow)

  const report = {
    generated_at: new Date().toISOString(),
    dry_run: DRY_RUN,
    patients: { rows: patientRows.length, preview: patientRows.slice(0, 3) },
    professionals: { rows: professionalRows.length, preview: professionalRows.slice(0, 3) },
    results: {},
  }

  if (DRY_RUN) {
    writeFileSync(resolve(root, 'scripts/test-bulk-import-xlsx-report.json'), JSON.stringify(report, null, 2))
    console.log('Dry-run OK:', report.patients.rows, 'pacientes,', report.professionals.rows, 'PPs')
    return
  }

  const supabase = await getClient()
  report.results.patients = await runImport(supabase, 'bulk_import_patients', patientRows)
  report.results.professionals = await runImport(supabase, 'bulk_import_professionals', professionalRows)

  writeFileSync(resolve(root, 'scripts/test-bulk-import-xlsx-report.json'), JSON.stringify(report, null, 2))

  const pErr = report.results.patients.errors?.length ?? 0
  const ppErr = report.results.professionals.errors?.length ?? 0
  console.log('Pacientes:', report.results.patients.created, 'criados,', pErr, 'erros')
  console.log('Profissionais:', report.results.professionals.created, 'criados,', ppErr, 'erros')

  const ppRate = professionalRows.length ? 1 - ppErr / professionalRows.length : 1
  if (ppRate < 0.95) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
