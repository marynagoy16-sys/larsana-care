/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Capacitor } from '@capacitor/core'
import { currentPlatform, isNativeApp } from '@/lib/native/platform'

describe('isNativeApp', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('é falso no navegador', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false)
    expect(isNativeApp()).toBe(false)
    expect(currentPlatform()).toBe('web')
  })

  it('é verdadeiro só quando Capacitor reporta plataforma nativa', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true)
    vi.spyOn(Capacitor, 'getPlatform').mockReturnValue('android')
    expect(isNativeApp()).toBe(true)
    expect(currentPlatform()).toBe('android')
  })
})
