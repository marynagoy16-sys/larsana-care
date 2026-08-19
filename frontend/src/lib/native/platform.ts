const NATIVE_PLATFORMS = new Set(['ios', 'android'])

type CapacitorBridge = {
  isNativePlatform?: () => boolean
  getPlatform?: () => string
}

function getCapacitorBridge(): CapacitorBridge | undefined {
  if (typeof window === 'undefined') return undefined
  return (window as Window & { Capacitor?: CapacitorBridge }).Capacitor
}

/** True only inside a Capacitor iOS/Android runtime — never in the browser. */
export function isNativeApp(): boolean {
  const capacitor = getCapacitorBridge()
  if (typeof capacitor?.isNativePlatform === 'function') {
    return capacitor.isNativePlatform() === true
  }
  return false
}

export function currentPlatform(): 'web' | 'ios' | 'android' | 'unknown' {
  if (!isNativeApp()) return 'web'
  const platform = getCapacitorBridge()?.getPlatform?.()
  if (platform === 'ios' || platform === 'android') return platform
  if (platform && NATIVE_PLATFORMS.has(platform)) return platform as 'ios' | 'android'
  return 'unknown'
}
