import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form } from '@/components/ui/form'
import { FormActions } from '@/components/crud/FormActions'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { sanitizeRichText } from '@/lib/sanitize'
import { lessonFormSchema, type LessonFormValues } from '@/schemas/academy'
import { academyAdminKeys, createLesson, updateLesson } from '@/services/academyAdmin'
import type { AcademyLesson } from '@/types/academy'
import type { ExerciseStep } from '@/types/academy'
import { AcademyContentFormFields } from './AcademyContentFormFields'
import type { QuizQuestionForm } from './QuizQuestionsEditor'

interface LessonFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  moduleId: string
  courseId: string
  lesson?: AcademyLesson | null
}

function parseMetadata(lesson: AcademyLesson) {
  const meta = lesson.metadata ?? {}
  const steps: ExerciseStep[] =
    lesson.content_type === 'exercise_steps' && Array.isArray(meta.steps)
      ? meta.steps.map((s: Record<string, unknown>) => ({
          title: String(s.title ?? ''),
          instruction: String(s.instruction ?? ''),
          durationSeconds: Number(s.durationSeconds ?? 30),
        }))
      : []
  const questions: QuizQuestionForm[] =
    lesson.content_type === 'quiz' && Array.isArray(meta.questions)
      ? meta.questions.map((q: Record<string, unknown>) => ({
          question: String(q.question ?? ''),
          options: Array.isArray(q.options) ? q.options.map(String) : ['', ''],
          correctIndex: Number(q.correctIndex ?? 0),
        }))
      : []
  return { steps, questions }
}

export function LessonFormModal({ open, onOpenChange, moduleId, courseId, lesson }: LessonFormModalProps) {
  const isEdit = Boolean(lesson?.id)
  const [steps, setSteps] = useState<ExerciseStep[]>([])
  const [questions, setQuestions] = useState<QuizQuestionForm[]>([])

  const form = useForm<LessonFormValues>({
    resolver: zodResolver(lessonFormSchema) as never,
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
    if (open && lesson) {
      form.reset({
        slug: lesson.slug,
        title: lesson.title,
        description: lesson.description ?? '',
        content_type: lesson.content_type,
        content: lesson.content ?? '',
        storage_path: lesson.storage_path,
        duration_seconds: lesson.duration_seconds,
        sort_order: lesson.sort_order,
        is_published: lesson.is_published,
      })
      const parsed = parseMetadata(lesson)
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
  }, [open, lesson, form])

  const save = useCrudMutation({
    mutationFn: async (values: LessonFormValues) => {
      if (!moduleId) throw new Error('Módulo não selecionado')
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
      return isEdit ? updateLesson(lesson!.id, payload) : createLesson({ ...payload, module_id: moduleId })
    },
    queryKey: academyAdminKeys.lessons(moduleId || 'none'),
    successMessage: isEdit ? 'Aula atualizada' : 'Aula criada',
    onSuccess: () => {
      form.reset()
      onOpenChange(false)
    },
  })

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Editar aula' : 'Nova aula'}
      description="Conteúdo da formação — vídeo, PDF, quiz ou passos guiados"
      size="full"
      layout="form"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => save.mutate(v))} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto min-h-0 pr-1">
            <AcademyContentFormFields
              form={form}
              contentType={contentType}
              mediaFolder={`courses/${courseId}/lessons`}
              steps={steps}
              onStepsChange={setSteps}
              questions={questions}
              onQuestionsChange={setQuestions}
            />
          </div>
          <div className="shrink-0 border-t border-border pt-4 mt-4">
            <FormActions
              onCancel={() => onOpenChange(false)}
              isSubmitting={save.isPending}
              submitLabel={isEdit ? 'Salvar' : 'Criar aula'}
            />
          </div>
        </form>
      </Form>
    </CrudModal>
  )
}
