import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { FormActions } from '@/components/crud/FormActions'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { courseFormSchema, type CourseFormValues } from '@/schemas/academy'
import { academyAdminKeys, createCourse, updateCourse } from '@/services/academyAdmin'
import type { AcademyCourse } from '@/types/academy'

interface CourseFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course?: AcademyCourse | null
}

export function CourseFormModal({ open, onOpenChange, course }: CourseFormModalProps) {
  const isEdit = Boolean(course?.id)

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema) as never,
    defaultValues: {
      slug: '',
      title: '',
      description: '',
      audience: 'pp',
      is_mandatory: false,
      is_published: false,
      sort_order: 0,
      estimated_minutes: null,
    },
  })

  useEffect(() => {
    if (open && course) {
      form.reset({
        slug: course.slug,
        title: course.title,
        description: course.description ?? '',
        audience: course.audience,
        is_mandatory: course.is_mandatory,
        is_published: course.is_published,
        sort_order: course.sort_order,
        estimated_minutes: course.estimated_minutes,
      })
    } else if (open && !course) {
      form.reset({
        slug: '',
        title: '',
        description: '',
        audience: 'pp',
        is_mandatory: false,
        is_published: false,
        sort_order: 0,
        estimated_minutes: null,
      })
    }
  }, [open, course, form])

  const save = useCrudMutation({
    mutationFn: (values: CourseFormValues) =>
      isEdit ? updateCourse(course!.id, values) : createCourse(values),
    queryKey: academyAdminKeys.courses,
    successMessage: isEdit ? 'Curso atualizado' : 'Curso criado',
    onSuccess: () => {
      form.reset()
      onOpenChange(false)
    },
  })

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Editar curso' : 'Novo curso'}
      description="Formação PP ou trilha educacional"
      size="md"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="space-y-4">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="slug" render={({ field }) => (
            <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="audience" render={({ field }) => (
            <FormItem>
              <FormLabel>Público</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="pp">Profissional Parceiro</SelectItem>
                  <SelectItem value="paciente">Paciente</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="sort_order" render={({ field }) => (
              <FormItem><FormLabel>Ordem</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="estimated_minutes" render={({ field }) => (
              <FormItem><FormLabel>Minutos estimados</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          <FormField control={form.control} name="is_mandatory" render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel>Obrigatório</FormLabel>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="is_published" render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-3">
              <FormLabel>Publicado</FormLabel>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
          <FormActions onCancel={() => onOpenChange(false)} isSubmitting={save.isPending} submitLabel={isEdit ? 'Salvar' : 'Criar'} />
        </form>
      </Form>
    </CrudModal>
  )
}
