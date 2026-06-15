import { PlayCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CONTENT_HUB_SECTION_PADDING } from '@/lib/content/contentMeta'
import { cn } from '@/lib/utils'

interface ContentProgressBannerProps {
  title: string
  subtitle?: string
  completed: number
  total: number
  continueLabel?: string
  onContinue?: () => void
  className?: string
  padded?: boolean
}

export function ContentProgressBanner({
  title,
  subtitle,
  completed,
  total,
  continueLabel = 'Continue de onde parou',
  onContinue,
  className,
  padded = false,
}: ContentProgressBannerProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  const showContinue = Boolean(onContinue && completed < total)

  return (
    <div className={cn(padded && CONTENT_HUB_SECTION_PADDING, className)}>
      <div className="space-y-4 rounded-2xl border bg-muted/20 px-4 py-4 md:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="text-sm text-muted-foreground tabular-nums">
          {completed}/{total} concluídos · {percent}%
        </div>
      </div>
      <Progress value={percent} className="h-2" />
      {showContinue && (
        <Button className="rounded-full" onClick={onContinue}>
          <PlayCircle className="mr-2 h-4 w-4" />
          {continueLabel}
        </Button>
      )}
      </div>
    </div>
  )
}
