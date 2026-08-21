/**
 * Native shell bootstrap. Safe to call on web — no-op outside Capacitor.
 */
import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { isNativeApp } from '@/lib/native/platform'

export async function bootstrapNativeShell(): Promise<void> {
  if (!isNativeApp()) return

  try {
    await StatusBar.setOverlaysWebView({ overlay: true })
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#FCFBF7' })
  } catch {
    // Status bar plugin may be unavailable during first web preview.
  }

  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
      return
    }
    void App.minimizeApp()
  })

  App.addListener('appUrlOpen', ({ url }) => {
    try {
      const parsed = new URL(url)
      const path = parsed.pathname || `/${parsed.host}`
      const next = `${path}${parsed.search}${parsed.hash}`
      if (next && next !== '/' && window.location.pathname !== path) {
        window.location.replace(next)
      }
    } catch {
      // Ignore malformed deep links.
    }
  })

  window.setTimeout(() => {
    void SplashScreen.hide()
  }, 400)
}
