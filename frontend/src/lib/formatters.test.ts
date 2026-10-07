import { describe, expect, it } from 'vitest'
import { formatCpf, formatCpfCnpj, formatCurrency, formatDate, formatPhone, maskCpfCnpjInput } from '@/lib/formatters'

describe('formatters', () => {
  it('formata CPF com 11 dígitos', () => {
    expect(formatCpf('12345678901')).toBe('123.456.789-01')
  })

  it('formata CNPJ com 14 dígitos e preserva a digitação', () => {
    expect(formatCpfCnpj('12345678000199')).toBe('12.345.678/0001-99')
    expect(maskCpfCnpjInput('12345678000199')).toBe('12.345.678/0001-99')
  })

  it('formata moeda em centavos', () => {
    expect(formatCurrency(123456)).toContain('1.234,56')
  })

  it('formata data ISO', () => {
    expect(formatDate('2026-06-05')).toBe('05/06/2026')
  })

  it('formata telefone celular', () => {
    expect(formatPhone('11999998888')).toBe('(11) 99999-8888')
  })
})
