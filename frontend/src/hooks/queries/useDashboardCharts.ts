import { useQuery } from '@tanstack/react-query'
import {
  fetchPaidRevenueCents,
  fetchRecentCharges,
  fetchRevenueTrend,
} from '@/services/dashboard'

export const dashboardChartKeys = {
  trend: ['dashboard', 'revenue-trend'] as const,
  charges: ['dashboard', 'recent-charges'] as const,
  paid: ['dashboard', 'paid-revenue'] as const,
}

export function useRevenueTrend() {
  return useQuery({
    queryKey: dashboardChartKeys.trend,
    queryFn: () => fetchRevenueTrend(30),
    placeholderData: (previous) => previous,
  })
}

export function useRecentCharges() {
  return useQuery({
    queryKey: dashboardChartKeys.charges,
    queryFn: () => fetchRecentCharges(8),
    placeholderData: (previous) => previous,
  })
}

export function usePaidRevenue() {
  return useQuery({
    queryKey: dashboardChartKeys.paid,
    queryFn: () => fetchPaidRevenueCents(30),
    placeholderData: (previous) => previous,
  })
}
