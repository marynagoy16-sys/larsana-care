/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest'
import { digitsOnly, sanitizeCpf, sanitizeEmail, sanitizeRichText, sanitizeStorageFileName, trimText } from '@/lib/sanitize'

describe('sanitize', () => {
  it('remove espaços duplos', () => {
    expect(trimText('  foo   bar  ')).toBe('foo bar')
  })

  it('extrai só dígitos', () => {
    expect(digitsOnly('12.3-45')).toBe('12345')
  })

  it('sanitiza CPF', () => {
    expect(sanitizeCpf('123.456.789-01')).toBe('12345678901')
  })

  it('sanitiza e-mail', () => {
    expect(sanitizeEmail('  Foo@Bar.COM ')).toBe('foo@bar.com')
  })

  it('remove scripts do rich text', () => {
    const html = '<p>ok</p><script>alert(1)</script>'
    expect(sanitizeRichText(html)).not.toContain('script')
    expect(sanitizeRichText(html)).toContain('ok')
  })

  it('sanitiza nome de arquivo para storage', () => {
    expect(
      sanitizeStorageFileName('E-mail de Sagitta Digital - Entrega do Projeto - Clínica Guedes.pdf'),
    ).toBe('E-mail-de-Sagitta-Digital-Entrega-do-Projeto-Clinica-Guedes.pdf')
  })
})
