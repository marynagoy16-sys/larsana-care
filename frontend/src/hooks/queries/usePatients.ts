import { useQuery } from '@tanstack/react-query'
import { getPatient, getPatientStats, listPatients, type PatientFilters } from '@/services/patients'

export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  list: (filters: PatientFilters) => [...patientKeys.lists(), filters] as const,
  stats: () => [...patientKeys.all, 'stats'] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
}

export function usePatientStats() {
  return useQuery({
    queryKey: patientKeys.stats(),
    queryFn: getPatientStats,
  })
}

export function usePatients(filters: PatientFilters = {}) {
  return useQuery({
    queryKey: patientKeys.list(filters),
    queryFn: () => listPatients(filters),
    placeholderData: (previous) => previous,
  })
}

export function usePatient(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: patientKeys.detail(id ?? ''),
    queryFn: () => getPatient(id!),
    enabled: enabled && !!id,
  })
}
