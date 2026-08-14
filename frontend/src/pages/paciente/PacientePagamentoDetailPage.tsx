import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { PacienteSubpageShell } from '@/components/paciente/PacienteSubpageShell'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { paymentStatusLabels } from '@/constants/labels'
import { simulateChargePayment } from '@/services/patientPayments'
import { patientPortalQueryKeys } from '@/services/patientPortal'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type ChargeRow = {
  id: string
  amount_cents: number
  payment_status: string
  due_date: string | null
  description: string | null
  payment_method: string | null
  cycle_id: string | null
}

export function PacientePagamentoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['paciente', 'charges', id],
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from('charges_patient')
        .select('id, amount_cents, payment_status, due_date, description, payment_method, cycle_id')
        .eq('id', id!)
        .single()
      if (error) throw error
      return row as ChargeRow
    },
    enabled: !!id,
  })

  const simulateMutation = useMutation({
    mutationFn: () => simulateChargePayment(id!),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['paciente', 'charges', id] })
      queryClient.invalidateQueries({ queryKey: ['paciente', 'charges-list'] })
      queryClient.invalidateQueries({ queryKey: patientPortalQueryKeys.home })
      queryClient.invalidateQueries({ queryKey: ['paciente', 'cycles'] })

      if (result.already_paid) {
        toast.info('Este pagamento já estava confirmado.')
        return
      }

      toast.success(
        result.sessions_count > 0
          ? `Pagamento confirmado! ${result.sessions_count} sessões liberadas.`
          : 'Pagamento confirmado!',
      )
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Não foi possível simular o pagamento.')
    },
  })

  if (isLoading) {
    return (
      <PacienteSubpageShell title="Pagamento" loading backTo="/paciente/pagamentos">
        <div className="animate-pulse h-48 rounded-xl bg-muted" />
      </PacienteSubpageShell>
    )
  }

  if (isError || !data) {
    return (
      <PacienteSubpageShell title="Pagamento" backTo="/paciente/pagamentos">
        <p className="text-muted-foreground">Cobrança não encontrada.</p>
      </PacienteSubpageShell>
    )
  }

  const isPaid = data.payment_status === 'pago'
  const statusLabel = paymentStatusLabels[data.payment_status] ?? data.payment_status

  return (
    <PacienteSubpageShell title="Pagamento" backTo="/paciente/pagamentos">
      <div className="space-y-4 pb-8">
        <p className="text-sm text-muted-foreground">{data.description ?? 'Detalhe da cobrança'}</p>

        {isPaid && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 dark:border-emerald-900/50 dark:bg-emerald-950/30 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-950 dark:text-emerald-100">Pagamento confirmado</p>
                <p className="text-sm text-emerald-900/85 dark:text-emerald-200/90 mt-1">
                  Seu tratamento foi liberado. As sessões domiciliares já estão agendadas.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="p-5 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Valor</p>
              <p className="font-display text-2xl font-bold">{formatCurrency(data.amount_cents)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className={`font-medium ${isPaid ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                  {statusLabel}
                </p>
              </div>
              {data.due_date && (
                <div>
                  <p className="text-xs text-muted-foreground">Vencimento</p>
                  <p className="font-medium">{formatDate(data.due_date)}</p>
                </div>
              )}
              {data.payment_method && (
                <div>
                  <p className="text-xs text-muted-foreground">Forma</p>
                  <p className="font-medium">{data.payment_method}</p>
                </div>
              )}
            </div>

            {!isPaid && (
              <>
                <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-5 text-center text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Pagamento via PIX ou boleto</p>
                  <p>O QR Code e o boleto serão exibidos aqui assim que a integração Asaas estiver ativa.</p>
                </div>

                <Button
                  className="w-full h-12 lg:h-10"
                  onClick={() => simulateMutation.mutate()}
                  disabled={simulateMutation.isPending}
                >
                  {simulateMutation.isPending ? 'Confirmando…' : 'Simular pagamento confirmado'}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Ambiente de demonstração — confirma o PIX e libera as sessões do ciclo.
                </p>
              </>
            )}

            {isPaid && data.cycle_id && (
              <Button asChild className="w-full h-12 lg:h-10">
                <Link to={`/paciente/tratamento/ciclo/${data.cycle_id}`}>Ver meu tratamento</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </PacienteSubpageShell>
  )
}
