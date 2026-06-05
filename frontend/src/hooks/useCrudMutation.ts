import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { mapSupabaseError } from '@/lib/supabase-errors'

interface UseCrudMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  queryKey: readonly unknown[]
  successMessage?: string
  onSuccess?: (data: TData) => void
}

export function useCrudMutation<TData, TVariables>({
  mutationFn,
  queryKey,
  successMessage = 'Salvo com sucesso',
  onSuccess,
}: UseCrudMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey })
      toast.success(successMessage)
      onSuccess?.(data)
    },
    onError: (error) => toast.error(mapSupabaseError(error)),
  })
}
