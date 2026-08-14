import { z } from 'zod'
import { defaultPriorConditions } from '@/lib/assessmentPriorConditions'

export const PROPOSAL_PATIENT_LEVELS = ['N1', 'N2', 'N3'] as const
export const PROPOSAL_WEEKLY_FREQUENCIES = [1, 2, 3] as const
export const PROPOSAL_SESSION_COUNTS = [4, 8, 12] as const

export type ProposalPatientLevel = (typeof PROPOSAL_PATIENT_LEVELS)[number]
export type ProposalWeeklyFrequency = (typeof PROPOSAL_WEEKLY_FREQUENCIES)[number]
export type ProposalSessionCount = (typeof PROPOSAL_SESSION_COUNTS)[number]

const priorConditionDetailSchema = z.object({
  present: z.boolean(),
  details: z.string().nullable(),
})

const priorConditionsSchema = z.object({
  hypertension: z.boolean(),
  diabetes: z.boolean(),
  high_cholesterol: z.boolean(),
  cardiac_alteration: priorConditionDetailSchema,
  neurological_alteration: priorConditionDetailSchema,
  pulmonary_alteration: priorConditionDetailSchema,
})

const surgerySchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome da cirurgia'),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
})

export function normalizeWeeklyFrequency(value: number | null | undefined): ProposalWeeklyFrequency {
  const rounded = Math.round(Number(value ?? 2))
  if (rounded <= 1) return 1
  if (rounded >= 3) return 3
  return 2
}

export function sessionCountForWeeklyFrequency(
  frequency: ProposalWeeklyFrequency,
): ProposalSessionCount {
  if (frequency === 1) return 4
  if (frequency === 3) return 12
  return 8
}

export function normalizeProposalPatientLevel(
  level: string | null | undefined,
): ProposalPatientLevel {
  if (level === 'N2' || level === 'N3') return level
  return 'N1'
}

export const assessmentProposalSchema = z
  .object({
    suggested_patient_level: z.enum(PROPOSAL_PATIENT_LEVELS),
    level_confirmed: z.boolean(),
    proposed_weekly_frequency: z
      .number()
      .refine((v) => PROPOSAL_WEEKLY_FREQUENCIES.includes(v as ProposalWeeklyFrequency), {
        message: 'Selecione 1x, 2x ou 3x por semana',
      }),
    proposed_session_count: z
      .number()
      .refine((v) => PROPOSAL_SESSION_COUNTS.includes(v as ProposalSessionCount), {
        message: 'Selecione ciclo de 4, 8 ou 12 sessões',
      }),
    patient_level_change_reason: z.string().trim().optional(),
    primary_diagnosis: z.string().trim().min(3, 'Informe o diagnóstico principal'),
    functionality: z.string().trim().min(3, 'Descreva a funcionalidade do paciente'),
    prior_conditions: priorConditionsSchema,
    surgeries: z.array(surgerySchema),
    crefito_number: z.string().trim().min(3, 'Informe o número CREFITO'),
    clinical_content: z.string().trim().min(10, 'Descreva a avaliação clínica (mínimo 10 caracteres)'),
  })
  .superRefine((data, ctx) => {
    if (!data.level_confirmed) {
      if (!data.patient_level_change_reason || data.patient_level_change_reason.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Justifique por que o nível sugerido não se aplica (mínimo 10 caracteres)',
          path: ['patient_level_change_reason'],
        })
      }
    }

    const expectedSessionCount = sessionCountForWeeklyFrequency(
      data.proposed_weekly_frequency as ProposalWeeklyFrequency,
    )
    if (data.proposed_session_count !== expectedSessionCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Ciclo inconsistente com a frequência semanal',
        path: ['proposed_session_count'],
      })
    }

    const detailFields = [
      ['cardiac_alteration', 'Alteração cardíaca'],
      ['neurological_alteration', 'Alteração neurológica'],
      ['pulmonary_alteration', 'Alteração pulmonar'],
    ] as const

    for (const [key, label] of detailFields) {
      const detail = data.prior_conditions[key]
      if (detail.present && (!detail.details || detail.details.trim().length < 3)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Descreva a ${label.toLowerCase()}`,
          path: ['prior_conditions', key, 'details'],
        })
      }
    }
  })

export type AssessmentProposalFormValues = z.infer<typeof assessmentProposalSchema>

export function buildAssessmentProposalDefaults(input: {
  patientLevel?: string | null
  suggestedWeeklyFrequency?: number | null
  diagnosticHypothesis?: string | null
  defaultCrefito?: string | null
} = {}): AssessmentProposalFormValues {
  const suggestedLevel = normalizeProposalPatientLevel(input.patientLevel)
  const weeklyFrequency = normalizeWeeklyFrequency(input.suggestedWeeklyFrequency)
  return {
    suggested_patient_level: suggestedLevel,
    level_confirmed: true,
    proposed_weekly_frequency: weeklyFrequency,
    proposed_session_count: sessionCountForWeeklyFrequency(weeklyFrequency),
    patient_level_change_reason: '',
    primary_diagnosis: input.diagnosticHypothesis?.trim() ?? '',
    functionality: '',
    prior_conditions: defaultPriorConditions(),
    surgeries: [],
    crefito_number: input.defaultCrefito?.trim() ?? '',
    clinical_content: '',
  }
}
