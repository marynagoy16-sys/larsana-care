import type { LucideIcon } from 'lucide-react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'

export interface ContentBannerSlide {
  id: string
  eyebrow?: string
  title: string
  subtitle: string
  icon?: LucideIcon
  className?: string
  textClassName?: string
}

interface ContentBannerCarouselProps {
  slides: ContentBannerSlide[]
}

export function ContentBannerCarousel({ slides }: ContentBannerCarouselProps) {
  if (slides.length === 0) return null

  return (
    <Carousel className="w-full" opts={{ loop: true }}>
      <CarouselContent>
        {slides.map((slide) => {
          const Icon = slide.icon
          return (
            <CarouselItem key={slide.id}>
              <div
                className={cn(
                  'relative flex min-h-[160px] items-center overflow-hidden rounded-2xl px-6 py-8 md:min-h-[200px] md:px-10 md:py-10',
                  slide.className ?? 'bg-primary text-primary-foreground',
                )}
              >
                <div className={cn('relative z-10 max-w-xl space-y-2', slide.textClassName)}>
                  {slide.eyebrow && (
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{slide.eyebrow}</p>
                  )}
                  <h2 className="text-xl font-bold md:text-2xl">{slide.title}</h2>
                  <p className="text-sm opacity-90 md:text-base">{slide.subtitle}</p>
                </div>
                {Icon && (
                  <Icon className="absolute right-6 top-1/2 h-16 w-16 -translate-y-1/2 opacity-20 md:right-10 md:h-24 md:w-24" />
                )}
              </div>
            </CarouselItem>
          )
        })}
      </CarouselContent>
      {slides.length > 1 && (
        <>
          <CarouselPrevious />
          <CarouselNext />
        </>
      )}
    </Carousel>
  )
}
