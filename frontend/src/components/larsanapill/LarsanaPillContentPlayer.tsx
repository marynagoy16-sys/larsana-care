import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExerciseStepPlayer } from '@/components/academy/ExerciseStepPlayer'
import { parseExerciseSteps } from '@/services/larsanapill'
import type { LarsanaPillContent } from '@/types/academy'

interface LarsanaPillContentPlayerProps {
  content: LarsanaPillContent
  completing?: boolean
  onComplete: () => void
  preview?: boolean
}

export function LarsanaPillContentPlayer({ content, completing, onComplete, preview = false }: LarsanaPillContentPlayerProps) {
  const exerciseSteps = content.content_type === 'exercise_steps' ? parseExerciseSteps(content.metadata) : []

  return (
    <div className="space-y-4">
      {content.content_type === 'video' && content.storage_path && (
        <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-black shadow-lg">
          <video controls className="h-full w-full" src={content.storage_path}>
            <track kind="captions" />
          </video>
        </div>
      )}

      {(content.content_type === 'pdf' || content.content_type === 'ebook') && content.storage_path && (
        <Card>
          <CardContent className="p-4">
            <a
              href={content.storage_path}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline"
            >
              Abrir documento PDF
            </a>
          </CardContent>
        </Card>
      )}

      {content.content_type === 'richtext' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{content.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {content.content ? (
              <div
                className="prose prose-base max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: content.content }}
              />
            ) : (
              <p className="text-muted-foreground">Conteúdo em preparação.</p>
            )}
          </CardContent>
        </Card>
      )}

      {content.content_type === 'exercise_steps' && (
        <ExerciseStepPlayer steps={exerciseSteps} onComplete={preview ? () => undefined : onComplete} />
      )}

      {!preview && content.content_type !== 'exercise_steps' && (
        <div className="flex justify-end">
          <Button
            size="lg"
            className="min-h-12 rounded-full px-8"
            onClick={onComplete}
            disabled={completing}
          >
            {completing ? 'Salvando…' : 'Marcar como concluído'}
          </Button>
        </div>
      )}
    </div>
  )
}
