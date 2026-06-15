import type { UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { LessonFormValues } from '@/schemas/academy'
import type { AcademyContentType, ExerciseStep } from '@/types/academy'
import { AcademyMediaUploadField } from './AcademyMediaUploadField'
import { ExerciseStepsEditor } from './ExerciseStepsEditor'
import { QuizQuestionsEditor, type QuizQuestionForm } from './QuizQuestionsEditor'

const CONTENT_TYPES: AcademyContentType[] = ['video', 'pdf', 'richtext', 'quiz', 'exercise_steps', 'ebook']

interface AcademyContentFormFieldsProps {
  form: UseFormReturn<LessonFormValues>
  contentType: AcademyContentType
  mediaFolder: string
  steps: ExerciseStep[]
  onStepsChange: (steps: ExerciseStep[]) => void
  questions: QuizQuestionForm[]
  onQuestionsChange: (questions: QuizQuestionForm[]) => void
  publishedLabel?: string
}

export function AcademyContentFormFields({
  form,
  contentType,
  mediaFolder,
  steps,
  onStepsChange,
  questions,
  onQuestionsChange,
  publishedLabel = 'Publicada',
}: AcademyContentFormFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField control={form.control} name="title" render={({ field }) => (
        <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
      )} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField control={form.control} name="slug" render={({ field }) => (
          <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="content_type" render={({ field }) => (
          <FormItem>
            <FormLabel>Tipo</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                {CONTENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
      </div>
      <FormField control={form.control} name="description" render={({ field }) => (
        <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
      )} />

      {(contentType === 'video' || contentType === 'pdf' || contentType === 'ebook') && (
        <FormField control={form.control} name="storage_path" render={({ field }) => (
          <FormItem>
            <AcademyMediaUploadField
              folder={mediaFolder}
              value={field.value}
              onChange={field.onChange}
              accept={contentType === 'video' ? 'video/mp4,video/webm' : 'application/pdf'}
            />
          </FormItem>
        )} />
      )}

      {contentType === 'richtext' && (
        <FormField control={form.control} name="content" render={({ field }) => (
          <FormItem><FormLabel>Conteúdo HTML</FormLabel><FormControl><Textarea rows={6} {...field} value={field.value ?? ''} /></FormControl></FormItem>
        )} />
      )}

      {contentType === 'exercise_steps' && <ExerciseStepsEditor steps={steps} onChange={onStepsChange} />}
      {contentType === 'quiz' && <QuizQuestionsEditor questions={questions} onChange={onQuestionsChange} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField control={form.control} name="duration_seconds" render={({ field }) => (
          <FormItem><FormLabel>Duração (seg)</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl></FormItem>
        )} />
        <FormField control={form.control} name="sort_order" render={({ field }) => (
          <FormItem><FormLabel>Ordem</FormLabel><FormControl><Input type="number" {...field} /></FormControl></FormItem>
        )} />
      </div>
      <FormField control={form.control} name="is_published" render={({ field }) => (
        <FormItem className="flex items-center justify-between rounded-lg border p-3">
          <FormLabel>{publishedLabel}</FormLabel>
          <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
        </FormItem>
      )} />
    </div>
  )
}
