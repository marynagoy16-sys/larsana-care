/**
 * Native shell bootstrap. Capacitor plugins are wired here after `cap init`.
 * Safe to call on web — it is a no-op outside the native runtime.
 */
import { isNativeApp } from '@/lib/native/platform'

export async function bootstrapNativeShell(): Promise<void> {
  if (!isNativeApp()) return
}
