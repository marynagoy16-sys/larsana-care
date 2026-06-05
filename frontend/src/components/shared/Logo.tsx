import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: 'light' | 'dark'
  className?: string
  subtitle?: string
  size?: 'sm' | 'md'
  collapsed?: boolean
  compact?: boolean
}

export function Logo({ variant = 'light', className, subtitle, size = 'sm', collapsed, compact }: LogoProps) {
  const onDark = variant === 'dark'
  const iconSize = compact
    ? 'w-[var(--sidebar-collapsed-item-size)] h-[var(--sidebar-collapsed-item-size)] text-sm rounded-xl'
    : size === 'md'
      ? 'w-11 h-11 text-base'
      : 'w-9 h-9 text-sm'
  const titleSize = size === 'md' ? 'text-lg' : 'text-sm'

  return (
    <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3', className)}>
      <div
        className={cn(
          'rounded-xl flex items-center justify-center font-display font-bold shrink-0',
          iconSize,
          onDark ? 'bg-white/15 text-white' : 'bg-brand-dark text-white',
        )}
      >
        LC
      </div>
      {!collapsed && (
        <div className="min-w-0">
          <p
            className={cn(
              'font-display font-bold leading-tight truncate',
              titleSize,
              onDark ? 'text-white' : 'text-foreground',
            )}
          >
            LarsanaCare
          </p>
          {subtitle && (
            <p
              className={cn(
                'text-[10px] truncate',
                onDark ? 'text-white/70' : 'text-muted-foreground',
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
