import { z } from 'zod'
import {
  cpfSchema,
  dateSchema,
  emailSchema,
  optionalPhoneSchema,
  optionalString,
  phoneSchema,
  requiredString,
} from '@/schemas/common'
import { isValidCpf } from '@/lib/validators'
import { sanitizeCep, sanitizeCpf, trimText } from '@/lib/sanitize'


export const patientCareStatusSchema = z.enum([
  'ATIVO',
  'PAUSA',
  'PAUSA_JUSTIFICADA',
  'PAUSA_SOLICITADA_PACIENTE',
  'ALTA',
  'OBITO',
  'CANCELADO',
])

export const patientStepSchema = z.object({
  full_name: requiredString('Nome completo'),
  cpf: cpfSchema,
  birth_date: dateSchema,
  patient_level: z.enum(['N1', 'N2', 'N3', 'VALOR_SOCIAL']),
  care_status: patientCareStatusSchema.default('ATIVO'),
  region_id: z.string().uuid('Selecione a região'),
  city_id: z.string().uuid('Selecione a cidade'),
  allocated_professional_id: z.string().uuid().optional().nullable(),
  suggested_weekly_frequency: z.number().min(1).max(7).optional().nullable(),
  attendance_period: z.enum(['MANHA', 'TARDE', 'NOITE', 'INDIFERENTE']).optional().nullable(),
  technical_category: z
    .enum([
      'ortopedico',
      'pos_operatorio',
      'neurologico',
      'idoso_gerontologia',
      'funcional_condicionamento',
      'pediatrico_geral',
      'cardiorrespiratoria',
      'atendimento_unico',
    ])
    .optional()
    .nullable(),
  clinical_summary: optionalString,
  is_valor_social: z.boolean().default(false),
})

export const responsibleStepSchema = z.object({
  full_name: requiredString('Nome do responsável'),
  cpf: cpfSchema,
  email: emailSchema,
  phone: phoneSchema,
  backup_phone: optionalPhoneSchema,
  is_primary: z.boolean().default(true),
})

export const addressStepSchema = z.object({
  street: requiredString('Rua'),
  number: requiredString('Número', 20),
  complement: optionalString,
  neighborhood: requiredString('Bairro'),
  postal_code: z.string().min(8, 'CEP inválido').transform(sanitizeCep),
  city_id: z.string().uuid('Selecione a cidade'),
  full_address: z.string().optional(),
}).transform((data) => ({
  ...data,
  full_address: trimText(
    `${data.street}, ${data.number}${data.complement ? ` - ${data.complement}` : ''}, ${data.neighborhood}`,
  ),
}))

export const documentItemSchema = z.object({
  document_type: z.enum(['RG', 'LAUDO', 'EXAME', 'OUTRO']),
  file_name: requiredString('Nome do arquivo'),
})

export const patientWizardSchema = z.object({
  patient: patientStepSchema,
  responsible: responsibleStepSchema,
  address: addressStepSchema,
  documents: z.array(documentItemSchema).optional().default([]),
}).superRefine((data, ctx) => {
  if (data.patient.city_id !== data.address.city_id) {
    ctx.addIssue({
      code: 'custom',
      message: 'A cidade do paciente deve ser a mesma do endereço',
      path: ['address', 'city_id'],
    })
  }
})

const emptyToNull = (value: string | null | undefined) => {
  const trimmed = value?.trim() ?? ''
  return trimmed.length ? trimmed : null
}

const optionalUuidField = z
  .string()
  .nullable()
  .optional()
  .transform((value) => emptyToNull(value))
  .refine((value) => value == null || z.string().uuid().safeParse(value).success, 'Valor inválido')

export const patientEditSchema = z.object({
  full_name: requiredString('Nome completo'),
  cpf: z
    .string()
    .nullable()
    .optional()
    .transform((value) => {
      const digits = value ? sanitizeCpf(value) : ''
      return digits.length ? digits : null
    })
    .refine((value) => value == null || isValidCpf(value), 'CPF inválido'),
  birth_date: z
    .string()
    .nullable()
    .optional()
    .transform((value) => emptyToNull(value))
    .refine((value) => value == null || !Number.isNaN(Date.parse(value)), 'Data inválida')
    .refine((value) => value == null || new Date(value) <= new Date(), 'Data não pode ser futura'),
  patient_level: z.enum(['N1', 'N2', 'N3', 'VALOR_SOCIAL']),
  care_status: patientCareStatusSchema,
  region_id: optionalUuidField,
  city_id: optionalUuidField,
  allocated_professional_id: optionalUuidField,
  suggested_weekly_frequency: z.number().min(1).max(7).optional().nullable(),
  attendance_period: z.enum(['MANHA', 'TARDE', 'NOITE', 'INDIFERENTE']).optional().nullable(),
  technical_category: z
    .enum([
      'ortopedico',
      'pos_operatorio',
      'neurologico',
      'idoso_gerontologia',
      'funcional_condicionamento',
      'pediatrico_geral',
      'cardiorrespiratoria',
      'atendimento_unico',
    ])
    .optional()
    .nullable(),
  clinical_summary: z
    .string()
    .nullable()
    .optional()
    .transform((value) => emptyToNull(value)),
  is_valor_social: z.boolean().default(false),
})

export type PatientStepValues = z.infer<typeof patientStepSchema>
export type PatientEditValues = z.infer<typeof patientEditSchema>
export type ResponsibleStepValues = z.infer<typeof responsibleStepSchema>
export type AddressStepValues = z.infer<typeof addressStepSchema>
export type PatientWizardValues = z.infer<typeof patientWizardSchema>
