import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ChevronRight, FileText, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { formatDateTime } from '@/lib/formatters'
import { medicalRecordTypeLabels } from '@/constants/labels'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface PatientRecordRow {
  id: string
  record_type: string
  content_richtext: string | null
  recorded_at: string
  created_at: string
  crefito_number: string
  professionals: { full_name: string } | null
  care_sessions: { session_number: number } | null
  care_cycles: { cycle_number: number } | null
}

async function fetchPatientProntuario(patientId: string) {
  const [patientRes, recordsRes] = await Promise.all([
    supabase
      .from('patients')
      .select('id, full_name, clinical_summary, updated_at')
      .eq('id', patientId)
      .single(),
    supabase
      .from('medical_records')
      .select(`
        id, record_type, content_richtext, recorded_at, created_at, crefito_number,
        professionals ( full_name ),
        care_sessions ( session_number ),
        care_cycles ( cycle_number )
      `)
      .eq('patient_id', patientId)
      .order('recorded_at', { ascending: false }),
  ])

  if (patientRes.error) throw patientRes.error
  if (recordsRes.error) throw recordsRes.error

  return {
    patient: patientRes.data,
    records: (recordsRes.data ?? []) as unknown as PatientRecordRow[],
  }
}

function stripHtmlPreview(html: string | null, maxLength = 160): string {
  if (!html) return 'Sem conteúdo registrado.'
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}…`
}

export function PatientProntuarioPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const goBack = () => navigate(`/admin/pacientes/${id}`)

  const { data, isLoading } = useQuery({
    queryKey: ['patient_prontuario', id],
    queryFn: () => fetchPatientProntuario(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <>
        <PageHeader loading>
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
              <ArrowLeft size={20} />
            </Button>
            <span className="font-display font-bold text-xl lg:text-2xl">Prontuário</span>
          </div>
        </PageHeader>
        <CrudScrollPageLayout>
          <DetailPageSkeleton fields={6} />
        </CrudScrollPageLayout>
      </>
    )
  }

  if (!data?.patient) {
    return (
      <>
        <PageHeader>
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/pacientes')} className="shrink-0 rounded-xl" aria-label="Voltar">
              <ArrowLeft size={20} />
            </Button>
          </div>
        </PageHeader>
        <CrudScrollPageLayout>
          <p className="text-muted-foreground">Paciente não encontrado.</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  const { patient, records } = data
  const evolutions = records.filter((r) => r.record_type === 'evolucao')

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl lg:text-2xl truncate">
              Prontuário · {patient.full_name}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {records.length} registro{records.length === 1 ? '' : 's'}
              {evolutions.length > 0 && ` · ${evolutions.length} evolução${evolutions.length === 1 ? '' : 'ões'}`}
            </p>
          </div>
        </div>
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="space-y-5 pb-8">
          {patient.clinical_summary && (
            <CascadeItem>
              <div className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText size={14} className="text-muted-foreground" />
                    Resumo clínico
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDateTime(patient.updated_at)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {patient.clinical_summary}
                </p>
              </div>
            </CascadeItem>
          )}

          <CascadeItem>
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <PenLine size={16} className="text-muted-foreground" />
                  <h3 className="font-semibold text-sm">Linha do tempo · evoluções</h3>
                </div>
                <Badge variant="secondary">{records.length}</Badge>
              </div>

              {records.length === 0 ? (
                <p className="px-5 py-8 text-sm text-muted-foreground text-center">
                  Nenhum registro clínico encontrado para este paciente.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {records.map((record) => {
                    const typeLabel = medicalRecordTypeLabels[record.record_type] ?? record.record_type
                    const sessionLabel =
                      record.care_sessions?.session_number != null
                        ? `Sessão ${record.care_sessions.session_number}`
                        : null
                    const cycleLabel =
                      record.care_cycles?.cycle_number != null
                        ? `Ciclo ${record.care_cycles.cycle_number}`
                        : null

                    return (
                      <Link
                        key={record.id}
                        to={`/admin/prontuarios/${record.id}`}
                        className="flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors group"
                      >
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="font-normal">
                              {typeLabel}
                            </Badge>
                            {(sessionLabel || cycleLabel) && (
                              <span className="text-xs text-muted-foreground">
                                {[cycleLabel, sessionLabel].filter(Boolean).join(' · ')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {stripHtmlPreview(record.content_richtext)}
                          </p>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span>{record.professionals?.full_name ?? 'Profissional não informado'}</span>
                            <span>CREFITO {record.crefito_number}</span>
                            <span>{formatDateTime(record.recorded_at ?? record.created_at)}</span>
                          </div>
                        </div>
                        <ChevronRight
                          size={18}
                          className={cn(
                            'shrink-0 text-muted-foreground/40 mt-1',
                            'group-hover:text-muted-foreground transition-colors',
                          )}
                        />
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </CascadeItem>
        </CascadeReveal>
      </CrudScrollPageLayout>
    </>
  )
}
