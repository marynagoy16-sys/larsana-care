import { cn } from '@/lib/utils'

const SEARCH_PATH =
  'M40 110 C 60 90, 80 120, 100 95 S 140 85, 160 100 S 200 115, 240 90'

type Props = {
  variant?: 'searching' | 'coming_soon'
  className?: string
}

export function CoverageMapIllustration({ variant = 'searching', className }: Props) {
  const searching = variant === 'searching'

  return (
    <div className={cn('w-full', className)}>
      <style>{`
        @keyframes map-marker-pulse {
          0%, 100% { transform: scale(1); opacity: 0.12; }
          50% { transform: scale(1.12); opacity: 0.22; }
        }
        @keyframes map-road-dash {
          to { stroke-dashoffset: -48; }
        }
        .map-marker-outer {
          transform-box: fill-box;
          transform-origin: center;
          animation: map-marker-pulse 2s ease-in-out infinite;
        }
        .map-marker-mid {
          transform-box: fill-box;
          transform-origin: center;
          animation: map-marker-pulse 2s ease-in-out infinite 0.35s;
        }
        .map-road-active {
          stroke-dasharray: 10 8;
          animation: map-road-dash 1.6s linear infinite;
        }
      `}</style>
      <svg
        viewBox="0 0 280 160"
        aria-label="Mapa ilustrativo"
        className="h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect x={0} y={0} width={280} height={160} rx={16} fill="#E8F0EC" />
        <path
          d={SEARCH_PATH}
          stroke="#49796B"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          className={searching ? 'map-road-active' : undefined}
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

        {searching ? (
          <g>
            <animateMotion
              dur="5s"
              repeatCount="indefinite"
              path={SEARCH_PATH}
              calcMode="linear"
            />
            <circle className="map-marker-outer" r={46} fill="#095742" opacity={0.1} />
            <circle className="map-marker-mid" r={34} fill="#095742" opacity={0.16} />
            <circle r={22} fill="#095742" opacity={0.92} />
            <circle r={8} fill="#FFFFFF" />
          </g>
        ) : (
          <g transform="translate(140, 88)">
            <circle r={34} fill="#095742" opacity={0.15} />
            <circle r={22} fill="#095742" opacity={0.75} />
            <circle r={8} fill="#FFFFFF" />
          </g>
        )}
      </svg>
    </div>
  )
}
