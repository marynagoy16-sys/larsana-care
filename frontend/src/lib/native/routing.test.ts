/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest'
import { STAFF_WEB_ONLY_PATH } from '@/lib/native/constants'
import { getAppHomePathForRole } from '@/lib/native/routing'

describe('getAppHomePathForRole', () => {
  afterEach(() => {
    delete (window as Window & { Capacitor?: unknown }).Capacitor
  })

  it('mantém /admin para staff na web', () => {
    expect(getAppHomePathForRole('admin')).toBe('/admin')
    expect(getAppHomePathForRole('financeiro')).toBe('/admin')
    expect(getAppHomePathForRole('gestao')).toBe('/admin')
  })

  it('envia staff para a tela web-only no runtime nativo', () => {
    ;(window as Window & { Capacitor?: { isNativePlatform: () => boolean } }).Capacitor = {
      isNativePlatform: () => true,
    }
    expect(getAppHomePathForRole('admin')).toBe(STAFF_WEB_ONLY_PATH)
    expect(getAppHomePathForRole('pp')).toBe('/profissional/agenda')
    expect(getAppHomePathForRole('paciente')).toBe('/paciente')
  })
})
