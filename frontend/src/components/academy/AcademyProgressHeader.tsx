import { GraduationCap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface AcademyProgressHeaderProps {
  title: string
  subtitle: string
  completedLessons: number
  totalLessons: number
}

export function AcademyProgressHeader({ title, subtitle, completedLessons, totalLessons }: AcademyProgressHeaderProps) {
  const percent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-background shadow-sm">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="w-full sm:max-w-xs">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Progresso geral</span>
            <span>
              {completedLessons}/{totalLessons} aulas ({Math.round(percent)}%)
            </span>
          </div>
          <Progress value={percent} className="h-2.5" />
        </div>
      </CardContent>
    </Card>
  )
}
