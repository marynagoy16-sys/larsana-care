import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Native shell for the LarsanaCare public app (paciente + pp).
 *
 * Production MUST NOT set `server.url`. Live-reload belongs only in an
 * uncommitted local file (see capacitor.config.dev.ts in .gitignore).
 *
 * App ID `br.com.larsanacare.app` is the proposed store identifier.
 * Validate Apple Developer / Play Console before creating the App ID.
 * See docs/CAPACITOR_APP_IDS.md.
 */
const config: CapacitorConfig = {
  appId: 'br.com.larsanacare.app',
  appName: 'LarsanaCare',
  webDir: 'dist',
  backgroundColor: '#FCFBF7',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#FCFBF7',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#095742',
      showSpinner: false,
      androidScaleType: 'CENTER_INSIDE',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#FCFBF7',
    },
    Keyboard: {
      resize: 'native',
    },
  },
}

export default config
