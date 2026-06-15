import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getContentIcon } from '@/lib/content/contentIcons'
import { getContentTypeLabel } from '@/lib/content/contentMeta'
import type { AcademyContentType } from '@/types/academy'
import { cn } from '@/lib/utils'

interface ContentLessonCardProps {
  title: string
  subtitle?: string | null
  badgeLabel?: string
  contentType?: AcademyContentType
  progressPercent?: number
  href?: string
  onClick?: () => void
  icon?: LucideIcon
}

export function ContentLessonCard({
  title,
  subtitle,
  badgeLabel,
  contentType,
  progressPercent = 0,
  href,
  onClick,
  icon,
}: ContentLessonCardProps) {
  const Icon = icon ?? (contentType ? getContentIcon(contentType) : getContentIcon('richtext'))
  const label = badgeLabel ?? (contentType ? getContentTypeLabel(contentType) : undefined)
  const body = (
    <article
      className={cn(
        'group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg',
        (href || onClick) && 'cursor-pointer',
      )}
      onClick={onClick}
    >
      <div className="relative">
        {label && (
          <span className="absolute left-3 top-0 z-10 rounded-b-lg bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
            {label}
          </span>
        )}
        <div className="flex aspect-[4/3] items-center justify-center bg-muted/50">
          <Icon className="h-10 w-10 text-muted-foreground/40 transition-colors group-hover:text-primary/60" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{title}</h3>
          {subtitle && <p className="line-clamp-2 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {progressPercent > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Progresso</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        )}
        {href ? (
          <Button variant="secondary" size="sm" className="mt-auto w-full rounded-full" asChild>
            <Link to={href}>Abrir</Link>
          </Button>
        ) : (
          <Button variant="secondary" size="sm" className="mt-auto w-full rounded-full">
            Abrir
          </Button>
        )}
      </div>
    </article>
  )

  if (href && !onClick) return body
  return body
}
