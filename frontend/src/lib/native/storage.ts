/**
 * Auth storage adapter. Web keeps the Supabase default (localStorage).
 * Native uses @capacitor/preferences so the session survives cold start.
 */
import type { SupportedStorage } from '@supabase/supabase-js'
import { Preferences } from '@capacitor/preferences'
import { isNativeApp } from '@/lib/native/platform'

export function createAuthStorage(): SupportedStorage | undefined {
  if (!isNativeApp()) return undefined

  return {
    getItem: async (key: string) => {
      const { value } = await Preferences.get({ key })
      return value
    },
    setItem: async (key: string, value: string) => {
      await Preferences.set({ key, value })
    },
    removeItem: async (key: string) => {
      await Preferences.remove({ key })
    },
  }
}
