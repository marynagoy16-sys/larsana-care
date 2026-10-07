import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { mapSupabaseError } from '@/lib/supabase-errors'
import { patientKeys } from '@/hooks/queries/usePatients'
import {
  createPatientWizard,
  deletePatient,
  setPatientsActive,
  updatePatient,
  type Patient,
} from '@/services/patients'
import type { PatientWizardValues } from '@/schemas/patient'
import type { TablesUpdate } from '@/types/database'

export function useCreatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      values,
      pendingFiles = [],
    }: {
      values: PatientWizardValues
      pendingFiles?: { file: File; document_type: import('@/types/database').Tables<'patient_documents'>['document_type'] }[]
    }) => createPatientWizard(values, pendingFiles),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.all })
      toast.success('Paciente cadastrado com sucesso')
    },
    onError: (error) => toast.error(mapSupabaseError(error)),
  })
}

export function useUpdatePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: TablesUpdate<'patients'> }) =>
      updatePatient(id, values),
    onSuccess: async (data: Patient) => {
      queryClient.setQueryData(patientKeys.detail(data.id), (current: Patient | undefined) =>
        current ? { ...current, ...data } : current,
      )
      await queryClient.invalidateQueries({ queryKey: patientKeys.all })
      toast.success('Paciente atualizado')
    },
    onError: (error) => toast.error(mapSupabaseError(error)),
  })
}

export function useSetPatientsActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ ids, isActive }: { ids: string[]; isActive: boolean }) => setPatientsActive(ids, isActive),
    onSuccess: (_data, { ids, isActive }) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.all })
      const count = ids.length
      const verb = isActive ? 'ativado' : 'inativado'
      toast.success(count === 1 ? `Paciente ${verb}` : `${count} pacientes ${isActive ? 'ativados' : 'inativados'}`)
    },
    onError: (error) => toast.error(mapSupabaseError(error)),
  })
}

export function useDeletePatient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePatient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.all })
      toast.success('Paciente excluído')
    },
    onError: (error) => toast.error(mapSupabaseError(error)),
  })
}
