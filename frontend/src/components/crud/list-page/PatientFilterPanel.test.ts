import { describe, expect, it } from 'vitest'
import { isSolePatientFilter } from '@/components/crud/list-page/PatientFilterPanel'

describe('isSolePatientFilter', () => {
  it('reconhece o filtro de ativos isolado', () => {
    expect(isSolePatientFilter({ care_status: 'ATIVO' }, { care_status: 'ATIVO' })).toBe(true)
    expect(
      isSolePatientFilter(
        { care_status: 'ATIVO', region_id: 'regiao' },
        { care_status: 'ATIVO' },
      ),
    ).toBe(false)
    expect(isSolePatientFilter({ sem_pp: true }, { care_status: 'ATIVO' })).toBe(false)
  })
})
