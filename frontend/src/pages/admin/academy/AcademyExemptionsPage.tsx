import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { CrudModal } from '@/components/crud/CrudModal'
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormActions } from '@/components/crud/FormActions'
import { ProfessionalSearchField } from '@/components/forms/ProfessionalSearchField'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDateTime } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import { createExemption, deleteExemption, getExemptions } from '@/services/academy'
import { GATE_TARGET_LABELS, type AcademyGateTarget } from '@/types/academy'

const schema = z.object({
  professional_id: z.string().uuid('Selecione um profissional'),
  gate_target: z.string().optional(),
  reason: z.string().min(3, 'Informe o motivo'),
  expires_at: z.string().optional(),
})

export function AcademyExemptionsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)
  const [allRows, setAllRows] = useState<Array<Record<string, unknown> & { id: string }>>([])

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { professional_id: '', gate_target: 'demands', reason: '', expires_at: '' },
  })

  const stats = useMemo(() => {
    const now = new Date()
    const active = allRows.filter((r) => !r.expires_at || new Date(String(r.expires_at)) > now)
    const expired = allRows.filter((r) => r.expires_at && new Date(String(r.expires_at)) <= now)
    return [
      { label: 'Total', value: allRows.length, footer: 'Exceções cadastradas' },
      { label: 'Ativas', value: active.length },
      { label: 'Expiradas', value: expired.length },
      { label: 'Alvos distintos', value: new Set(allRows.map((r) => r.gate_target ?? 'all')).size },
    ]
  }, [allRows])

  const create = useMutation({
    mutationFn: async (values: z.infer<typeof schema>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Não autenticado')
      return createExemption({
        professional_id: values.professional_id,
        gate_target: values.gate_target === 'all' ? null : (values.gate_target as AcademyGateTarget),
        reason: values.reason,
        granted_by: user.id,
        expires_at: values.expires_at || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'academy', 'exemptions'] })
      form.reset()
      setOpen(false)
    },
  })

  const remove = useMutation({
    mutationFn: deleteExemption,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'academy', 'exemptions'] })
      setRevokeTarget(null)
    },
  })

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="icon" className="rounded-xl shrink-0" onClick={() => navigate('/admin/academy/config')} aria-label="Voltar">
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl lg:text-2xl leading-tight tracking-tight">
              Exceções Academy
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Isentar PP de gates específicos</p>
          </div>
        </div>
      </PageHeader>

      <EntityListPage
        title="Exceções"
        description="Profissionais com bypass temporário ou permanente"
        queryKey={['admin', 'academy', 'exemptions']}
        queryFn={async () => {
          const data = await getExemptions()
          setAllRows(data as unknown as Array<Record<string, unknown> & { id: string }>)
          return { data: data as unknown as Array<Record<string, unknown> & { id: string }>, count: data.length }
        }}
        stats={stats}
        statsColumns={4}
        onCreate={() => setOpen(true)}
        createLabel="Nova exceção"
        columns={[
          { key: 'pp', header: 'Profissional ID', cell: (r) => String(r.professional_id).slice(0, 8) },
          {
            key: 'target',
            header: 'Alvo',
            mobilePrimary: true,
            cell: (r) => (r.gate_target ? GATE_TARGET_LABELS[r.gate_target as AcademyGateTarget] : 'Todos'),
          },
          { key: 'reason', header: 'Motivo', cell: (r) => String(r.reason) },
          { key: 'created', header: 'Criado em', cell: (r) => formatDateTime(String(r.created_at)) },
          {
            key: 'actions',
            header: '',
            className: 'w-20',
            cell: (r) => (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  setRevokeTarget(String(r.id))
                }}
              >
                Revogar
              </Button>
            ),
          },
        ]}
      />

      <CrudModal open={open} onOpenChange={setOpen} title="Nova exceção" size="md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="space-y-4">
            <FormField
              control={form.control}
              name="professional_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profissional</FormLabel>
                  <FormControl>
                    <ProfessionalSearchField value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gate_target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alvo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="all">Todos os gates</SelectItem>
                      {(Object.keys(GATE_TARGET_LABELS) as AcademyGateTarget[]).map((t) => (
                        <SelectItem key={t} value={t}>{GATE_TARGET_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expires_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Validade (opcional)</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormActions onCancel={() => setOpen(false)} isSubmitting={create.isPending} />
          </form>
        </Form>
      </CrudModal>

      <DeleteConfirmDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Revogar exceção"
        description="O profissional voltará a ser avaliado pelos gates configurados."
        isDeleting={remove.isPending}
        onConfirm={() => revokeTarget && remove.mutate(revokeTarget)}
      />
    </>
  )
}
