import { z } from 'zod'
import { sanitizeCpf, sanitizeEmail, sanitizePhone, trimText } from '@/lib/sanitize'
import { isValidCpf } from '@/lib/validators'

export const requiredString = (label: string, max = 255) =>
  z
    .string()
    .min(1, `${label} é obrigatório`)
    .max(max)
    .transform(trimText)

export const optionalString = z
  .string()
  .optional()
  .transform((v) => (v ? trimText(v) : undefined))

export const cpfSchema = z
  .string()
  .min(1, 'CPF é obrigatório')
  .transform(sanitizeCpf)
  .refine((v) => isValidCpf(v), 'CPF inválido')

export const optionalCpfSchema = z
  .string()
  .optional()
  .transform((v) => (v ? sanitizeCpf(v) : undefined))
  .refine((v) => !v || isValidCpf(v), 'CPF inválido')

export const emailSchema = z
  .string()
  .email('E-mail inválido')
  .transform(sanitizeEmail)

export const optionalEmailSchema = z
  .string()
  .optional()
  .transform((v) => (v ? sanitizeEmail(v) : undefined))
  .refine((v) => !v || z.string().email().safeParse(v).success, 'E-mail inválido')

export const phoneSchema = z
  .string()
  .min(10, 'Telefone inválido')
  .transform(sanitizePhone)

export const optionalPhoneSchema = z
  .string()
  .optional()
  .transform((v) => (v ? sanitizePhone(v) : undefined))

export const dateSchema = z
  .string()
  .min(1, 'Data é obrigatória')
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Data inválida')
  .refine((v) => new Date(v) <= new Date(), 'Data não pode ser futura')
