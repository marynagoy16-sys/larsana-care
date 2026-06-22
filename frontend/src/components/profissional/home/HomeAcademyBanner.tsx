import { ChevronRight } from 'lucide-react'
import type { ContentBannerSlide } from '@/components/content-experience/ContentBannerCarousel'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface HomeAcademyBannerProps {
  slide: ContentBannerSlide
  completedLessons: number
  totalLessons: number
  onClick: () => void
  className?: string
}

export function HomeAcademyBanner({
  slide,
  completedLessons,
  totalLessons,
  onClick,
  className,
}: HomeAcademyBannerProps) {
  const Icon = slide.icon
  const hasProgress = totalLessons > 0
  const percent = hasProgress ? Math.round((completedLessons / totalLessons) * 100) : 0
  const inProgress = hasProgress && completedLessons < totalLessons

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl', className)}
    >
      <div
        className={cn(
          'relative flex h-full min-h-[132px] flex-col justify-center overflow-hidden rounded-2xl px-5 py-5 lg:min-h-[168px] lg:px-8 lg:py-7',
          slide.className ?? 'bg-primary text-primary-foreground',
        )}
      >
        <div className="relative z-10 flex w-full flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div className="max-w-2xl space-y-1 lg:space-y-1.5">
            {slide.eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80 lg:text-xs">
                {slide.eyebrow}
              </p>
            )}
            <h3 className="text-base font-bold leading-snug lg:text-xl">{slide.title}</h3>
            <p className="text-xs leading-relaxed opacity-90 lg:text-sm">{slide.subtitle}</p>
          </div>

          {hasProgress && (
            <div className="w-full shrink-0 space-y-2 lg:max-w-xs">
              <div className="flex items-center justify-between text-xs opacity-90 tabular-nums">
                <span>
                  {completedLessons}/{totalLessons} aulas
                </span>
                <span>{percent}%</span>
              </div>
              <Progress
                value={percent}
                className="h-1.5 bg-primary-foreground/20 [&>div]:bg-primary-foreground"
              />
              {inProgress && (
                <p className="flex items-center gap-1 text-xs font-medium opacity-90">
                  Continuar formação
                  <ChevronRight className="h-3.5 w-3.5" />
                </p>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <Icon className="absolute right-4 top-1/2 h-14 w-14 -translate-y-1/2 opacity-20 lg:right-8 lg:h-20 lg:w-20" />
        )}
      </div>
    </button>
  )
}
