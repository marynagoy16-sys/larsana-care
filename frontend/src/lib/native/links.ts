import { PLATFORM_WEB_URL } from '@/lib/native/constants'
import { isNativeApp } from '@/lib/native/platform'

export async function openExternalUrl(url: string): Promise<void> {
  if (!url) return

  if (isNativeApp()) {
    const { Browser } = await import('@capacitor/browser')
    await Browser.open({ url })
    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

export async function openPlatformWeb(): Promise<void> {
  if (isNativeApp()) {
    await openExternalUrl(PLATFORM_WEB_URL)
    return
  }
  window.location.assign(PLATFORM_WEB_URL)
}
