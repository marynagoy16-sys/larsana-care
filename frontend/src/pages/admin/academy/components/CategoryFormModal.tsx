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
import { categoryFormSchema, type CategoryFormValues } from '@/schemas/academy'
import { createCategory, larsanapillAdminKeys, updateCategory } from '@/services/academyAdmin'
import type { LarsanaPillCategory } from '@/types/academy'

interface CategoryFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: LarsanaPillCategory | null
}

export function CategoryFormModal({ open, onOpenChange, category }: CategoryFormModalProps) {
  const isEdit = Boolean(category?.id)

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema) as never,
    defaultValues: { slug: '', code: '', title: '', description: '', sort_order: 0, is_published: false },
  })

  useEffect(() => {
    if (open && category) {
      form.reset({
        slug: category.slug,
        code: category.code,
        title: category.title,
        description: category.description ?? '',
        sort_order: category.sort_order,
        is_published: category.is_published,
      })
    } else if (open) {
      form.reset({ slug: '', code: '', title: '', description: '', sort_order: 0, is_published: false })
    }
  }, [open, category, form])

  const save = useCrudMutation({
    mutationFn: (values: CategoryFormValues) =>
      isEdit ? updateCategory(category!.id, values) : createCategory(values),
    queryKey: larsanapillAdminKeys.categories,
    successMessage: isEdit ? 'Categoria atualizada' : 'Categoria criada',
    onSuccess: () => {
      form.reset()
      onOpenChange(false)
    },
  })

  return (
    <CrudModal open={open} onOpenChange={onOpenChange} title={isEdit ? 'Editar categoria' : 'Nova categoria'} size="md">
      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
          <FormField control={form.control} name="code" render={({ field }) => (
            <FormItem><FormLabel>Código (ex. P1)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
          <FormField control={form.control} name="sort_order" render={({ field }) => (
            <FormItem><FormLabel>Ordem</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
          )} />
          <FormField control={form.control} name="is_published" render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel>Publicada</FormLabel>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
          <FormActions onCancel={() => onOpenChange(false)} isSubmitting={save.isPending} />
        </form>
      </Form>
    </CrudModal>
  )
}
