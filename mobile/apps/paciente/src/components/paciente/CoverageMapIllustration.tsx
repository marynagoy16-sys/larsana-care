import { useEffect } from 'react'
import { View } from 'react-native'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { cn } from '@/lib/cn'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

const SEARCH_PATH =
  'M40 110 C 60 90, 80 120, 100 95 S 140 85, 160 100 S 200 115, 240 90'

/** Pontos amostrados ao longo da via principal (sentido ida e volta na animação). */
const MARKER_PATH_POINTS = [
  { x: 40, y: 110 },
  { x: 55, y: 101 },
  { x: 72, y: 107 },
  { x: 88, y: 97 },
  { x: 102, y: 94 },
  { x: 120, y: 87 },
  { x: 140, y: 85 },
  { x: 158, y: 91 },
  { x: 175, y: 99 },
  { x: 192, y: 106 },
  { x: 210, y: 108 },
  { x: 228, y: 98 },
  { x: 240, y: 90 },
]

function interpolatePath(t: number): { x: number; y: number } {
  'worklet'
  const n = MARKER_PATH_POINTS.length - 1
  const pos = t * n
  const i = Math.floor(pos)
  const f = pos - i
  const a = MARKER_PATH_POINTS[i]
  const b = MARKER_PATH_POINTS[Math.min(i + 1, n)]
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
  }
}

type Props = {
  variant?: 'searching' | 'coming_soon'
  className?: string
}

function SearchingMarker() {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 5000, easing: Easing.linear }),
      -1,
      false,
    )
  }, [progress])

  const outerProps = useAnimatedProps(() => {
    const { x, y } = interpolatePath(progress.value)
    return { cx: x, cy: y, opacity: 0.08 + 0.06 * Math.sin(progress.value * Math.PI * 6) }
  })

  const midProps = useAnimatedProps(() => {
    const { x, y } = interpolatePath(progress.value)
    return { cx: x, cy: y, opacity: 0.14 + 0.08 * Math.sin(progress.value * Math.PI * 6 + 0.6) }
  })

  const coreProps = useAnimatedProps(() => {
    const { x, y } = interpolatePath(progress.value)
    return { cx: x, cy: y }
  })

  const dotProps = useAnimatedProps(() => {
    const { x, y } = interpolatePath(progress.value)
    return { cx: x, cy: y }
  })

  return (
    <>
      <AnimatedCircle animatedProps={outerProps} r={46} fill="#095742" />
      <AnimatedCircle animatedProps={midProps} r={34} fill="#095742" />
      <AnimatedCircle animatedProps={coreProps} r={22} fill="#095742" opacity={0.92} />
      <AnimatedCircle animatedProps={dotProps} r={8} fill="#FFFFFF" />
    </>
  )
}

export function CoverageMapIllustration({ variant = 'searching', className }: Props) {
  const searching = variant === 'searching'

  return (
    <View className={cn('items-center justify-center', className)}>
      <Svg width={280} height={160} viewBox="0 0 280 160" accessibilityLabel="Mapa ilustrativo">
        <Rect x={0} y={0} width={280} height={160} rx={16} fill="#E8F0EC" />
        <Path
          d={SEARCH_PATH}
          stroke="#49796B"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={searching ? '10 8' : undefined}
        />
        <Path
          d="M30 60 C 70 40, 110 70, 150 45 S 210 55, 250 35"
          stroke="#B8CFC6"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Rect x={48} y={48} width={36} height={24} rx={4} fill="#C5D9CE" />
        <Rect x={120} y={72} width={44} height={28} rx={4} fill="#C5D9CE" />
        <Rect x={188} y={52} width={32} height={22} rx={4} fill="#C5D9CE" />

        {searching ? (
          <SearchingMarker />
        ) : (
          <>
            <Circle cx={140} cy={88} r={34} fill="#095742" opacity={0.15} />
            <Circle cx={140} cy={88} r={22} fill="#095742" opacity={0.75} />
            <Circle cx={140} cy={88} r={8} fill="#FFFFFF" />
          </>
        )}
      </Svg>
    </View>
  )
}
