import { useRef, useState } from 'react'
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, Text, View } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import { cn } from '@/lib/cn'

export interface ContentBannerSlide {
  id: string
  eyebrow?: string
  title: string
  subtitle: string
  icon?: LucideIcon
  className?: string
}

export function ContentBannerCarousel({ slides }: { slides: ContentBannerSlide[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const width = Dimensions.get('window').width - 32

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width)
    setActiveIndex(index)
  }

  if (slides.length === 0) return null

  return (
    <View className="gap-3">
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={width + 12}
      >
        {slides.map((slide, index) => {
          const Icon = slide.icon
          const isLight = !slide.className?.includes('bg-muted')
          const textColor = isLight ? 'text-white' : 'text-foreground'
          const subtextColor = isLight ? 'text-white/90' : 'text-muted-foreground'
          const eyebrowColor = isLight ? 'text-white/80' : 'text-muted-foreground'
          const iconColor = isLight ? 'rgba(255,255,255,0.2)' : 'rgba(23,49,10,0.15)'

          return (
            <Pressable
              key={slide.id}
              style={{ width, marginRight: index < slides.length - 1 ? 12 : 0 }}
              className={cn(
                'min-h-[160px] justify-center overflow-hidden rounded-2xl px-6 py-8',
                slide.className ?? 'bg-primary',
              )}
            >
              {Icon ? (
                <Icon
                  size={64}
                  color={iconColor}
                  style={{ position: 'absolute', right: 24, top: '50%', marginTop: -32 }}
                />
              ) : null}
              {slide.eyebrow ? (
                <Text className={cn('text-xs font-semibold uppercase tracking-wider', eyebrowColor)}>
                  {slide.eyebrow}
                </Text>
              ) : null}
              <Text className={cn('mt-1 text-xl font-bold', textColor)}>{slide.title}</Text>
              <Text className={cn('mt-2 text-sm', subtextColor)}>{slide.subtitle}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
      {slides.length > 1 ? (
        <View className="flex-row justify-center gap-1.5">
          {slides.map((slide, index) => (
            <View
              key={slide.id}
              className={cn('h-1.5 rounded-full', index === activeIndex ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30')}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}
