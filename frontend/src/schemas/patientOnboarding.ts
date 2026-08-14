import { z } from 'zod'
import { phoneSchema, requiredString } from '@/schemas/common'
import { sanitizeCep, trimText } from '@/lib/sanitize'

export const patientOnboardingSchema = z
  .object({
    patientFullName: requiredString('Nome do paciente'),
    phone: phoneSchema,
    street: requiredString('Rua'),
    number: requiredString('Número', 20),
    complement: z.string().optional().transform((v) => (v ? trimText(v) : undefined)),
    neighborhood: requiredString('Bairro'),
    postalCode: z.string().min(8, 'CEP inválido').transform(sanitizeCep),
    cityId: z.string().uuid('Selecione a cidade'),
    regionId: z.string().uuid('Selecione a cidade'),
  })

export type PatientOnboardingValues = z.infer<typeof patientOnboardingSchema>
