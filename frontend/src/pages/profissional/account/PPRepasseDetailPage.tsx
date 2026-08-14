import { useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { SubpageHeaderBar } from '@/components/paciente/PacienteSubpageShell'
import { RepasseInvoiceSection } from '@/components/profissional/repasses/RepasseInvoiceSection'
import { RepasseStatusBadge, RepasseStatusIcon } from '@/components/profissional/repasses/RepasseStatusVisual'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import {
  formatPpClassLabel,
  getPPRepasseDetail,
  TRANSFER_STATUS_HINTS,
  TRANSFER_STATUS_LABELS,
} from '@/services/ppTransfers'

type DetailRow = {
  label: string
  value: string
  capitalize?: boolean
}

function buildDetailRows(detail: NonNullable<Awaited<ReturnType<typeof getPPRepasseDetail>>>): DetailRow[] {
  const { cycle } = detail
  const sessionCount = cycle?.session_count ?? 0
  const perSessionCents =
    sessionCount > 0 ? Math.round(detail.pp_transfer_amount_cents / sessionCount) : null

  const rows: DetailRow[] = [
    { label: 'Paciente', value: cycle?.patient_name ?? '—' },
    {
      label: 'Ciclo',
      value: cycle ? `Ciclo ${cycle.cycle_number} · ${cycle.session_count} terapias` : '—',
    },
  ]

  if (perSessionCents != null) {
    rows.push({ label: 'Valor por terapia', value: formatCurrency(perSessionCents) })
  }

  rows.push(
    { label: 'Comissão aplicada', value: `${detail.commission_percent}%` },
    { label: 'Classe PP no ciclo', value: formatPpClassLabel(detail.pp_class) },
    {
      label: 'Primeiro mês',
      value: detail.first_month_retention_applied ? 'Sim (retenção especial)' : 'Não',
    },
    { label: 'Gerado em', value: formatDateTime(detail.created_at) },
  )

  if (detail.transferred_at) {
    rows.push({ label: 'Transferido em', value: formatDateTime(detail.transferred_at) })
  }

  if (cycle?.started_at || cycle?.closed_at) {
    const start = cycle.started_at ? formatDate(cycle.started_at) : '—'
    const end = cycle.closed_at ? formatDate(cycle.closed_at) : '—'
    rows.push({ label: 'Período do ciclo', value: `${start} – ${end}` })
  }

  return rows
}

export function PPRepasseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['pp', 'transfers', id, 'detail'],
    queryFn: () => getPPRepasseDetail(id!),
    enabled: !!id,
    placeholderData: (previous) => previous,
  })

  const handleInvoiceUploaded = () => {
    void queryClient.invalidateQueries({ queryKey: ['pp', 'transfers'] })
  }

  const header = (
    <PageHeader loading={isLoading && !data}>
      <SubpageHeaderBar title="Repasse" backTo="/profissional/repasses" />
    </PageHeader>
  )

  if (isLoading && !data) {
    return (
      <>
        {header}
        <CrudScrollPageLayout>
          <DetailPageSkeleton fields={8} />
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
  const detailRows = buildDetailRows(data)

  return (
    <>
      {header}
      <CrudScrollPageLayout>
        <CascadeReveal className="space-y-4 pb-8">
          <CascadeItem>
            <div
              className={cn(
                'rounded-xl border border-border bg-card p-5 transition-opacity duration-300',
                isFetching && !isLoading && 'opacity-50',
              )}
            >
              <div className="flex items-start gap-3">
                <RepasseStatusIcon status={data.status} className="size-12" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm text-muted-foreground">Valor do repasse</p>
                    <RepasseStatusBadge status={data.status} label={TRANSFER_STATUS_LABELS[data.status]} />
                  </div>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                    {formatCurrency(data.pp_transfer_amount_cents)}
                  </p>
                </div>
              </div>
              {statusHint ? (
                <p className="mt-3 text-sm text-muted-foreground">{statusHint}</p>
              ) : null}
            </div>
          </CascadeItem>

          {(data.status === 'aguardando_nf' || data.invoice) && (
            <CascadeItem>
              <RepasseInvoiceSection
                transferId={data.id}
                status={data.status}
                amountCents={data.pp_transfer_amount_cents}
                invoice={data.invoice}
                onUploaded={handleInvoiceUploaded}
              />
            </CascadeItem>
          )}

          <CascadeItem>
            <div
              className={cn(
                'space-y-3 rounded-xl border border-border bg-card p-5 text-sm transition-opacity duration-300',
                isFetching && !isLoading && 'opacity-50',
              )}
            >
              {detailRows.map((row) => (
                <div
                  key={row.label}
                  className="flex flex-col border-b border-border/50 py-1 last:border-0 sm:flex-row sm:gap-4"
                >
                  <span className="shrink-0 text-muted-foreground sm:w-40">{row.label}</span>
                  <span className={cn('font-medium', row.capitalize && 'capitalize')}>{row.value}</span>
                </div>
              ))}
            </div>
          </CascadeItem>
        </CascadeReveal>
      </CrudScrollPageLayout>
    </>
  )
}
