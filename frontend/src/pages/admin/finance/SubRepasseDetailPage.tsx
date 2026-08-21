import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import {
  getStaffSubRepasseDetail,
  releaseSubRepasseToWallet,
  simulateSubRepasseWallet,
} from '@/services/transfers'
import { TRANSFER_STATUS_LABELS } from '@/services/ppTransfers'

export function SubRepasseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'sub-repasse', id],
    queryFn: () => getStaffSubRepasseDetail(id!),
    enabled: !!id,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'sub-repasse', id] })
    void queryClient.invalidateQueries({ queryKey: ['sub-repasses'] })
  }

  const walletMutation = useMutation({
    mutationFn: () => releaseSubRepasseToWallet(id!),
    onSuccess: () => {
      invalidate()
      toast.success('Repasse SUB enviado para wallet Asaas.')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const simulateMutation = useMutation({
    mutationFn: () => simulateSubRepasseWallet(id!),
    onSuccess: () => {
      invalidate()
      toast.success('Repasse SUB marcado como transferido (simulação).')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Carregando repasse SUB…</p>
  }

  if (isError || !data) {
    return <p className="p-6 text-sm text-muted-foreground">Repasse SUB não encontrado.</p>
  }

  const status = data.status
  const busy = walletMutation.isPending || simulateMutation.isPending

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/repasses" aria-label="Voltar">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-semibold">Repasse SUB (avulso)</h1>
            <Badge variant="secondary">SUB</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {data.substitute?.full_name ?? 'Substituto'} · {TRANSFER_STATUS_LABELS[status]}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Valor repasse</span>
          <span className="font-semibold">{formatCurrency(data.amount_cents)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Sessão</span>
          <span>
            Terapia {data.session_number}
            {data.care_cycles ? ` · Ciclo ${data.care_cycles.cycle_number}` : ''}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Paciente</span>
          <span>{data.patients?.full_name ?? '—'}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">PP titular</span>
          <span>{data.assigned?.full_name ?? '—'}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Substituto</span>
          <span>{data.substitute?.full_name ?? '—'}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Comissão SUB</span>
          <span>{data.pp_percentage}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Valor unitário sessão</span>
          <span>{formatCurrency(data.session_unit_price_cents)}</span>
        </div>
        {data.transferred_at ? (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Transferido em</span>
            <span>{formatDateTime(data.transferred_at)}</span>
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          Repasse avulso por atendimento como substituto — sem NF.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
          <p className="text-sm text-emerald-700 dark:text-emerald-400">Repasse SUB já transferido.</p>
        ) : null}
      </div>
    </div>
  )
}
