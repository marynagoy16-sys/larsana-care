import { describe, expect, it } from 'vitest'
import { computeScrollDelta, shellHeightOverride, stuckViewportOffset } from '@/lib/mobileKeyboardViewport'

describe('stuckViewportOffset', () => {
  it('ignora o offset pequeno da barra do navegador', () => {
    expect(stuckViewportOffset(12, 1)).toBe(0)
    expect(stuckViewportOffset(0, 1)).toBe(0)
  })

  it('corrige o pan que sobra depois que o teclado fecha', () => {
    expect(stuckViewportOffset(312, 1)).toBe(312)
    expect(stuckViewportOffset(280.4, 1)).toBe(280)
  })

  it('não mexe quando o usuário deu zoom', () => {
    expect(stuckViewportOffset(300, 1.2)).toBe(0)
  })
})

describe('shellHeightOverride', () => {
  it('não trava a altura com o teclado aberto', () => {
    expect(shellHeightOverride(800, 420)).toBeNull()
  })

  it('usa a altura visível quando o teclado fechou', () => {
    expect(shellHeightOverride(800, 780)).toBe(780)
    expect(shellHeightOverride(812, 812)).toBe(812)
  })
})

describe('computeScrollDelta', () => {
  it('não rola quando o campo já está visível', () => {
    expect(
      computeScrollDelta({ fieldTop: 120, fieldBottom: 180, visibleTop: 64, visibleBottom: 700 }),
    ).toBe(0)
  })

  it('sobe o campo que ficou atrás do teclado', () => {
    const delta = computeScrollDelta({
      fieldTop: 640,
      fieldBottom: 700,
      visibleTop: 64,
      visibleBottom: 520,
    })
    expect(delta).toBeGreaterThan(0)
    expect(delta).toBe(700 - (520 - 16))
  })

  it('desce o campo que ficou atrás do cabeçalho', () => {
    const delta = computeScrollDelta({
      fieldTop: 8,
      fieldBottom: 72,
      visibleTop: 80,
      visibleBottom: 700,
    })
    expect(delta).toBe(8 - (80 + 16))
  })

  it('não tenta encaixar um textarea alto inteiro, só o começo', () => {
    expect(
      computeScrollDelta({ fieldTop: 100, fieldBottom: 900, visibleTop: 0, visibleBottom: 500 }),
    ).toBe(0)
  })
})
