import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { AssessmentDetailView } from '@/components/assessments/AssessmentDetailView'
import { findSessionPriceCents, resolveCyclePercents } from '@/lib/demandSimulation'
import { supabase } from '@/lib/supabase'
import { getCurrentProfessional } from '@/services/professionals'
import { getActivePricingVersion, getPricingBundle } from '@/services/pricing'
import { getProfessionalPointsProfile, type PpPatente } from '@/services/ppPoints'

type AssessmentDetail = {
  id: string
  patient_id: string
  status: string
  clinical_content: string | null
  crefito_number: string
  created_at: string
  proposal_sent_at: string | null
  response_deadline_at: string | null
  family_response: string | null
  responded_at: string | null
  suggested_weekly_frequency: number | null
  proposed_weekly_frequency: number
  proposed_session_count: number
  suggested_patient_level: string
  proposed_patient_level: string
  level_confirmed: boolean | null
  level_change_review_status: string | null
  patient_level_change_reason: string | null
  primary_diagnosis: string
  comorbidities: string | null
  mobility: string | null
  functionality: string | null
  prior_conditions: unknown
  surgeries: unknown
  patients?: {
    full_name: string
    region_id?: string | null
    regions?: { code: string; name: string } | null
    cities?: { name: string } | null
    patient_responsibles?: Array<{ full_name: string; is_primary: boolean }> | null
  } | null
  evaluator?: {
    full_name: string
    pp_class: string | null
  } | null
}

async function getPPAssessmentDetail(id: string): Promise<AssessmentDetail | null> {
  const { data, error } = await supabase
    .from('initial_assessments')
    .select(`
      id, patient_id, status, clinical_content, crefito_number, created_at,
      proposal_sent_at, response_deadline_at, family_response, responded_at,
      suggested_weekly_frequency, proposed_weekly_frequency, proposed_session_count,
      suggested_patient_level, proposed_patient_level, level_confirmed, level_change_review_status,
      patient_level_change_reason, primary_diagnosis, comorbidities, mobility, functionality,
      prior_conditions, surgeries,
      patients (
        full_name,
        region_id,
        regions ( code, name ),
        cities ( name ),
        patient_responsibles ( full_name, is_primary )
      ),
      evaluator:professionals!initial_assessments_evaluator_professional_id_fkey (
        full_name,
        pp_class
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as AssessmentDetail | null
}

export function PPAvaliacaoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const fromPatient = (location.state as { from?: string; patientId?: string } | null)?.from === 'patient'
  const patientIdFromState = (location.state as { patientId?: string } | null)?.patientId

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['pp', 'assessments', id],
    queryFn: () => getPPAssessmentDetail(id!),
    enabled: !!id,
  })

  const goBack = () => {
    const patientId = assessment?.patient_id ?? patientIdFromState
    if (fromPatient && patientId) {
      navigate(`/profissional/pacientes/${patientId}`)
      return
    }
    navigate('/profissional/avaliacoes')
  }

  const { data: professional } = useQuery({
    queryKey: ['pp', 'current_professional'],
    queryFn: getCurrentProfessional,
  })

  const { data: pointsProfile } = useQuery({
    queryKey: ['pp', 'points_profile', professional?.id],
    queryFn: () => getProfessionalPointsProfile(professional!.id),
    enabled: !!professional?.id,
  })

  const { data: repasseEstimate } = useQuery({
    queryKey: [
      'pp',
      'assessments',
      id,
      'repasse',
      assessment?.patients?.region_id,
      assessment?.proposed_patient_level,
      assessment?.proposed_session_count,
      pointsProfile?.patente,
    ],
    queryFn: async () => {
      const version = await getActivePricingVersion()
      if (!version) return null
      const bundle = await getPricingBundle(version.id)
      const regionId = assessment!.patients?.region_id ?? null
      const sessionPriceCents = findSessionPriceCents(
        bundle.entries,
        regionId,
        assessment!.proposed_patient_level,
      )
      if (sessionPriceCents == null) return null
      const { cycle2Percent } = resolveCyclePercents({
        commissions: bundle.commissions,
        retention: bundle.retention,
        patente: (pointsProfile?.patente ?? 'ALUMINIO') as PpPatente,
      })
      const repassePerSessionCents = Math.round(sessionPriceCents * cycle2Percent / 100)
      return {
        repassePerSessionCents,
        repasseTotalCents: repassePerSessionCents * assessment!.proposed_session_count,
      }
    },
    enabled:
      !!assessment?.proposed_patient_level
      && !!assessment?.proposed_session_count
      && !!assessment?.patients?.region_id,
  })

  if (isLoading) {
    return (
      <>
        <PageHeader loading>
          <span className="font-display font-bold text-xl">Avaliação</span>
        </PageHeader>
        <CrudScrollPageLayout>
          <DetailPageSkeleton fields={4} />
        </CrudScrollPageLayout>
      </>
    )
  }

  if (!assessment) {
    return (
      <>
        <PageHeader>
          <Button variant="ghost" size="icon" onClick={goBack} aria-label="Voltar">
            <ArrowLeft size={20} />
          </Button>
        </PageHeader>
        <CrudScrollPageLayout>
          <p className="text-muted-foreground p-6">Avaliação não encontrada.</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="font-display font-bold text-xl lg:text-2xl truncate min-w-0">
            {assessment.patients?.full_name ?? 'Paciente'}
          </h1>
        </div>
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="pb-8">
          <CascadeItem>
            <AssessmentDetailView
              data={{
                ...assessment,
                patient: assessment.patients,
              }}
              repassePerSessionCents={repasseEstimate?.repassePerSessionCents}
              repasseTotalCents={repasseEstimate?.repasseTotalCents}
            />
          </CascadeItem>
        </CascadeReveal>
      </CrudScrollPageLayout>
    </>
  )
}
