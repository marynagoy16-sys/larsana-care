import { describe, expect, it } from 'vitest'
import { isValidCpf } from '@/lib/validators'

describe('validators', () => {
  it('valida CPF correto', () => {
    expect(isValidCpf('52998224725')).toBe(true)
  })

  it('rejeita CPF com dígitos repetidos', () => {
    expect(isValidCpf('11111111111')).toBe(false)
  })
})
