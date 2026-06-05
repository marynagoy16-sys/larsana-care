import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export const dashboardKeys = {
  kpis: ['dashboard', 'kpis'] as const,
}

export async function fetchDashboardKpis() {
  const { data, error } = await supabase.from('dashboard_kpis').select('*').single()
  if (error) throw error
  return data
}

export function useDashboardKpis() {
  return useQuery({
    queryKey: dashboardKeys.kpis,
    queryFn: fetchDashboardKpis,
    placeholderData: (previous) => previous,
  })
}
