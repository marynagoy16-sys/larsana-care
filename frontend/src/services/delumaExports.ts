import { supabase } from '@/lib/supabase'

export type DelumaExportRow = {
  id: string
  reference_month: string
  generated_at: string
  file_name: string | null
  file_path: string | null
}

export async function listDelumaExports(limit = 12): Promise<DelumaExportRow[]> {
  const { data, error } = await supabase
    .from('deluma_exports')
    .select('id, reference_month, generated_at, file_name, file_path')
    .order('generated_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as DelumaExportRow[]
}

export function formatDelumaReferenceMonth(referenceMonth: string): string {
  const monthKey = referenceMonth.slice(0, 7)
  const [year, month] = monthKey.split('-').map(Number)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  )
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function matchesDelumaMonth(referenceMonth: string, monthKey: string): boolean {
  return referenceMonth.slice(0, 7) === monthKey
}
