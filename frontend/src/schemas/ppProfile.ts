import { z } from 'zod'
import { emailSchema, requiredString } from '@/schemas/common'

export const ppProfileSchema = z.object({
  full_name: requiredString('Nome completo'),
  email: emailSchema,
  profession: z.enum(['FISIO', 'NUTI', 'MED', 'CUID', 'FONO']),
})

export type PpProfileValues = z.infer<typeof ppProfileSchema>
