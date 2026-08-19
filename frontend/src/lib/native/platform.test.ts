/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest'
import { currentPlatform, isNativeApp } from '@/lib/native/platform'

describe('isNativeApp', () => {
  afterEach(() => {
    delete (window as Window & { Capacitor?: unknown }).Capacitor
  })

  it('é falso no navegador', () => {
    expect(isNativeApp()).toBe(false)
    expect(currentPlatform()).toBe('web')
  })

  it('é verdadeiro só quando Capacitor reporta plataforma nativa', () => {
    ;(window as Window & { Capacitor?: { isNativePlatform: () => boolean; getPlatform: () => string } }).Capacitor = {
      isNativePlatform: () => true,
      getPlatform: () => 'android',
    }
    expect(isNativeApp()).toBe(true)
    expect(currentPlatform()).toBe('android')
  })
})
