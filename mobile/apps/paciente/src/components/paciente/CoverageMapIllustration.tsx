import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { View } from 'react-native'
import { cn } from '@/lib/cn'

type Props = {
  variant?: 'searching' | 'coming_soon'
  className?: string
}

export function CoverageMapIllustration({ variant = 'searching', className }: Props) {
  const pulse = variant === 'searching'

  return (
    <View className={cn('items-center justify-center', className)}>
      <Svg width={280} height={160} viewBox="0 0 280 160" accessibilityLabel="Mapa ilustrativo">
        <Rect x={0} y={0} width={280} height={160} rx={16} fill="#E8F0EC" />
        <Path
          d="M40 110 C 60 90, 80 120, 100 95 S 140 85, 160 100 S 200 115, 240 90"
          stroke="#49796B"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
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
        <Circle cx={140} cy={88} r={22} fill="#095742" opacity={pulse ? 0.9 : 0.75} />
        <Circle cx={140} cy={88} r={34} fill="#095742" opacity={0.15} />
        {pulse ? <Circle cx={140} cy={88} r={46} fill="#095742" opacity={0.08} /> : null}
        <Circle cx={140} cy={88} r={8} fill="#FFFFFF" />
      </Svg>
    </View>
  )
}
