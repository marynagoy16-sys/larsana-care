import { cn } from '@/lib/utils'

type Props = {
  variant?: 'searching' | 'coming_soon'
  className?: string
}

export function CoverageMapIllustration({ variant = 'searching', className }: Props) {
  const pulse = variant === 'searching'

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <svg width={280} height={160} viewBox="0 0 280 160" aria-label="Mapa ilustrativo" className="max-w-full">
        <rect x={0} y={0} width={280} height={160} rx={16} fill="#E8F0EC" />
        <path
          d="M40 110 C 60 90, 80 120, 100 95 S 140 85, 160 100 S 200 115, 240 90"
          stroke="#49796B"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M30 60 C 70 40, 110 70, 150 45 S 210 55, 250 35"
          stroke="#B8CFC6"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <rect x={48} y={48} width={36} height={24} rx={4} fill="#C5D9CE" />
        <rect x={120} y={72} width={44} height={28} rx={4} fill="#C5D9CE" />
        <rect x={188} y={52} width={32} height={22} rx={4} fill="#C5D9CE" />
        <circle cx={140} cy={88} r={22} fill="#095742" opacity={pulse ? 0.9 : 0.75} />
        <circle cx={140} cy={88} r={34} fill="#095742" opacity={0.15} />
        {pulse ? <circle cx={140} cy={88} r={46} fill="#095742" opacity={0.08} /> : null}
        <circle cx={140} cy={88} r={8} fill="#FFFFFF" />
      </svg>
    </div>
  )
}
