import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export const dashboardKeys = {
  kpis: ['dashboard', 'kpis'] as const,
}

export async function fetchDashboardKpis() {
  const [kpisRes, countRes] = await Promise.all([
    supabase.from('dashboard_kpis').select('*').single(),
    supabase.from('professionals')
      .select('*', { count: 'exact', head: true })
      .eq('profession', 'FISIO')
      .eq('credentialing_status', 'ativo')
  ])

  if (kpisRes.error) throw kpisRes.error
  if (countRes.error) throw countRes.error

  return {
    ...kpisRes.data,
    fisioterapeutas_ativos: countRes.count ?? 0,
  }
}

export function useDashboardKpis() {
  return useQuery({
    queryKey: dashboardKeys.kpis,
    queryFn: fetchDashboardKpis,
    placeholderData: (previous) => previous,
  })
}
