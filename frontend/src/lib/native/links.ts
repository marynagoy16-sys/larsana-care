import { PLATFORM_WEB_URL } from '@/lib/native/constants'
import { isNativeApp } from '@/lib/native/platform'

/**
 * Opens an external URL. After Capacitor plugins are installed this will use
 * `@capacitor/browser`; until then it falls back to `window.open`.
 */
export async function openExternalUrl(url: string): Promise<void> {
  if (!url) return
  window.open(url, '_blank', 'noopener,noreferrer')
}

export async function openPlatformWeb(): Promise<void> {
  if (isNativeApp()) {
    await openExternalUrl(PLATFORM_WEB_URL)
    return
  }
  window.location.assign(PLATFORM_WEB_URL)
}
