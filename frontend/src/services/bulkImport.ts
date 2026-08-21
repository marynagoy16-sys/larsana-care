import { supabase } from '@/lib/supabase'

export type BulkImportResult = {
  created: number
  errors: Array<{ row: number; message: string; data?: unknown }>
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map((line) => {
    const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? ''
    })
    return row
  })
}

export function parseImportCsvFile(text: string): Record<string, string>[] {
  return parseCsv(text)
}

export async function bulkImportPatients(rows: Record<string, string>[]): Promise<BulkImportResult> {
  const { data, error } = await supabase.rpc('bulk_import_patients', { p_rows: rows })
  if (error) throw error
  return data as BulkImportResult
}

export async function bulkImportProfessionals(rows: Record<string, string>[]): Promise<BulkImportResult> {
  const { data, error } = await supabase.rpc('bulk_import_professionals', { p_rows: rows })
  if (error) throw error
  return data as BulkImportResult
}

export const PATIENT_IMPORT_TEMPLATE = `full_name,cpf,birth_date,patient_level,region_code,city_name,full_address,asaas_customer_id,clinical_summary
Maria Silva,12345678901,1980-05-10,N1,C,Mauá,Rua Exemplo 100,,`

export const PROFESSIONAL_IMPORT_TEMPLATE = `full_name,email,cpf_cnpj,phone,address,patente,crefito_number,contract_number,asaas_wallet_id,credentialing_status,is_active,points_grandfathered
João Fisio,joao@email.com,98765432100,11999999999,Rua PP 50,BRONZE,123456-F,PP-2026-001,c0c1688f-636b-42c0-b6ee-7339182276b7,ativo,true,true`
