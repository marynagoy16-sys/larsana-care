import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ClipboardList, Clock, Search } from 'lucide-react'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { assessmentStatusLabels } from '@/constants/labels'
import {
  buildAssessmentWorkflowStats,
  formatAssessmentProposalSummary,
  formatFamilyDeadline,
  formatFamilyResponse,
} from '@/lib/assessmentListDisplay'
import { formatDate } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'

type AssessmentRow = {
  id: string
  status: string
  created_at: string
  patient_id: string
  proposed_session_count: number
  proposed_patient_level: string
  proposed_weekly_frequency: number
  proposal_sent_at: string | null
  response_deadline_at: string | null
  family_response: string | null
  patients?: { full_name: string } | null
}

async function listPPAssessments(): Promise<{ data: AssessmentRow[]; count: number }> {
  const { data, error } = await supabase
    .from('initial_assessments')
    .select(
      `id, status, created_at, patient_id,
      proposed_session_count, proposed_patient_level, proposed_weekly_frequency,
      proposal_sent_at, response_deadline_at, family_response,
      patients ( full_name )`,
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  const rows = (data ?? []) as AssessmentRow[]
  return { data: rows, count: rows.length }
}

export function PPAvaliacoesPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<AssessmentRow[]>([])

  const stats = useMemo(() => {
    const { total, awaitingSend, inReview, answered } = buildAssessmentWorkflowStats(rows)
    return [
      {
        label: 'Total',
        value: total,
        icon: ClipboardList,
        footer: 'Avaliações registradas',
      },
      {
        label: 'Aguardando envio',
        value: awaitingSend,
        icon: Clock,
        footer: 'Proposta ainda não enviada',
      },
      {
        label: 'Em análise',
        value: inReview,
        icon: Search,
        footer: 'Família analisando a proposta',
      },
      {
        label: 'Respondidas',
        value: answered,
        icon: CheckCircle2,
        footer: 'SIM ou NÃO da família',
      },
    ]
  }, [rows])

  return (
    <EntityListPage
      title="Avaliações"
      description="Acompanhe o status da proposta enviada à família"
      queryKey={['pp', 'assessments']}
      queryFn={async () => {
        const result = await listPPAssessments()
        setRows(result.data)
        return result
      }}
      stats={stats}
      statsColumns={4}
      onRowClick={(r) => navigate(`/profissional/avaliacoes/${r.id}`)}
      columns={[
        {
          key: 'patient',
          header: 'Paciente',
          mobilePrimary: true,
          cell: (r) => (
            <span className="font-medium">{r.patients?.full_name ?? 'Paciente'}</span>
          ),
        },
        {
          key: 'proposal',
          header: 'Proposta',
          mobileSubtitle: true,
          cell: (r) => (
            <span className="text-muted-foreground">{formatAssessmentProposalSummary(r)}</span>
          ),
        },
        {
          key: 'status',
          header: 'Status',
          mobileBadge: true,
          cell: (r) => assessmentStatusLabels[r.status] ?? r.status,
        },
        {
          key: 'created_at',
          header: 'Avaliado em',
          mobileMeta: true,
          cell: (r) => formatDate(r.created_at),
        },
        {
          key: 'deadline',
          header: 'Prazo família',
          mobileMeta: true,
          cell: (r) => formatFamilyDeadline(r),
        },
        {
          key: 'response',
          header: 'Resposta',
          mobileMeta: true,
          cell: (r) => formatFamilyResponse(r.family_response),
        },
      ]}
    />
  )
}
