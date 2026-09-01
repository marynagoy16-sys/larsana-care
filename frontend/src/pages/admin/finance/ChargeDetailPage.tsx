import { Link, useNavigate, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminChargeReceiptSection } from '@/components/admin/finance/AdminChargeReceiptSection'
import {
  PaymentStatusBadge,
  PaymentStatusIcon,
} from '@/components/admin/finance/PaymentStatusVisual'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { paymentStatusLabels } from '@/constants/labels'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import {
  CHARGE_KIND_LABELS,
  formatChargeDueHint,
  getStaffChargeDetail,
  PAYMENT_METHOD_LABELS,
  PAYMENT_TIMING_LABELS,
  type ChargeDetail,
  type PaymentMethod,
} from '@/services/charges'

type DetailRow = {
  label: string
  value: ReactNode
}

function buildDetailRows(data: ChargeDetail): DetailRow[] {
  const rows: DetailRow[] = [
    {
      label: 'Paciente',
      value: (
        <Link to={`/admin/pacientes/${data.patient_id}`} className="font-medium text-primary hover:underline">
          {data.patients?.full_name ?? '—'}
        </Link>
      ),
    },
    { label: 'Tipo', value: CHARGE_KIND_LABELS[data.charge_kind] ?? data.charge_kind },
  ]

  if (data.cycle_id && data.care_cycles?.cycle_number != null) {
    rows.push({
      label: 'Ciclo',
      value: (
        <Link to={`/admin/ciclos/${data.cycle_id}`} className="font-medium text-primary hover:underline">
          Ciclo #{data.care_cycles.cycle_number}
        </Link>
      ),
    })
  }

  if (data.description) {
    rows.push({ label: 'Descrição', value: data.description })
  }

  rows.push(
    {
      label: 'Forma de pagamento',
      value: data.payment_method
        ? PAYMENT_METHOD_LABELS[data.payment_method as PaymentMethod] ?? data.payment_method
        : '—',
    },
    {
      label: 'Momento do pagamento',
      value: data.payment_timing
        ? PAYMENT_TIMING_LABELS[data.payment_timing] ?? data.payment_timing
        : '—',
    },
    { label: 'Vencimento', value: data.due_date ? formatDate(data.due_date) : '—' },
    { label: 'Emitida em', value: formatDateTime(data.created_at) },
  )

  if (data.paid_at) {
    rows.push({ label: 'Paga em', value: formatDateTime(data.paid_at) })
  }

  if (data.assessment_credit_cents > 0) {
    rows.push({
      label: 'Crédito de avaliação',
      value: formatCurrency(data.assessment_credit_cents),
    })
  }

  if (data.asaas_payment_id) {
    rows.push({ label: 'ID Asaas', value: <span className="font-mono text-xs">{data.asaas_payment_id}</span> })
  }

  return rows
}

function ChargeDetailPageHeader({
  onBack,
  patientName,
  status,
  isFetching,
  loading,
  notFound,
}: {
  onBack: () => void
  patientName?: string | null
  status?: ChargeDetail['payment_status']
  isFetching?: boolean
  loading?: boolean
  notFound?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0 rounded-xl"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </Button>
        {loading ? (
          <div className="min-w-0 space-y-1.5">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : notFound ? (
          <h1 className="font-display text-xl font-bold leading-tight tracking-tight lg:text-2xl">
            Cobrança não encontrada
          </h1>
        ) : (
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold leading-tight tracking-tight lg:text-2xl">
                Cobrança
              </h1>
              {status ? (
                <PaymentStatusBadge
                  status={status}
                  label={paymentStatusLabels[status] ?? status}
                />
              ) : null}
            </div>
            {patientName ? (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{patientName}</p>
            ) : null}
          </div>
        )}
      </div>
      {isFetching && !loading ? (
        <RefreshCw size={16} className="shrink-0 animate-spin text-muted-foreground" />
      ) : null}
    </div>
  )
}

export function ChargeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['admin', 'charge', id],
    queryFn: () => getStaffChargeDetail(id!),
    enabled: !!id,
    placeholderData: (previous) => previous,
  })

  const goBack = () => navigate('/admin/cobrancas')

  if (isLoading && !data) {
    return (
      <>
        <PageHeader loading>
          <ChargeDetailPageHeader onBack={goBack} loading />
        </PageHeader>
        <CrudScrollPageLayout>
          <DetailPageSkeleton fields={8} />
        </CrudScrollPageLayout>
      </>
    )
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader>
          <ChargeDetailPageHeader onBack={goBack} notFound />
        </PageHeader>
        <CrudScrollPageLayout>
          <p className="p-6 text-muted-foreground">Cobrança não encontrada.</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  const detailRows = buildDetailRows(data)
  const dueHint = formatChargeDueHint(data.due_date, data.payment_status)
  const isPending = data.payment_status === 'pendente' || data.payment_status === 'vencido'

  const copyPix = async () => {
    if (!data.pix_copy_paste) return
    try {
      await navigator.clipboard.writeText(data.pix_copy_paste)
      toast.success('Código PIX copiado')
    } catch {
      toast.error('Não foi possível copiar o código PIX')
    }
  }

  return (
    <>
      <PageHeader>
        <ChargeDetailPageHeader
          onBack={goBack}
          patientName={data.patients?.full_name}
          status={data.payment_status}
          isFetching={isFetching}
        />
      </PageHeader>

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
                <PaymentStatusIcon status={data.payment_status} className="size-12" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">
                    {CHARGE_KIND_LABELS[data.charge_kind] ?? 'Cobrança'}
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums">
                    {formatCurrency(data.amount_cents)}
                  </p>
                </div>
              </div>
              {dueHint ? (
                <p className="mt-3 text-sm text-muted-foreground">{dueHint}</p>
              ) : null}
            </div>
          </CascadeItem>

          {isPending && (data.boleto_url || data.pix_copy_paste) ? (
            <CascadeItem>
              <section className="space-y-3 rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold">Links de pagamento</h2>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {data.boleto_url ? (
                    <Button variant="outline" size="sm" asChild>
                      <a href={data.boleto_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={14} />
                        Abrir boleto
                      </a>
                    </Button>
                  ) : null}
                  {data.pix_copy_paste ? (
                    <Button variant="outline" size="sm" onClick={() => void copyPix()}>
                      <Copy size={14} />
                      Copiar PIX
                    </Button>
                  ) : null}
                </div>
              </section>
            </CascadeItem>
          ) : null}

          {data.payment_status === 'pago' ? (
            <CascadeItem>
              <AdminChargeReceiptSection chargeId={data.id} />
            </CascadeItem>
          ) : (
            <CascadeItem>
              <section className="rounded-xl border border-dashed border-border bg-muted/20 p-5">
                <p className="text-sm text-muted-foreground">
                  As notas fiscais do paciente ficam disponíveis após a confirmação do pagamento.
                </p>
              </section>
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
                  <span className="shrink-0 text-muted-foreground sm:w-44">{row.label}</span>
                  <span className="font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </CascadeItem>
        </CascadeReveal>
      </CrudScrollPageLayout>
    </>
  )
}
