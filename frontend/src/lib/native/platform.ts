import { Capacitor } from '@capacitor/core'

/** True only inside a Capacitor iOS/Android runtime — never in the browser. */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform()
}

export function currentPlatform(): 'web' | 'ios' | 'android' | 'unknown' {
  if (!isNativeApp()) return 'web'
  const platform = Capacitor.getPlatform()
  if (platform === 'ios' || platform === 'android') return platform
  return 'unknown'
}
