/**
 * Auth storage adapter hook. Web keeps the Supabase default (localStorage).
 * Native will use @capacitor/preferences after the Capacitor shell is added.
 */
export function createAuthStorage(): undefined {
  return undefined
}
