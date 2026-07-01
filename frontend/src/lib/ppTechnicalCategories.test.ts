import { describe, expect, it } from 'vitest'
import {
  getPpTechnicalCategoryLabel,
  isCardiorrespiratoryCategory,
  normalizeTechnicalCategoriesForSave,
  ppHasCardiorrespiratoryCategory,
} from '@/lib/ppTechnicalCategories'

describe('ppTechnicalCategories', () => {
  it('labels categorias conhecidas', () => {
    expect(getPpTechnicalCategoryLabel('ortopedico')).toBe('Ortopédico')
    expect(getPpTechnicalCategoryLabel('cardiorrespiratoria')).toBe('Cardiorrespiratória')
    expect(getPpTechnicalCategoryLabel(null)).toBe('—')
  })

  it('identifica categoria cardiorrespiratória', () => {
    expect(isCardiorrespiratoryCategory('cardiorrespiratoria')).toBe(true)
    expect(isCardiorrespiratoryCategory('ortopedico')).toBe(false)
    expect(ppHasCardiorrespiratoryCategory(['neurologico', 'cardiorrespiratoria'])).toBe(true)
  })

  it('remove cardiorrespiratória quando PP não solicita habilitação', () => {
    expect(
      normalizeTechnicalCategoriesForSave(
        ['ortopedico', 'cardiorrespiratoria'],
        false,
      ),
    ).toEqual(['ortopedico'])
  })

  it('mantém cardiorrespiratória quando PP solicita habilitação', () => {
    expect(
      normalizeTechnicalCategoriesForSave(
        ['ortopedico', 'cardiorrespiratoria'],
        true,
      ),
    ).toEqual(['ortopedico', 'cardiorrespiratoria'])
  })
})
