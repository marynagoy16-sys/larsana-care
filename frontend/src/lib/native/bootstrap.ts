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

  window.setTimeout(() => {
    void SplashScreen.hide()
  }, 400)
}
