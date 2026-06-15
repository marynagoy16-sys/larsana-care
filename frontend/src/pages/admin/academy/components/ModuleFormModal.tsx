import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormActions } from '@/components/crud/FormActions'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { moduleFormSchema, type ModuleFormValues } from '@/schemas/academy'
import { academyAdminKeys, createModule, updateModule } from '@/services/academyAdmin'
import type { AcademyModule } from '@/types/academy'

interface ModuleFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  module?: AcademyModule | null
}

export function ModuleFormModal({ open, onOpenChange, courseId, module }: ModuleFormModalProps) {
  const isEdit = Boolean(module?.id)

  const form = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleFormSchema) as never,
    defaultValues: { code: '', title: '', description: '', sort_order: 0 },
  })

  useEffect(() => {
    if (open && module) {
      form.reset({
        code: module.code,
        title: module.title,
        description: module.description ?? '',
        sort_order: module.sort_order,
      })
    } else if (open) {
      form.reset({ code: '', title: '', description: '', sort_order: 0 })
    }
  }, [open, module, form])

  const save = useCrudMutation({
    mutationFn: (values: ModuleFormValues) =>
      isEdit
        ? updateModule(module!.id, values)
        : createModule({ ...values, course_id: courseId }),
    queryKey: academyAdminKeys.modules(courseId),
    successMessage: isEdit ? 'Módulo atualizado' : 'Módulo criado',
    onSuccess: () => {
      form.reset()
      onOpenChange(false)
    },
  })

  return (
    <CrudModal open={open} onOpenChange={onOpenChange} title={isEdit ? 'Editar módulo' : 'Novo módulo'} size="md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
          <FormField control={form.control} name="code" render={({ field }) => (
            <FormItem><FormLabel>Código (ex. M1)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="sort_order" render={({ field }) => (
            <FormItem><FormLabel>Ordem</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormActions onCancel={() => onOpenChange(false)} isSubmitting={save.isPending} />
        </form>
      </Form>
    </CrudModal>
  )
}
