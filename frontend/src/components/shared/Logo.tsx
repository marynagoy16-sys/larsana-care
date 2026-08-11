import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  getBrandLogoSrc,
  resolveBrandLayout,
  type BrandLogoLayout,
  type BrandLogoStyle,
  type BrandLogoVariant,
} from '@/lib/brandAssets'
import { cn } from '@/lib/utils'

interface LogoProps {
  variant?: BrandLogoVariant
  /** Alterna automaticamente entre fundo claro/escuro conforme o tema da aplicação */
  adaptToTheme?: boolean
  /** v1 = ouro + verde/branco · v2 = monocromático */
  style?: BrandLogoStyle
  layout?: BrandLogoLayout | 'auto'
  className?: string
  subtitle?: string
  size?: 'xs' | 'sm' | 'md'
  collapsed?: boolean
  compact?: boolean
  /** Logo vertical completo (login hero, splash) */
  full?: boolean
}

const layoutHeights: Record<BrandLogoLayout, Record<'xs' | 'sm' | 'md', string>> = {
  symbol: { xs: 'h-8 w-8', sm: 'h-9 w-9', md: 'h-11 w-11' },
  horizontal: { xs: 'h-6', sm: 'h-8', md: 'h-10' },
  vertical: { xs: 'h-12', sm: 'h-14', md: 'h-20' },
}

export function Logo({
  variant = 'light',
  adaptToTheme = false,
  style = 'v1',
  layout = 'auto',
  className,
  subtitle,
  size = 'sm',
  collapsed,
  compact,
  full,
}: LogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const themeVariant: BrandLogoVariant =
    mounted && resolvedTheme === 'dark' ? 'dark' : 'light'
  const activeVariant = adaptToTheme ? themeVariant : variant
  const onDark = activeVariant === 'dark'
  const resolvedLayout = resolveBrandLayout({ layout, full, collapsed, compact })
  const src = getBrandLogoSrc(resolvedLayout, activeVariant, style)
  const dimensionClass = layoutHeights[resolvedLayout][size]
  const isSymbol = resolvedLayout === 'symbol'

  return (
    <div
      className={cn(
        'flex',
        isSymbol && collapsed ? 'justify-center' : 'flex-col items-start gap-2',
        !isSymbol && !collapsed && subtitle ? 'gap-2' : undefined,
        className,
      )}
    >
      <img
        src={src}
        alt="Larsana Care"
        className={cn(
          'shrink-0 object-contain object-left',
          isSymbol ? cn('rounded-xl', dimensionClass) : cn('w-auto max-w-full', dimensionClass),
        )}
      />
      {subtitle && !collapsed && !isSymbol ? (
        <p
          className={cn(
            'text-[10px] font-medium uppercase tracking-widest truncate',
            onDark ? 'text-white/70' : 'text-muted-foreground',
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}
