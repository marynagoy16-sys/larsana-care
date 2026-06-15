import { PlayCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { LarsanaPillContentPlayer } from '@/components/larsanapill/LarsanaPillContentPlayer'
import type { LarsanaPillContent } from '@/types/academy'

interface WeeklyPlanVslSectionProps {
  content: LarsanaPillContent | null
  planTitle: string
}

export function WeeklyPlanVslSection({ content, planTitle }: WeeklyPlanVslSectionProps) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Apresentação</p>
        <h2 className="text-xl font-semibold">Veja como funciona o {planTitle}</h2>
        <p className="text-sm text-muted-foreground">
          Assista à demonstração e conheça o formato dos exercícios guiados antes de começar.
        </p>
      </div>

      {content ? (
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardContent className="p-0 sm:p-4">
            <LarsanaPillContentPlayer content={content} onComplete={() => undefined} preview />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <PlayCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              A demonstração em vídeo deste plano será disponibilizada em breve. Enquanto isso, explore a rotina
              semanal abaixo.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
