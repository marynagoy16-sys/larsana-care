import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { mapSupabaseError } from '@/lib/supabase-errors'
import { patientKeys } from '@/hooks/queries/usePatients'
import {
  createPatientWizard,
  deletePatient,
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
    onSuccess: (data: Patient) => {
      queryClient.invalidateQueries({ queryKey: patientKeys.all })
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(data.id) })
      toast.success('Paciente atualizado')
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
