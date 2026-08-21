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
import { sanitizeCep, trimText } from '@/lib/sanitize'


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

export type PatientStepValues = z.infer<typeof patientStepSchema>
export type ResponsibleStepValues = z.infer<typeof responsibleStepSchema>
export type AddressStepValues = z.infer<typeof addressStepSchema>
export type PatientWizardValues = z.infer<typeof patientWizardSchema>
