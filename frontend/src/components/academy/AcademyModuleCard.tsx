import { Lock, CheckCircle2, PlayCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import type { AcademyModuleWithProgress } from '@/types/academy'

interface AcademyModuleCardProps {
  module: AcademyModuleWithProgress
  required: boolean
  onOpen: () => void
}

export function AcademyModuleCard({ module, required, onOpen }: AcademyModuleCardProps) {
  const complete = module.totalLessons > 0 && module.completedLessons >= module.totalLessons
  const inProgress = module.completedLessons > 0 && !complete
  const progress = module.totalLessons > 0 ? (module.completedLessons / module.totalLessons) * 100 : 0

  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              {module.code} — {module.title}
            </CardTitle>
            {module.description && <CardDescription>{module.description}</CardDescription>}
          </div>
          {complete ? (
            <Badge className="border-transparent bg-primary/15 text-primary">Concluído</Badge>
          ) : inProgress ? (
            <Badge variant="secondary">Em progresso</Badge>
          ) : required ? (
            <Badge variant="outline" className="gap-1">
              <Lock className="h-3 w-3" /> Obrigatório
            </Badge>
          ) : (
            <Badge variant="muted">Opcional</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {module.completedLessons}/{module.totalLessons} aulas
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
        <Button className="w-full rounded-full" onClick={onOpen}>
          {complete ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Revisar
            </>
          ) : inProgress ? (
            <>
              <PlayCircle className="mr-2 h-4 w-4" /> Continuar
            </>
          ) : (
            'Iniciar módulo'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
