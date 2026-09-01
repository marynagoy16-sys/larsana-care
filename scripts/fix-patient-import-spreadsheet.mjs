/**
 * Corrige modelo_importacao_pacientes.xlsx:
 * - CPF/data como texto
 * - clinical_summary na coluna correta
 * - enums normalizados (N1/N2/N3, Região A -> A)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const inputPath = resolve(root, 'modelo_importacao_pacientes.xlsx')
const outputPath = resolve(root, 'modelo_importacao_pacientes.xlsx')

function normalizeDigits(value, max = 11) {
  if (value == null || value === '') return ''
  let raw = String(value).trim()
  if (/^[\d,.]+[eE][+\-]?\d+$/.test(raw)) raw = String(Math.trunc(Number(raw)))
  return raw.replace(/\D/g, '').slice(0, max)
}

function normalizeBirthDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10)
  if (typeof value === 'number' && value > 1000) {
    return new Date(Math.round((value - 25569) * 86400 * 1000)).toISOString().slice(0, 10)
  }
  const raw = String(value ?? '').trim()
  if (/^\d+(\.\d+)?$/.test(raw) && Number(raw) > 1000) return normalizeBirthDate(Number(raw))
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  const br = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (br) return `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}`
  return raw
}

function normalizeLevel(value) {
  const raw = String(value ?? '').trim().toUpperCase()
  if (/^N[123]$/.test(raw)) return raw
  const m = raw.match(/N[ÍI]VEL\s*(\d)/)
  return m ? `N${m[1]}` : raw || 'N1'
}

function normalizeRegion(value) {
  const raw = String(value ?? '').trim().toUpperCase()
  if (/^[ABC]$/.test(raw)) return raw
  const m = raw.match(/REGI[ÃA]O\s*([ABC])/)
  return m ? m[1] : raw
}

const workbook = XLSX.read(readFileSync(inputPath), { type: 'buffer', cellDates: true })
const sheetName = workbook.SheetNames[0]
const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' })

const fixed = rows.map((row) => {
  const next = { ...row }
  next.cpf = normalizeDigits(next.cpf)
  next.birth_date = normalizeBirthDate(next.birth_date)
  next.patient_level = normalizeLevel(next.patient_level)
  next.region_code = normalizeRegion(next.region_code)

  const asaas = String(next.asaas_customer_id ?? '').trim()
  const clinical = String(next.clinical_summary ?? '').trim()
  if (asaas.length > 50 && !clinical) {
    next.clinical_summary = asaas
    next.asaas_customer_id = ''
  }

  return next
})

const outSheet = XLSX.utils.json_to_sheet(fixed)
const outBook = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(outBook, outSheet, sheetName)
writeFileSync(outputPath, XLSX.write(outBook, { type: 'buffer', bookType: 'xlsx' }))
console.log(`Planilha corrigida: ${fixed.length} linhas -> ${outputPath}`)
