export type BrandLogoVariant = 'light' | 'dark'
export type BrandLogoStyle = 'v1' | 'v2'
export type BrandLogoLayout = 'horizontal' | 'vertical' | 'symbol'

/** Referência dos SVGs oficiais Larsana (paths relativos ao public/ web). */
export const brandAssets = {
  horizontal: {
    v1: {
      light: '/brand/logo-horizontal-v1-light.svg',
      dark: '/brand/logo-horizontal-v1-dark.svg',
    },
    v2: {
      light: '/brand/logo-horizontal-v2-light.svg',
      dark: '/brand/logo-horizontal-v2-dark.svg',
    },
  },
  vertical: {
    v1: {
      light: '/brand/logo-vertical-v1-light.svg',
      dark: '/brand/logo-vertical-v1-dark.svg',
    },
    v2: {
      light: '/brand/logo-vertical-v2-light.svg',
      dark: '/brand/logo-vertical-v2-dark.svg',
    },
  },
  symbol: {
    v1: {
      light: '/brand/symbol-v1-light.svg',
      dark: '/brand/symbol-v1-dark.svg',
    },
    v2: {
      light: '/brand/symbol-v2-light.svg',
      dark: '/brand/symbol-v2-dark.svg',
    },
  },
  favicon: '/favicon.svg',
} as const

export function getBrandLogoSrc(
  layout: BrandLogoLayout,
  variant: BrandLogoVariant,
  style: BrandLogoStyle = 'v1',
) {
  return brandAssets[layout][style][variant]
}

export function resolveBrandLayout(options: {
  layout?: BrandLogoLayout | 'auto'
  full?: boolean
  collapsed?: boolean
  compact?: boolean
}): BrandLogoLayout {
  if (options.layout && options.layout !== 'auto') return options.layout
  if (options.full) return 'vertical'
  if (options.collapsed || options.compact) return 'symbol'
  return 'horizontal'
}
