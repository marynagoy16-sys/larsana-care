import { describe, expect, it } from 'vitest'
import { computeStepCompletion, type CredentialingSnapshot } from '@/lib/credentialingModel'

const baseSnapshot = (): CredentialingSnapshot => ({
  professional: {
    id: 'pp-1',
    full_name: 'Test PP',
    cpf_cnpj: '52998224725',
    person_type: 'PF',
    birth_date: '1990-01-01',
    email: 'pp@test.com',
    phone: '11999990000',
    address: 'Rua Teste',
    profession: 'FISIO',
    specialty: null,
    technical_categories: ['ortopedico'],
    patient_preferences: ['ortopedico'],
    cardiorrespiratory_habilitation_status: 'nao_solicitado',
    cardiorrespiratory_request_basis: null,
    cardiorrespiratory_experience_description: null,
    credentialing_status: 'rascunho',
    flag_assinado: false,
  },
  council: { council_type: 'CREFITO', registration_number: '123456-F' },
  bank: {
    bank_code: null,
    bank_name: 'Banco',
    agency: '0001',
    account_number: '12345-6',
    account_type: 'corrente',
    pix_key: 'pp@test.com',
    holder_name: 'Test PP',
    holder_document: '52998224725',
  },
  documents: [
    { id: '1', document_type: 'RG_CNH', file_name: 'rg.pdf', storage_path: 'x', source_url: null },
    { id: '2', document_type: 'COUNCIL_CARD', file_name: 'c.pdf', storage_path: 'x', source_url: null },
    { id: '3', document_type: 'CRIMINAL_BACKGROUND', file_name: 'a.pdf', storage_path: 'x', source_url: null },
  ],
  acceptedTermTypes: [],
  contract: null,
})

describe('credentialingModel categorias step', () => {
  it('marca etapa categorias completa com categoria geral', () => {
    const completion = computeStepCompletion(baseSnapshot())
    expect(completion.categorias).toBe(true)
  })

  it('exige dados de solicitação quando cardiorrespiratória está selecionada', () => {
    const snapshot = baseSnapshot()
    snapshot.professional.technical_categories = ['cardiorrespiratoria']
    expect(computeStepCompletion(snapshot).categorias).toBe(false)

    snapshot.professional.cardiorrespiratory_request_basis = 'experiencia'
    snapshot.professional.cardiorrespiratory_experience_description = '10 anos em UTI'
    expect(computeStepCompletion(snapshot).categorias).toBe(true)
  })
})
