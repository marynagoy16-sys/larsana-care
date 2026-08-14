import { Progress } from '@/components/ui/progress'
import {
  patenteLabels,
  PATENTE_REPASSE_PERCENT,
  resolveNextPatenteTarget,
  resolvePatenteProgress,
  type PpPatente,
  type PpPointsSettings,
} from '@/services/ppPoints'

type PatenteProgressSectionProps = {
  points: number
  patente: PpPatente
  settings: PpPointsSettings
  showHintText?: boolean
}

export function PatenteProgressSection({
  points,
  patente,
  settings,
  showHintText = true,
}: PatenteProgressSectionProps) {
  const nextTarget = resolveNextPatenteTarget(points, settings, patente)
  if (!nextTarget) return null

  const progress = resolvePatenteProgress(points, patente, settings)
  const remaining = Math.max(0, nextTarget.threshold - points)

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{patenteLabels[progress.fromPatente]}</span>
        <span>{patenteLabels[nextTarget.patente]}</span>
      </div>
      <Progress value={progress.percent} className="h-2.5" />
      {showHintText ? (
        <p className="text-sm text-muted-foreground">
          {points} / {nextTarget.threshold} pts · faltam{' '}
          <span className="font-medium text-foreground">{remaining} pts</span> para{' '}
          {patenteLabels[nextTarget.patente]} ({PATENTE_REPASSE_PERCENT[nextTarget.patente]}% repasse)
        </p>
      ) : null}
    </div>
  )
}
