import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { mapSupabaseError } from '@/lib/supabase-errors'
import { patientKeys } from '@/hooks/queries/usePatients'
import {
  upsertResponsible,
  upsertAddress,
  uploadPatientDocument,
  deletePatientDocument,
} from '@/services/patients'
import type { ResponsibleStepValues, AddressStepValues } from '@/schemas/patient'
import type { Tables } from '@/types/database'

export function useUpsertResponsible(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: ResponsibleStepValues & { id?: string }) =>
      upsertResponsible(patientId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(patientId) })
      toast.success('Responsável salvo')
    },
    onError: (error) => toast.error(mapSupabaseError(error)),
  })
}

export function useUpsertAddress(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: AddressStepValues & { id?: string }) =>
      upsertAddress(patientId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(patientId) })
      toast.success('Endereço salvo')
    },
    onError: (error) => toast.error(mapSupabaseError(error)),
  })
}

export function useUploadPatientDocument(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      file: File
      document_type: Tables<'patient_documents'>['document_type']
    }) => uploadPatientDocument(patientId, input.file, input.document_type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(patientId) })
      toast.success('Documento enviado')
    },
    onError: (error) => toast.error(mapSupabaseError(error)),
  })
}

export function useDeletePatientDocument(patientId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (documentId: string) => deletePatientDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.detail(patientId) })
      toast.success('Documento removido')
    },
    onError: (error) => toast.error(mapSupabaseError(error)),
  })
}
