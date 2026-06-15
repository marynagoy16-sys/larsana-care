import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form } from '@/components/ui/form'
import { FormActions } from '@/components/crud/FormActions'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { sanitizeRichText } from '@/lib/sanitize'
import { contentFormSchema, type ContentFormValues } from '@/schemas/academy'
import { createContent, larsanapillAdminKeys, updateContent } from '@/services/academyAdmin'
import type { ExerciseStep, LarsanaPillContent } from '@/types/academy'
import { AcademyContentFormFields } from './AcademyContentFormFields'
import type { QuizQuestionForm } from './QuizQuestionsEditor'

interface ContentFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryId: string
  content?: LarsanaPillContent | null
}

function parseMetadata(content: LarsanaPillContent) {
  const meta = content.metadata ?? {}
  const steps: ExerciseStep[] =
    content.content_type === 'exercise_steps' && Array.isArray(meta.steps)
      ? meta.steps.map((s: Record<string, unknown>) => ({
          title: String(s.title ?? ''),
          instruction: String(s.instruction ?? ''),
          durationSeconds: Number(s.durationSeconds ?? 30),
        }))
      : []
  const questions: QuizQuestionForm[] =
    content.content_type === 'quiz' && Array.isArray(meta.questions)
      ? meta.questions.map((q: Record<string, unknown>) => ({
          question: String(q.question ?? ''),
          options: Array.isArray(q.options) ? q.options.map(String) : ['', ''],
          correctIndex: Number(q.correctIndex ?? 0),
        }))
      : []
  return { steps, questions }
}

export function ContentFormModal({ open, onOpenChange, categoryId, content }: ContentFormModalProps) {
  const isEdit = Boolean(content?.id)
  const [steps, setSteps] = useState<ExerciseStep[]>([])
  const [questions, setQuestions] = useState<QuizQuestionForm[]>([])

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema) as never,
    defaultValues: {
      slug: '',
      title: '',
      description: '',
      content_type: 'richtext',
      content: '',
      storage_path: null,
      duration_seconds: null,
      sort_order: 0,
      is_published: false,
    },
  })

  const contentType = form.watch('content_type')

  useEffect(() => {
    if (open && content) {
      form.reset({
        slug: content.slug,
        title: content.title,
        description: content.description ?? '',
        content_type: content.content_type,
        content: content.content ?? '',
        storage_path: content.storage_path,
        duration_seconds: content.duration_seconds,
        sort_order: content.sort_order,
        is_published: content.is_published,
      })
      const parsed = parseMetadata(content)
      setSteps(parsed.steps)
      setQuestions(parsed.questions)
    } else if (open) {
      form.reset({
        slug: '',
        title: '',
        description: '',
        content_type: 'richtext',
        content: '',
        storage_path: null,
        duration_seconds: null,
        sort_order: 0,
        is_published: false,
      })
      setSteps([])
      setQuestions([])
    }
  }, [open, content, form])

  const save = useCrudMutation({
    mutationFn: async (values: ContentFormValues) => {
      const metadata: Record<string, unknown> = {}
      if (values.content_type === 'exercise_steps') metadata.steps = steps
      if (values.content_type === 'quiz') metadata.questions = questions
      const payload = {
        slug: values.slug,
        title: values.title,
        description: values.description,
        content_type: values.content_type,
        content: values.content_type === 'richtext' && values.content ? sanitizeRichText(values.content) : values.content,
        storage_path: values.storage_path,
        duration_seconds: values.duration_seconds,
        sort_order: values.sort_order,
        is_published: values.is_published,
        metadata,
      }
      return isEdit
        ? updateContent(content!.id, payload)
        : createContent({ ...payload, category_id: categoryId })
    },
    queryKey: larsanapillAdminKeys.contents(categoryId),
    successMessage: isEdit ? 'Conteúdo atualizado' : 'Conteúdo criado',
    onSuccess: () => {
      form.reset()
      onOpenChange(false)
    },
  })

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Editar conteúdo' : 'Novo conteúdo'}
      description="Material PHIL para pacientes"
      size="full"
      layout="form"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto min-h-0 pr-1">
            <AcademyContentFormFields
              form={form}
              contentType={contentType}
              mediaFolder={`larsanapill/${categoryId}/contents`}
              steps={steps}
              onStepsChange={setSteps}
              questions={questions}
              onQuestionsChange={setQuestions}
              publishedLabel="Publicado"
            />
          </div>
          <div className="shrink-0 border-t border-border pt-4 mt-4">
            <FormActions
              onCancel={() => onOpenChange(false)}
              isSubmitting={save.isPending}
              submitLabel={isEdit ? 'Salvar' : 'Criar conteúdo'}
            />
          </div>
        </form>
      </Form>
    </CrudModal>
  )
}
