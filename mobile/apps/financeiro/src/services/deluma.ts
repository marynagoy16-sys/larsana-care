import { createCrudService } from '@/lib/createCrudService'
import { supabase } from '@/lib/supabase'

export const delumaExportsService = createCrudService('deluma_exports')

export type DelumaExportItem = {
  id: string
  reference_month: string
  generated_at: string
  file_name: string | null
}

export async function listDelumaExports(): Promise<DelumaExportItem[]> {
  const { data, error } = await supabase
    .from('deluma_exports')
    .select('id, reference_month, generated_at, file_name')
    .order('generated_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as DelumaExportItem[]
}

export async function getLatestDelumaExport(): Promise<DelumaExportItem | null> {
  const { data, error } = await supabase
    .from('deluma_exports')
    .select('id, reference_month, generated_at, file_name')
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as DelumaExportItem | null
}
