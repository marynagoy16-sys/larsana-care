import { Link, useNavigate, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, FileText, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import {
  RepasseStatusBadge,
  RepasseStatusIcon,
} from '@/components/profissional/repasses/RepasseStatusVisual'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import {
  formatPpClassLabel,
  getPPTransferInvoiceSignedUrl,
  TRANSFER_STATUS_HINTS,
  TRANSFER_STATUS_LABELS,
} from '@/services/ppTransfers'
import {
  formatRepasseWaitingLabel,
  getStaffTransferDetail,
  rejectTransferInvoice,
  releaseTransferToWallet,
  simulateTransferWallet,
  validateTransferInvoice,
  type TransferDetail,
} from '@/services/transfers'

type DetailRow = {
  label: string
  value: ReactNode
}

function buildDetailRows(data: TransferDetail): DetailRow[] {
  const sessionCount = data.cycle?.session_count ?? 0
  const perSessionCents =
    sessionCount > 0 ? Math.round(data.pp_transfer_amount_cents / sessionCount) : null

  const rows: DetailRow[] = [
    { label: 'Profissional', value: data.professionals?.full_name ?? '—' },
    { label: 'Paciente', value: data.cycle?.patient_name ?? '—' },
    {
      label: 'Ciclo',
      value: data.cycle ? (
        <Link
          to={`/admin/ciclos/${data.cycle_id}`}
          className="font-medium text-primary hover:underline"
        >
          Ciclo #{data.cycle.cycle_number} · {data.cycle.session_count} terapias
        </Link>
      ) : (
        '—'
      ),
    },
  ]

  if (perSessionCents != null) {
    rows.push({ label: 'Valor por terapia', value: formatCurrency(perSessionCents) })
  }

  rows.push(
    { label: 'Cobrado do paciente', value: formatCurrency(data.patient_charged_amount_cents) },
    { label: 'Margem Larsana', value: formatCurrency(data.larsana_margin_cents) },
    { label: 'Comissão aplicada', value: `${data.commission_percent}%` },
    { label: 'Classe PP no ciclo', value: formatPpClassLabel(data.pp_class) },
    {
      label: 'Primeiro mês',
      value: data.first_month_retention_applied ? 'Sim (retenção especial)' : 'Não',
    },
    { label: 'Gerado em', value: formatDateTime(data.created_at) },
  )

  const waiting = formatRepasseWaitingLabel(data.created_at, data.status)
  if (waiting) {
    rows.push({ label: 'Tempo aguardando', value: waiting })
  }

  if (data.validated_at) {
    rows.push({ label: 'NF validada em', value: formatDateTime(data.validated_at) })
  }

  if (data.transferred_at) {
    rows.push({ label: 'Transferido em', value: formatDateTime(data.transferred_at) })
  }

  if (data.cycle?.started_at || data.cycle?.closed_at) {
    const start = data.cycle.started_at ? formatDate(data.cycle.started_at) : '—'
    const end = data.cycle.closed_at ? formatDate(data.cycle.closed_at) : '—'
    rows.push({ label: 'Período do ciclo', value: `${start} – ${end}` })
  }

  return rows
}

function TransferDetailPageHeader({
  onBack,
  professionalName,
  status,
  isFetching,
  loading,
  notFound,
}: {
  onBack: () => void
  professionalName?: string | null
  status?: TransferDetail['status']
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
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-52" />
          </div>
        ) : notFound ? (
          <h1 className="font-display text-xl font-bold leading-tight tracking-tight lg:text-2xl">
            Repasse não encontrado
          </h1>
        ) : (
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold leading-tight tracking-tight lg:text-2xl">
                Repasse ao profissional
              </h1>
              {status ? (
                <RepasseStatusBadge status={status} label={TRANSFER_STATUS_LABELS[status]} />
              ) : null}
            </div>
            {professionalName ? (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{professionalName}</p>
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

export function TransferDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['admin', 'transfer', id],
    queryFn: () => getStaffTransferDetail(id!),
    enabled: !!id,
    placeholderData: (previous) => previous,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'transfer', id] })
    void queryClient.invalidateQueries({ queryKey: ['transfers'] })
  }

  const validateMutation = useMutation({
    mutationFn: () => validateTransferInvoice(id!),
    onSuccess: () => {
      invalidate()
      toast.success('Nota fiscal validada. Repasse liberado para transferência.')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const rejectMutation = useMutation({
    mutationFn: () => rejectTransferInvoice(id!, 'NF rejeitada pelo financeiro'),
    onSuccess: () => {
      invalidate()
      toast.info('NF rejeitada. PP precisa enviar novamente.')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const walletMutation = useMutation({
    mutationFn: () => releaseTransferToWallet(id!),
    onSuccess: () => {
      invalidate()
      toast.success('Repasse enviado para wallet Asaas.')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const simulateMutation = useMutation({
    mutationFn: () => simulateTransferWallet(id!),
    onSuccess: () => {
      invalidate()
      toast.success('Repasse marcado como transferido (simulação).')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const goBack = () => navigate('/admin/repasses')

  if (isLoading && !data) {
    return (
      <>
        <PageHeader loading>
          <TransferDetailPageHeader onBack={goBack} loading />
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
          <TransferDetailPageHeader onBack={goBack} notFound />
        </PageHeader>
        <CrudScrollPageLayout>
          <p className="p-6 text-muted-foreground">Repasse não encontrado.</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  const status = data.status
  const statusHint = TRANSFER_STATUS_HINTS[status]
  const detailRows = buildDetailRows(data)
  const busy =
    validateMutation.isPending ||
    rejectMutation.isPending ||
    walletMutation.isPending ||
    simulateMutation.isPending

  const openInvoice = async (storagePath: string) => {
    try {
      const url = await getPPTransferInvoiceSignedUrl(storagePath)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível abrir a nota fiscal')
    }
  }

  return (
    <>
      <PageHeader>
        <TransferDetailPageHeader
          onBack={goBack}
          professionalName={data.professionals?.full_name}
          status={status}
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
                <RepasseStatusIcon status={status} className="size-12" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted-foreground">Valor do repasse PP</p>
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

          {data.invoice ? (
            <CascadeItem>
              <section className="space-y-4 rounded-xl border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <FileText className="size-5 text-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h2 className="text-sm font-semibold">Nota fiscal do PP</h2>
                    <p className="text-sm text-muted-foreground">
                      {data.invoice.file_name ?? 'Arquivo anexado'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Enviada em {formatDateTime(data.invoice.uploaded_at)}
                    </p>
                  </div>
                  {data.invoice.storage_path ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => void openInvoice(data.invoice!.storage_path)}
                    >
                      <ExternalLink size={14} />
                      Ver arquivo
                    </Button>
                  ) : null}
                </div>

                {status === 'aguardando_validacao' ? (
                  <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:flex-wrap">
                    <Button disabled={busy} onClick={() => validateMutation.mutate()}>
                      Validar NF e liberar
                    </Button>
                    <Button variant="outline" disabled={busy} onClick={() => rejectMutation.mutate()}>
                      Rejeitar NF
                    </Button>
                  </div>
                ) : null}
              </section>
            </CascadeItem>
          ) : null}

          {status === 'aguardando_nf' ? (
            <CascadeItem>
              <section className="rounded-xl border border-dashed border-border bg-muted/20 p-5">
                <p className="text-sm text-muted-foreground">
                  Aguardando o profissional enviar a nota fiscal para liberar o repasse.
                </p>
              </section>
            </CascadeItem>
          ) : null}

          {(status === 'liberado' || status === 'transferido' || status === 'falhou') && (
            <CascadeItem>
              <section className="space-y-3 rounded-xl border border-border bg-card p-5">
                <h2 className="text-sm font-semibold">Ações financeiras</h2>
                {status === 'liberado' ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button disabled={busy} onClick={() => walletMutation.mutate()}>
                      Transferir via Wallet Asaas
                    </Button>
                    {import.meta.env.DEV ? (
                      <Button variant="secondary" disabled={busy} onClick={() => simulateMutation.mutate()}>
                        Simular transferência (dev)
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {status === 'transferido' ? (
                  <p className="text-sm text-emerald-700 dark:text-emerald-400">
                    Repasse já transferido para a conta do profissional.
                  </p>
                ) : null}
                {status === 'falhou' ? (
                  <p className="text-sm text-destructive">
                    Houve falha na transferência. Verifique os dados bancários do PP e tente novamente.
                  </p>
                ) : null}
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
