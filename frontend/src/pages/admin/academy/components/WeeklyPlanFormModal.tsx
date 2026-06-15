import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { FormActions } from '@/components/crud/FormActions'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { weeklyPlanFormSchema, type WeeklyPlanFormValues } from '@/schemas/academy'
import { createWeeklyPlan, larsanapillAdminKeys, updateWeeklyPlan } from '@/services/academyAdmin'
import type { LarsanaPillWeeklyPlan } from '@/types/academy'

interface WeeklyPlanFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan?: LarsanaPillWeeklyPlan | null
}

export function WeeklyPlanFormModal({ open, onOpenChange, plan }: WeeklyPlanFormModalProps) {
  const isEdit = Boolean(plan?.id)

  const form = useForm<WeeklyPlanFormValues>({
    resolver: zodResolver(weeklyPlanFormSchema) as never,
    defaultValues: {
      slug: '',
      code: '',
      title: '',
      description: '',
      sessions_per_week: 3,
      minutes_per_session: 30,
      sort_order: 0,
      is_published: false,
    },
  })

  useEffect(() => {
    if (open && plan) {
      form.reset({
        slug: plan.slug,
        code: plan.code,
        title: plan.title,
        description: plan.description ?? '',
        sessions_per_week: plan.sessions_per_week,
        minutes_per_session: plan.minutes_per_session,
        sort_order: plan.sort_order,
        is_published: plan.is_published,
      })
    } else if (open) {
      form.reset({
        slug: '',
        code: '',
        title: '',
        description: '',
        sessions_per_week: 3,
        minutes_per_session: 30,
        sort_order: 0,
        is_published: false,
      })
    }
  }, [open, plan, form])

  const save = useCrudMutation({
    mutationFn: (values: WeeklyPlanFormValues) =>
      isEdit ? updateWeeklyPlan(plan!.id, values) : createWeeklyPlan(values),
    queryKey: larsanapillAdminKeys.weeklyPlans,
    successMessage: isEdit ? 'Plano atualizado' : 'Plano criado',
    onSuccess: () => {
      form.reset()
      onOpenChange(false)
    },
  })

  return (
    <CrudModal open={open} onOpenChange={onOpenChange} title={isEdit ? 'Editar plano semanal' : 'Novo plano semanal'} size="md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
          <FormField control={form.control} name="code" render={({ field }) => (
            <FormItem><FormLabel>Código (ex. T1)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="slug" render={({ field }) => (
            <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="sessions_per_week" render={({ field }) => (
              <FormItem><FormLabel>Sessões/semana</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
            )} />
            <FormField control={form.control} name="minutes_per_session" render={({ field }) => (
              <FormItem><FormLabel>Minutos/sessão</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
            )} />
          </div>
          <FormField control={form.control} name="sort_order" render={({ field }) => (
            <FormItem><FormLabel>Ordem</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="is_published" render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel>Publicado</FormLabel>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
          <FormActions onCancel={() => onOpenChange(false)} isSubmitting={save.isPending} />
        </form>
      </Form>
    </CrudModal>
  )
}
