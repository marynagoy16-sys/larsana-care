import { z } from 'zod'
import {
  cpfSchema,
  dateSchema,
  emailSchema,
  optionalString,
  phoneSchema,
  requiredString,
} from '@/schemas/common'
import { sanitizeCpf, trimText } from '@/lib/sanitize'

export const dadosStepSchema = z.object({
  full_name: requiredString('Nome completo'),
  person_type: z.enum(['PF', 'PJ']),
  cpf_cnpj: z.string().min(1, 'Documento é obrigatório').transform(trimText),
  birth_date: dateSchema,
  email: emailSchema,
  phone: phoneSchema,
  address: requiredString('Endereço'),
  profession: z.enum(['FISIO', 'NUTI', 'MED', 'CUID', 'FONO']),
  referral_code: optionalString,
}).superRefine((data, ctx) => {
  if (data.person_type === 'PF') {
    const cpf = sanitizeCpf(data.cpf_cnpj)
    const result = cpfSchema.safeParse(cpf)
    if (!result.success) {
      ctx.addIssue({ code: 'custom', message: 'CPF inválido', path: ['cpf_cnpj'] })
    }
  } else if (data.cpf_cnpj.replace(/\D/g, '').length < 14) {
    ctx.addIssue({ code: 'custom', message: 'CNPJ inválido', path: ['cpf_cnpj'] })
  }
})

export const conselhoStepSchema = z.object({
  council_type: z.enum(['CREFITO', 'COREN']),
  registration_number: requiredString('Número de registro', 32),
})

export const bancoStepSchema = z.object({
  bank_code: optionalString,
  bank_name: requiredString('Banco'),
  agency: requiredString('Agência', 16),
  account_number: requiredString('Conta', 32),
  account_type: z.enum(['corrente', 'poupanca']).default('corrente'),
  pix_key: requiredString('Chave PIX', 128),
  holder_name: requiredString('Titular da conta'),
  holder_document: z.string().min(11, 'CPF/CNPJ do titular inválido').transform(trimText),
})

export const contratoAcceptSchema = z.object({
  acceptDiretrizes: z.boolean().refine((v) => v === true, { message: 'Aceite as diretrizes' }),
  acceptLgpd: z.boolean().refine((v) => v === true, { message: 'Aceite a política de privacidade' }),
  acceptContract: z.boolean().refine((v) => v === true, { message: 'Aceite o contrato LRS-PROF' }),
})

const ppTechnicalCategoryEnum = z.enum([
  'ortopedico',
  'pos_operatorio',
  'neurologico',
  'idoso_gerontologia',
  'funcional_condicionamento',
  'pediatrico_geral',
  'cardiorrespiratoria',
  'atendimento_unico',
])

const cardiorrespiratoryRequestBasisEnum = z.enum([
  'certificado',
  'experiencia',
  'certificado_e_experiencia',
  'analise_larsana',
])

export const categoriasStepSchema = z
  .object({
    technical_categories: z
      .array(ppTechnicalCategoryEnum)
      .min(1, 'Selecione ao menos uma categoria técnica'),
    patient_preferences: z.array(ppTechnicalCategoryEnum).optional().default([]),
    requests_cardio_habilitation: z.boolean(),
    cardiorrespiratory_request_basis: cardiorrespiratoryRequestBasisEnum.optional(),
    cardiorrespiratory_experience_description: optionalString,
  })
  .superRefine((data, ctx) => {
    const wantsCardio = data.technical_categories.includes('cardiorrespiratoria')

    if (!wantsCardio) return

    if (data.requests_cardio_habilitation !== true && data.requests_cardio_habilitation !== false) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe se deseja solicitar habilitação Cardiorrespiratória',
        path: ['requests_cardio_habilitation'],
      })
      return
    }

    if (!data.requests_cardio_habilitation) return

    if (!data.cardiorrespiratory_request_basis) {
      ctx.addIssue({
        code: 'custom',
        message: 'Informe a base da sua solicitação',
        path: ['cardiorrespiratory_request_basis'],
      })
    }

    if (!data.cardiorrespiratory_experience_description?.trim()) {
      ctx.addIssue({
        code: 'custom',
        message: 'Descreva brevemente sua experiência em Cardiorrespiratória',
        path: ['cardiorrespiratory_experience_description'],
      })
    }
  })

export type DadosStepValues = z.infer<typeof dadosStepSchema>
export type CategoriasStepValues = z.infer<typeof categoriasStepSchema>
export type ConselhoStepValues = z.infer<typeof conselhoStepSchema>
export type BancoStepValues = z.infer<typeof bancoStepSchema>
export type ContratoAcceptValues = z.infer<typeof contratoAcceptSchema>
