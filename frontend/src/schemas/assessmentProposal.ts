import { z } from 'zod'

export const PROPOSAL_PATIENT_LEVELS = ['N1', 'N2', 'N3'] as const
export const PROPOSAL_WEEKLY_FREQUENCIES = [1, 2, 3] as const
export const PROPOSAL_SESSION_COUNTS = [4, 8, 12] as const

export type ProposalPatientLevel = (typeof PROPOSAL_PATIENT_LEVELS)[number]
export type ProposalWeeklyFrequency = (typeof PROPOSAL_WEEKLY_FREQUENCIES)[number]
export type ProposalSessionCount = (typeof PROPOSAL_SESSION_COUNTS)[number]

export function normalizeWeeklyFrequency(value: number | null | undefined): ProposalWeeklyFrequency {
  const rounded = Math.round(Number(value ?? 2))
  if (rounded <= 1) return 1
  if (rounded >= 3) return 3
  return 2
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
    proposed_patient_level: z.enum(PROPOSAL_PATIENT_LEVELS),
    patient_level_change_reason: z.string().trim().optional(),
    primary_diagnosis: z.string().trim().min(3, 'Informe o diagnóstico principal'),
    comorbidities: z.string().trim().optional(),
    mobility: z.string().trim().min(3, 'Descreva a mobilidade do paciente'),
    crefito_number: z.string().trim().min(3, 'Informe o número CREFITO'),
    clinical_content: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.proposed_patient_level !== data.suggested_patient_level
      && (!data.patient_level_change_reason || data.patient_level_change_reason.length < 10)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Justifique a alteração de nível (mínimo 10 caracteres)',
        path: ['patient_level_change_reason'],
      })
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
  return {
    suggested_patient_level: suggestedLevel,
    proposed_weekly_frequency: normalizeWeeklyFrequency(input.suggestedWeeklyFrequency),
    proposed_session_count: 8,
    proposed_patient_level: suggestedLevel,
    patient_level_change_reason: '',
    primary_diagnosis: input.diagnosticHypothesis?.trim() ?? '',
    comorbidities: '',
    mobility: '',
    crefito_number: input.defaultCrefito?.trim() ?? '',
    clinical_content: '',
  }
}
