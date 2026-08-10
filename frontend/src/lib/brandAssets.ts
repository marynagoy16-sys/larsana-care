export type BrandLogoVariant = 'light' | 'dark'
export type BrandLogoStyle = 'v1' | 'v2'
export type BrandLogoLayout = 'horizontal' | 'vertical' | 'symbol'

/** Caminhos públicos dos SVGs oficiais Larsana (frontend web). */
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

/** PNGs legados — fallback mobile e contextos sem SVG. */
export const brandAssetsPng = {
  logoDarkFull: '/brand/logo-dark-full.png',
  logoLightFull: '/brand/logo-light-full.png',
  markGoldOnDark: '/brand/mark-gold-on-dark.png',
  markGoldOnLight: '/brand/mark-gold-on-light.png',
  markWhiteOnDark: '/brand/mark-white-on-dark.png',
  markGreenOnLight: '/brand/mark-green-on-light.png',
  favicon: '/favicon.png',
} as const

export function getBrandLogoSrc(
  layout: BrandLogoLayout,
  variant: BrandLogoVariant,
  style: BrandLogoStyle = 'v1',
) {
  return brandAssets[layout][style][variant]
}

/** @deprecated Use getBrandLogoSrc('symbol', variant, style) */
export function getBrandMarkSrc(variant: BrandLogoVariant, style: BrandLogoStyle = 'v1') {
  return getBrandLogoSrc('symbol', variant, style)
}

/** @deprecated Use getBrandLogoSrc('vertical', variant, style) */
export function getBrandFullLogoSrc(variant: BrandLogoVariant, style: BrandLogoStyle = 'v1') {
  return getBrandLogoSrc('vertical', variant, style)
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
