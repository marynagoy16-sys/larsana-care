import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  ppPatientSituationBadgeClass,
  ppPatientSituationLabels,
  resolvePPPatientSituation,
  type PPPatientSituationInput,
} from '@/lib/ppPatientSituation'

type PPPatientSituationBadgeProps = PPPatientSituationInput & {
  className?: string
}

export function PPPatientSituationBadge({
  className,
  ...input
}: PPPatientSituationBadgeProps) {
  const situation = resolvePPPatientSituation(input)

  if (situation === 'none') {
    return <span className="text-muted-foreground text-sm">—</span>
  }

  const label =
    situation === 'evolution_pending' && input.pending_evolution_count > 1
      ? `${input.pending_evolution_count} evoluções`
      : ppPatientSituationLabels[situation]

  return (
    <Badge className={cn(ppPatientSituationBadgeClass[situation], className)}>
      {label}
    </Badge>
  )
}
