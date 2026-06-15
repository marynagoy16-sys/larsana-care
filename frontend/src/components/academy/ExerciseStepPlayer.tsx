import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { ExerciseStep } from '@/types/academy'

interface ExerciseStepPlayerProps {
  steps: ExerciseStep[]
  onComplete: () => void
}

export function ExerciseStepPlayer({ steps, onComplete }: ExerciseStepPlayerProps) {
  const [index, setIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(steps[0]?.durationSeconds ?? 30)

  const step = steps[index]
  const progress = steps.length > 0 ? ((index + (1 - secondsLeft / (step?.durationSeconds || 1))) / steps.length) * 100 : 0

  useEffect(() => {
    if (!step) return
    setSecondsLeft(step.durationSeconds)
  }, [index, step])

  useEffect(() => {
    if (!step || secondsLeft <= 0) return
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft, step])

  if (!step) {
    return <p className="text-sm text-muted-foreground">Nenhum passo configurado.</p>
  }

  const isLast = index >= steps.length - 1

  return (
    <div className="space-y-4">
      <Card className="border-amber-200 bg-amber-50/80">
        <CardContent className="p-4 text-sm text-amber-900">
          Complemento ao tratamento — não substitui sessão presencial.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{step.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Passo {index + 1} de {steps.length}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-base leading-relaxed">{step.instruction}</p>
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary text-2xl font-bold text-primary">
              {secondsLeft}s
            </div>
            <Progress value={progress} className="h-3 w-full" />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-full"
              disabled={index === 0}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              Anterior
            </Button>
            <Button
              className="flex-1 rounded-full"
              onClick={() => {
                if (isLast) onComplete()
                else setIndex((i) => i + 1)
              }}
            >
              {isLast ? 'Concluir' : 'Próximo'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
