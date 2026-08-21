import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import {
  getStaffTransferDetail,
  rejectTransferInvoice,
  releaseTransferToWallet,
  simulateTransferWallet,
  validateTransferInvoice,
} from '@/services/transfers'
import { TRANSFER_STATUS_LABELS } from '@/services/ppTransfers'

export function TransferDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'transfer', id],
    queryFn: () => getStaffTransferDetail(id!),
    enabled: !!id,
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

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Carregando repasse…</p>
  }

  if (isError || !data) {
    return <p className="p-6 text-sm text-muted-foreground">Repasse não encontrado.</p>
  }

  const invoiceRaw = data.professional_invoices
  const invoice = Array.isArray(invoiceRaw) ? invoiceRaw[0] : invoiceRaw
  const status = data.status
  const busy =
    validateMutation.isPending ||
    rejectMutation.isPending ||
    walletMutation.isPending ||
    simulateMutation.isPending

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/repasses" aria-label="Voltar">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-xl font-semibold">Repasse ao profissional</h1>
          <p className="text-sm text-muted-foreground">
            {data.professionals?.full_name ?? 'Profissional'} · {TRANSFER_STATUS_LABELS[status]}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Valor repasse PP</span>
          <span className="font-semibold">{formatCurrency(data.pp_transfer_amount_cents)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Cobrado do paciente</span>
          <span>{formatCurrency(data.patient_charged_amount_cents)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Ciclo</span>
          <span className="font-mono text-xs">{data.cycle_id}</span>
        </div>
        {data.transferred_at ? (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Transferido em</span>
            <span>{formatDateTime(data.transferred_at)}</span>
          </div>
        ) : null}
        {invoice ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 mt-2">
            <p className="font-medium">Nota fiscal</p>
            <p className="text-muted-foreground">{invoice.file_name ?? invoice.storage_path}</p>
            <p className="text-xs text-muted-foreground">Enviada em {formatDateTime(invoice.uploaded_at)}</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {status === 'aguardando_validacao' ? (
          <>
            <Button disabled={busy} onClick={() => validateMutation.mutate()}>
              Validar NF e liberar
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => rejectMutation.mutate()}>
              Rejeitar NF
            </Button>
          </>
        ) : null}

        {status === 'liberado' ? (
          <>
            <Button disabled={busy} onClick={() => walletMutation.mutate()}>
              Transferir via Wallet Asaas
            </Button>
            {import.meta.env.DEV ? (
              <Button variant="secondary" disabled={busy} onClick={() => simulateMutation.mutate()}>
                Simular transferência (dev)
              </Button>
            ) : null}
          </>
        ) : null}

        {status === 'transferido' ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-400">Repasse já transferido.</p>
        ) : null}

        {status === 'aguardando_nf' ? (
          <p className="text-sm text-muted-foreground">Aguardando o PP enviar a nota fiscal.</p>
        ) : null}
      </div>
    </div>
  )
}
