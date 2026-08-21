/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Capacitor } from '@capacitor/core'
import { createAuthStorage } from '@/lib/native/storage'

describe('createAuthStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('usa o default do Supabase (localStorage) no navegador', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false)
    expect(createAuthStorage()).toBeUndefined()
  })

  it('expõe adapter persistente no runtime nativo', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true)
    const storage = createAuthStorage()
    expect(storage).toBeDefined()
    expect(typeof storage?.getItem).toBe('function')
    expect(typeof storage?.setItem).toBe('function')
    expect(typeof storage?.removeItem).toBe('function')
  })
})
