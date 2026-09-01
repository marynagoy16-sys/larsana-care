import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SubpageHeaderBar } from '@/components/paciente/PacienteSubpageShell'
import { RepasseStatusBadge, RepasseStatusIcon } from '@/components/profissional/repasses/RepasseStatusVisual'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import {
  getPPSubRepasseDetail,
  TRANSFER_STATUS_HINTS,
  TRANSFER_STATUS_LABELS,
} from '@/services/ppTransfers'

export function PPSubRepasseDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['pp', 'sub-repasses', id, 'detail'],
    queryFn: () => getPPSubRepasseDetail(id!),
    enabled: !!id,
    placeholderData: (previous) => previous,
  })

  const header = (
    <PageHeader loading={isLoading && !data}>
      <SubpageHeaderBar title="Repasse SUB" backTo="/profissional/repasses" />
    </PageHeader>
  )

  if (isLoading && !data) {
    return (
      <>
        {header}
        <CrudScrollPageLayout>
          <DetailPageSkeleton fields={6} />
        </CrudScrollPageLayout>
      </>
    )
  }

  if (!data) {
    return (
      <>
        {header}
        <CrudScrollPageLayout>
          <p className="text-muted-foreground">Registro não encontrado.</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  const statusHint = TRANSFER_STATUS_HINTS[data.status]
  const patientName =
    data.patients?.full_name ?? data.care_cycles?.patients?.full_name ?? 'Paciente'

  return (
    <>
      {header}
      <CrudScrollPageLayout>
        <CascadeReveal className="space-y-4 pb-8">
          <CascadeItem>
            <div
              className={`rounded-xl border border-border bg-card p-5 transition-opacity duration-300 ${isFetching && !isLoading ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start gap-3">
                <RepasseStatusIcon status={data.status} className="size-12" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-muted-foreground">Repasse avulso SUB</p>
                    <Badge variant="secondary">SUB</Badge>
                    <RepasseStatusBadge status={data.status} label={TRANSFER_STATUS_LABELS[data.status]} />
                  </div>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                    {formatCurrency(data.amount_cents)}
                  </p>
                </div>
              </div>
              {statusHint ? (
                <p className="mt-3 text-sm text-muted-foreground">{statusHint}</p>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  Repasse liberado após atendimento como substituto — sem NF.
                </p>
              )}
            </div>
          </CascadeItem>

          <CascadeItem>
            <div className="space-y-3 rounded-xl border border-border bg-card p-5 text-sm">
              <DetailRow label="Paciente" value={patientName} />
              <DetailRow
                label="Terapia"
                value={`Terapia ${data.session_number}${data.care_cycles ? ` · Ciclo ${data.care_cycles.cycle_number}` : ''}`}
              />
              <DetailRow label="Comissão" value={`${data.pp_percentage}%`} />
              <DetailRow label="Valor unitário" value={formatCurrency(data.session_unit_price_cents)} />
              <DetailRow label="Gerado em" value={formatDateTime(data.created_at)} />
              {data.transferred_at ? (
                <DetailRow label="Transferido em" value={formatDateTime(data.transferred_at)} />
              ) : null}
            </div>
          </CascadeItem>
        </CascadeReveal>
      </CrudScrollPageLayout>
    </>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col border-b border-border/50 py-1 last:border-0 sm:flex-row sm:gap-4">
      <span className="shrink-0 text-muted-foreground sm:w-40">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
