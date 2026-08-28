import { differenceInYears, isValid, parseISO } from 'date-fns'
import { z } from 'zod'
import { trimText } from '@/lib/sanitize'
import { cpfSchema, dateSchema, optionalCpfSchema, requiredString } from '@/schemas/common'

export const patientReferralSourceValues = [
  'INDICACAO',
  'GOOGLE',
  'INSTAGRAM',
  'FACEBOOK',
  'OUTROS',
] as const

export type PatientReferralSource = (typeof patientReferralSourceValues)[number]

export const patientReferralSourceLabels: Record<PatientReferralSource, string> = {
  INDICACAO: 'Indicação',
  GOOGLE: 'Google',
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  OUTROS: 'Outros',
}

export const attendancePeriodValues = ['MANHA', 'TARDE', 'NOITE', 'INDIFERENTE'] as const

export const attendancePeriodLabels: Record<(typeof attendancePeriodValues)[number], string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  NOITE: 'Noite',
  INDIFERENTE: 'Indiferente',
}

function parseBirthDate(value: string): Date | null {
  const date = value.includes('T') ? parseISO(value) : parseISO(`${value}T12:00:00`)
  return isValid(date) ? date : null
}

export function requiresResponsibleByBirthDate(birthDate: string): boolean {
  const date = parseBirthDate(birthDate)
  if (!date) return false
  return differenceInYears(new Date(), date) < 18
}

export const patientGenderValues = ['FEMININO', 'MASCULINO', 'OUTRO', 'NAO_INFORMADO'] as const
export type PatientGender = (typeof patientGenderValues)[number]

export const patientGenderLabels: Record<PatientGender, string> = {
  FEMININO: 'Feminino',
  MASCULINO: 'Masculino',
  OUTRO: 'Outro',
  NAO_INFORMADO: 'Prefiro não informar',
}

export const patientMaritalStatusValues = [
  'SOLTEIRO',
  'CASADO',
  'DIVORCIADO',
  'VIUVO',
  'UNIAO_ESTAVEL',
  'NAO_INFORMADO',
] as const
export type PatientMaritalStatus = (typeof patientMaritalStatusValues)[number]

export const patientMaritalStatusLabels: Record<PatientMaritalStatus, string> = {
  SOLTEIRO: 'Solteiro(a)',
  CASADO: 'Casado(a)',
  DIVORCIADO: 'Divorciado(a)',
  VIUVO: 'Viúvo(a)',
  UNIAO_ESTAVEL: 'União estável',
  NAO_INFORMADO: 'Prefiro não informar',
}

const optionalPatientEnum = <T extends readonly [string, ...string[]]>(
  values: T,
  fallback: T[number],
) =>
  z.preprocess(
    (value) => (value === '' || value === undefined || value === null ? fallback : value),
    z.enum(values),
  )

export const patientServiceRequestStepOneSchema = z
  .object({
    patientFullName: requiredString('Nome do paciente'),
    patientCpf: cpfSchema,
    birthDate: dateSchema,
    birthPlace: requiredString('Naturalidade'),
    maritalStatus: optionalPatientEnum(patientMaritalStatusValues, 'NAO_INFORMADO'),
    gender: optionalPatientEnum(patientGenderValues, 'NAO_INFORMADO'),
    responsibleFullName: z.string().optional().transform((v) => (v ? trimText(v) : '')),
    responsibleCpf: optionalCpfSchema,
  })
  .superRefine((data, ctx) => {
    if (!requiresResponsibleByBirthDate(data.birthDate)) return

    if (!data.responsibleFullName?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['responsibleFullName'],
        message: 'Nome do responsável é obrigatório para menores de 18 anos',
      })
    }

    if (!data.responsibleCpf) {
      ctx.addIssue({
        code: 'custom',
        path: ['responsibleCpf'],
        message: 'CPF do responsável é obrigatório para menores de 18 anos',
      })
    }
  })

export const patientServiceRequestSchema = z
  .object({
    patientFullName: requiredString('Nome do paciente'),
    patientCpf: cpfSchema,
    birthDate: dateSchema,
    responsibleFullName: z.string().optional().transform((v) => (v ? trimText(v) : '')),
    responsibleCpf: optionalCpfSchema,
    attendancePeriod: z.enum(attendancePeriodValues, {
      message: 'Selecione o melhor período',
    }),
    diagnosticHypothesis: requiredString('Hipótese diagnóstica', 2000),
    referralSource: z.enum(patientReferralSourceValues, {
      message: 'Selecione como nos conheceu',
    }),
    birthPlace: requiredString('Naturalidade'),
    maritalStatus: optionalPatientEnum(patientMaritalStatusValues, 'NAO_INFORMADO'),
    gender: optionalPatientEnum(patientGenderValues, 'NAO_INFORMADO'),
    termsAccepted: z.literal(true, {
      message: 'É necessário aceitar os termos para continuar',
    }),
  })
  .superRefine((data, ctx) => {
    if (!requiresResponsibleByBirthDate(data.birthDate)) return

    if (!data.responsibleFullName?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['responsibleFullName'],
        message: 'Nome do responsável é obrigatório para menores de 18 anos',
      })
    }

    if (!data.responsibleCpf) {
      ctx.addIssue({
        code: 'custom',
        path: ['responsibleCpf'],
        message: 'CPF do responsável é obrigatório para menores de 18 anos',
      })
    }
  })

export type PatientServiceRequestValues = z.infer<typeof patientServiceRequestSchema>
