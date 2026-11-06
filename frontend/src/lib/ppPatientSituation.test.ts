import { describe, expect, it } from 'vitest'
import { resolvePPPatientSituation } from '@/lib/ppPatientSituation'

const openEvaluation = {
  evaluation_pending: true,
  latest_assessment_status: null,
  latest_cycle_status: null,
  latest_cycle_payment_status: null,
  pending_evolution_count: 0,
  care_status: 'ATIVO',
}

describe('resolvePPPatientSituation', () => {
  it('mostra avaliação pendente quando o paciente ativo ainda não tem avaliação', () => {
    expect(resolvePPPatientSituation(openEvaluation)).toBe('evaluation_pending')
  })

  it('mostra cancelado no óbito mesmo sem avaliação registrada', () => {
    expect(resolvePPPatientSituation({ ...openEvaluation, care_status: 'OBITO' })).toBe('cancelled')
  })

  it('mostra cancelado quando o cadastro já está cancelado e ainda há evolução em aberto', () => {
    expect(
      resolvePPPatientSituation({
        ...openEvaluation,
        care_status: 'CANCELADO',
        evaluation_pending: false,
        latest_assessment_status: 'avaliacao_feita',
        pending_evolution_count: 2,
      }),
    ).toBe('cancelled')
  })
})
