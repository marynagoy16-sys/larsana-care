import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PacienteSubpageShell } from '@/components/paciente/PacienteSubpageShell'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MaskedInput } from '@/components/forms/MaskedInput'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { supabase } from '@/lib/supabase'
import { requiredString, phoneSchema, emailSchema } from '@/schemas/common'

const schema = z.object({
  full_name: requiredString('Nome'),
  email: emailSchema,
  phone: phoneSchema,
})

type FormValues = z.infer<typeof schema>

export function PacientePerfilPage() {
  const navigate = useNavigate()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', email: '', phone: '' },
  })

  const { data: responsible, isLoading } = useQuery({
    queryKey: ['paciente', 'responsible'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_responsibles')
        .select('id, full_name, email, phone')
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as { id: string; full_name: string; email: string; phone: string } | null
    },
  })

  useEffect(() => {
    if (responsible) {
      form.reset({
        full_name: responsible.full_name,
        email: responsible.email,
        phone: responsible.phone,
      })
    }
  }, [responsible, form])

  const update = useCrudMutation({
    mutationFn: async (values: FormValues) => {
      const { error } = await supabase.from('patient_responsibles').update(values).limit(1)
      if (error) throw error
    },
    queryKey: ['paciente', 'responsible'],
    onSuccess: () => navigate('/paciente/conta'),
  })

  const goBack = () => navigate('/paciente/conta')

  const handleCancel = () => {
    if (responsible) {
      form.reset({
        full_name: responsible.full_name,
        email: responsible.email,
        phone: responsible.phone,
      })
    }
    goBack()
  }

  return (
    <PacienteSubpageShell title="Perfil" loading={isLoading} onBack={handleCancel}>
      <div className="space-y-5 pb-8">
        <p className="text-sm text-muted-foreground">Dados do responsável pelo paciente</p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando perfil…</p>
        ) : !responsible ? (
          <p className="text-sm text-muted-foreground">Nenhum responsável vinculado à sua conta.</p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((values) => update.mutate(values))} className="space-y-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-12 lg:h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} className="h-12 lg:h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <MaskedInput mask="phone" value={field.value} onChange={field.onChange} className="h-12 lg:h-10" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-2 pt-2">
                <Button type="submit" className="w-full h-12 lg:h-10" disabled={update.isPending}>
                  {update.isPending ? 'Salvando…' : 'Salvar'}
                </Button>
                <Button type="button" variant="outline" className="w-full h-12 lg:h-10" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        )}
      </div>
    </PacienteSubpageShell>
  )
}
