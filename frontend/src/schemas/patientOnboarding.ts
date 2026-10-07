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
    cityId: z.string().uuid().optional().or(z.literal('')),
    regionId: z.string().uuid().optional().or(z.literal('')),
    cityName: z.string().trim().min(2, 'Informe a cidade'),
    state: z.string().trim().length(2, 'Informe a UF'),
  })

export type PatientOnboardingValues = z.infer<typeof patientOnboardingSchema>
