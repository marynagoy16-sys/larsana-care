import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExerciseStepPlayer } from '@/components/academy/ExerciseStepPlayer'
import { parseExerciseSteps } from '@/services/larsanapill'
import type { AcademyLesson } from '@/types/academy'

interface AcademyLessonPlayerProps {
  lesson: AcademyLesson
  onComplete: () => void
  completing?: boolean
}

interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
}

function parseQuizQuestions(metadata: Record<string, unknown>): QuizQuestion[] {
  const questions = metadata.questions
  if (!Array.isArray(questions)) return []
  return questions
    .filter((q): q is Record<string, unknown> => typeof q === 'object' && q !== null)
    .map((q) => ({
      question: String(q.question ?? ''),
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      correctIndex: Number(q.correctIndex ?? 0),
    }))
}

function AcademyQuizPlayer({
  questions,
  onComplete,
  completing,
}: {
  questions: QuizQuestion[]
  onComplete: (score: number) => void
  completing?: boolean
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const score =
    questions.length > 0
      ? Math.round(
          (questions.filter((q, i) => answers[i] === q.correctIndex).length / questions.length) * 100,
        )
      : 0

  const passed = score >= 70

  return (
    <div className="space-y-4">
      {questions.map((q, qi) => (
        <Card key={qi}>
          <CardHeader>
            <CardTitle className="text-base">{q.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                type="button"
                disabled={submitted}
                className={`w-full rounded-lg border p-3 text-left text-sm transition ${
                  answers[qi] === oi ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                }`}
                onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
              >
                {opt}
              </button>
            ))}
          </CardContent>
        </Card>
      ))}

      {!submitted ? (
        <Button
          className="rounded-full"
          disabled={Object.keys(answers).length < questions.length}
          onClick={() => setSubmitted(true)}
        >
          Enviar respostas
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium">
            Resultado: {score}% {passed ? '— Aprovado' : '— Refaça o quiz'}
          </p>
          {passed && (
            <Button className="rounded-full" onClick={() => onComplete(score)} disabled={completing}>
              {completing ? 'Salvando…' : 'Concluir aula'}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export function AcademyLessonPlayer({ lesson, onComplete, completing }: AcademyLessonPlayerProps) {
  const exerciseSteps = lesson.content_type === 'exercise_steps' ? parseExerciseSteps(lesson.metadata) : []
  const quizQuestions = lesson.content_type === 'quiz' ? parseQuizQuestions(lesson.metadata) : []

  if (lesson.content_type === 'exercise_steps') {
    return <ExerciseStepPlayer steps={exerciseSteps} onComplete={onComplete} />
  }

  if (lesson.content_type === 'quiz') {
    return (
      <AcademyQuizPlayer
        questions={quizQuestions}
        completing={completing}
        onComplete={() => onComplete()}
      />
    )
  }

  return (
    <div className="space-y-4">
      {lesson.content_type === 'video' && lesson.storage_path ? (
        <div className="aspect-video overflow-hidden rounded-lg border border-border bg-black">
          <video controls className="h-full w-full" src={lesson.storage_path}>
            <track kind="captions" />
          </video>
        </div>
      ) : lesson.content_type === 'pdf' && lesson.storage_path ? (
        <Card>
          <CardContent className="p-4">
            <a href={lesson.storage_path} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary underline">
              Abrir PDF
            </a>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{lesson.title}</CardTitle>
          </CardHeader>
          <CardContent>
            {lesson.content ? (
              <div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: lesson.content }} />
            ) : (
              <p className="text-sm text-muted-foreground">Conteúdo em preparação.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button className="rounded-full" onClick={onComplete} disabled={completing}>
          {completing ? 'Salvando…' : 'Marcar como concluída'}
        </Button>
      </div>
    </div>
  )
}
