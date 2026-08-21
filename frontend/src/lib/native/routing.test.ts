/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Capacitor } from '@capacitor/core'
import { STAFF_WEB_ONLY_PATH } from '@/lib/native/constants'
import { getAppHomePathForRole } from '@/lib/native/routing'

describe('getAppHomePathForRole', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('mantém /admin para staff na web', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(false)
    expect(getAppHomePathForRole('admin')).toBe('/admin')
    expect(getAppHomePathForRole('financeiro')).toBe('/admin')
    expect(getAppHomePathForRole('gestao')).toBe('/admin')
  })

  it('envia staff para a tela web-only no runtime nativo', () => {
    vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true)
    expect(getAppHomePathForRole('admin')).toBe(STAFF_WEB_ONLY_PATH)
    expect(getAppHomePathForRole('pp')).toBe('/profissional/agenda')
    expect(getAppHomePathForRole('paciente')).toBe('/paciente')
  })
})
