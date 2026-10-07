import { z } from 'zod'
import { isAsaasWalletId } from '@/constants/asaas'
import { emailSchema, requiredString } from '@/schemas/common'

export const ppProfileSchema = z.object({
  full_name: requiredString('Nome completo'),
  email: emailSchema,
  profession: z.enum(['FISIO', 'NUTI', 'MED', 'CUID', 'FONO']),
  asaas_wallet_id: z
    .string()
    .trim()
    .refine((value) => value === '' || isAsaasWalletId(value), 'Wallet ID inválido'),
})

export type PpProfileValues = z.infer<typeof ppProfileSchema>
