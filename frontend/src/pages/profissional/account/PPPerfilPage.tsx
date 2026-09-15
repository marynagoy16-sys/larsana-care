import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { PPAccountSubpageHeader } from '@/components/profissional/account/PPAccountSubpageHeader'
import { AccountDeletionSection } from '@/components/account/AccountDeletionSection'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { credentialingStatusLabels, professionTypeLabels } from '@/constants/labels'
import { useAuth } from '@/hooks/useAuth'
import {
  softFieldButtonClass,
  softFieldInputClass,
  softFieldLabelClass,
  softFieldSelectClass,
} from '@/lib/formFieldStyles'
import { ppProfileSchema, type PpProfileValues } from '@/schemas/ppProfile'
import { savePpProfile } from '@/services/professionalAccount'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-2">
      <p className={softFieldLabelClass}>{label}</p>
      <div className={cn(softFieldInputClass, 'flex items-center text-foreground')}>{value}</div>
    </div>
  )
}

export function PPPerfilPage() {
  const queryClient = useQueryClient()
  const { profile, refreshProfile } = useAuth()

  const { data: professional, isLoading } = useQuery({
    queryKey: ['pp', 'profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data, error } = await supabase
        .from('professionals')
        .select('id, full_name, email, profession, credentialing_status')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  const form = useForm<PpProfileValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(ppProfileSchema) as any,
    values: {
      full_name: professional?.full_name ?? '',
      email: professional?.email ?? profile?.email ?? '',
      profession: (professional?.profession ?? 'FISIO') as PpProfileValues['profession'],
    },
    mode: 'onBlur',
  })

  const saveMutation = useMutation({
    mutationFn: savePpProfile,
    onSuccess: async () => {
      await refreshProfile()
      await queryClient.invalidateQueries({ queryKey: ['pp', 'profile'] })
      toast.success('Perfil atualizado.')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar o perfil.')
    },
  })

  const credentialingLabel =
    credentialingStatusLabels[professional?.credentialing_status ?? ''] ??
    professional?.credentialing_status ??
    '—'

  return (
    <>
      <PPAccountSubpageHeader title="Perfil" loading={isLoading} />

      <CrudScrollPageLayout>
        {isLoading ? (
          <DetailPageSkeleton fields={4} />
        ) : (
          <div className="space-y-4 pb-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={softFieldLabelClass}>Nome completo</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="name" className={softFieldInputClass} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={softFieldLabelClass}>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          autoComplete="email"
                          className={softFieldInputClass}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="profession"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className={softFieldLabelClass}>Profissão</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className={softFieldSelectClass}>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(professionTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <ReadOnlyField label="Credenciamento" value={credentialingLabel} />

                <Button type="submit" className={softFieldButtonClass} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Salvando…' : 'Salvar alterações'}
                </Button>
              </form>
            </Form>

            <AccountDeletionSection />
          </div>
        )}
      </CrudScrollPageLayout>
    </>
  )
}
