import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LarsanaPillContentPlayer } from '@/components/larsanapill/LarsanaPillContentPlayer'
import { getContentById } from '@/services/larsanapill'
import type { LarsanaPillWeeklyPlanDay } from '@/types/academy'

interface WeeklyPlanDayPanelProps {
  day: LarsanaPillWeeklyPlanDay
  completing?: boolean
  onComplete: () => void
}

export function WeeklyPlanDayPanel({ day, completing, onComplete }: WeeklyPlanDayPanelProps) {
  const { data: linkedContent, isLoading } = useQuery({
    queryKey: ['paciente', 'larsanapill', 'plan-day-content', day.content_id],
    queryFn: () => getContentById(day.content_id!),
    enabled: Boolean(day.content_id),
  })

  if (day.content_id) {
    if (isLoading) return <p className="text-sm text-muted-foreground">Carregando exercício…</p>
    if (linkedContent) {
      return (
        <LarsanaPillContentPlayer content={linkedContent} completing={completing} onComplete={onComplete} />
      )
    }
  }

  return (
    <div className="space-y-4">
      {day.instructions ? (
        <Card>
          <CardContent className="p-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{day.instructions}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Conteúdo deste dia em preparação. Consulte seu fisioterapeuta.
          </CardContent>
        </Card>
      )}
      <div className="flex justify-end">
        <Button size="lg" className="min-h-12 rounded-full px-8" onClick={onComplete} disabled={completing}>
          {completing ? 'Salvando…' : 'Marcar dia como concluído'}
        </Button>
      </div>
    </div>
  )
}
