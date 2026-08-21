import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Copy } from 'lucide-react'
import { PacienteSubpageShell } from '@/components/paciente/PacienteSubpageShell'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { paymentStatusLabels } from '@/constants/labels'
import { simulateChargePayment } from '@/services/patientPayments'
import { patientPortalQueryKeys } from '@/services/patientPortal'
import { syncAssessmentChargeWithAsaas } from '@/services/patientServiceRequest'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type ChargeRow = {
  id: string
  patient_id: string
  amount_cents: number
  payment_status: string
  due_date: string | null
  description: string | null
  payment_method: string | null
  cycle_id: string | null
  asaas_payment_id: string | null
  pix_qr_code: string | null
  pix_copy_paste: string | null
  boleto_url: string | null
}

type ReceiptRow = {
  id: string
  receipt_kind: 'intermediacao' | 'pp_prestacao' | null
  storage_path: string | null
  issued_at: string
}

function pixImageSrc(code: string | null): string | null {
  if (!code) return null
  if (code.startsWith('data:') || code.startsWith('http')) return code
  return `data:image/png;base64,${code}`
}

export function PacientePagamentoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['paciente', 'charges', id],
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from('charges_patient')
        .select(
          'id, patient_id, amount_cents, payment_status, due_date, description, payment_method, cycle_id, asaas_payment_id, pix_qr_code, pix_copy_paste, boleto_url',
        )
        .eq('id', id!)
        .single()
      if (error) throw error
      return row as ChargeRow
    },
    enabled: !!id,
  })

  const { data: receipts = [] } = useQuery({
    queryKey: ['paciente', 'receipts', id],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('patient_receipts')
        .select('id, receipt_kind, storage_path, issued_at')
        .eq('charge_id', id!)
        .order('issued_at', { ascending: false })
      if (error) throw error
      return (rows ?? []) as ReceiptRow[]
    },
    enabled: !!id && data?.payment_status === 'pago',
  })

  const syncPixMutation = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error('Cobran├ºa n├úo carregada')
      const result = await syncAssessmentChargeWithAsaas(
        data.patient_id,
        data.id,
        data.amount_cents,
        (data.payment_method as 'PIX' | 'BOLETO') ?? 'PIX',
      )
      if (!result.synced) throw new Error(result.error ?? 'N├úo foi poss├¡vel gerar o PIX')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paciente', 'charges', id] })
      toast.success('PIX gerado com sucesso')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'N├úo foi poss├¡vel gerar o PIX. Tente novamente.')
    },
  })

  const simulateMutation = useMutation({
    mutationFn: () => simulateChargePayment(id!),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['paciente', 'charges', id] })
      queryClient.invalidateQueries({ queryKey: ['paciente', 'charges-list'] })
      queryClient.invalidateQueries({ queryKey: patientPortalQueryKeys.home })
      queryClient.invalidateQueries({ queryKey: ['paciente', 'cycles'] })

      if (result.already_paid) {
        toast.info('Este pagamento j├í estava confirmado.')
        return
      }

      toast.success(
        result.sessions_count > 0
          ? `Pagamento confirmado! ${result.sessions_count} sess├Áes liberadas.`
          : 'Pagamento confirmado!',
      )
    },
    onError: (err: Error) => {
      toast.error(err.message || 'N├úo foi poss├¡vel simular o pagamento.')
    },
  })

  const copyPix = async () => {
    if (!data?.pix_copy_paste) return
    try {
      await navigator.clipboard.writeText(data.pix_copy_paste)
      toast.success('C├│digo PIX copiado')
    } catch {
      toast.error('N├úo foi poss├¡vel copiar o c├│digo PIX')
    }
  }

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
        <p className="text-muted-foreground">Cobran├ºa n├úo encontrada.</p>
      </PacienteSubpageShell>
    )
  }

  const isPaid = data.payment_status === 'pago'
  const statusLabel = paymentStatusLabels[data.payment_status] ?? data.payment_status
  const hasAsaasCharge = Boolean(data.asaas_payment_id)
  const pixSrc = pixImageSrc(data.pix_qr_code)
  const showDevSimulate = !hasAsaasCharge && import.meta.env.DEV

  return (
    <PacienteSubpageShell title="Pagamento" backTo="/paciente/pagamentos">
      <div className="space-y-4 pb-8">
        <p className="text-sm text-muted-foreground">{data.description ?? 'Detalhe da cobran├ºa'}</p>

        {isPaid && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 dark:border-emerald-900/50 dark:bg-emerald-950/30 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-950 dark:text-emerald-100">Pagamento confirmado</p>
                <p className="text-sm text-emerald-900/85 dark:text-emerald-200/90 mt-1">
                  Seu tratamento foi liberado. As sess├Áes domiciliares j├í est├úo agendadas.
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
                {hasAsaasCharge ? (
                  <div className="space-y-4">
                    {data.payment_method === 'PIX' && (pixSrc || data.pix_copy_paste) && (
                      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3 text-center">
                        <p className="font-medium text-foreground">Pague com PIX</p>
                        {pixSrc && (
                          <img
                            src={pixSrc}
                            alt="QR Code PIX"
                            className="mx-auto w-48 h-48 object-contain rounded-lg bg-white p-2"
                          />
                        )}
                        {data.pix_copy_paste && (
                          <Button type="button" variant="outline" className="w-full" onClick={() => void copyPix()}>
                            <Copy className="size-4 mr-2" />
                            Copiar c├│digo PIX
                          </Button>
                        )}
                      </div>
                    )}
                    {data.boleto_url && (
                      <Button asChild className="w-full h-12 lg:h-10">
                        <a href={data.boleto_url} target="_blank" rel="noopener noreferrer">
                          Abrir boleto
                        </a>
                      </Button>
                    )}
                    {!pixSrc && !data.pix_copy_paste && !data.boleto_url && (
                      <p className="text-sm text-muted-foreground text-center">
                        Cobran├ºa gerada. Aguarde a atualiza├º├úo do QR Code ou boleto.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-5 text-center text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Pagamento via PIX ou boleto</p>
                      <p>A cobran├ºa foi registrada. Gere o PIX para concluir o pagamento.</p>
                    </div>

                    <Button
                      className="w-full h-12 lg:h-10"
                      onClick={() => syncPixMutation.mutate()}
                      disabled={syncPixMutation.isPending}
                    >
                      {syncPixMutation.isPending ? 'Gerando PIXÔÇª' : 'Gerar PIX'}
                    </Button>

                    {showDevSimulate && (
                      <>
                        <Button
                          className="w-full h-12 lg:h-10"
                          onClick={() => simulateMutation.mutate()}
                          disabled={simulateMutation.isPending}
                        >
                          {simulateMutation.isPending ? 'ConfirmandoÔÇª' : 'Simular pagamento confirmado'}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          Ambiente de demonstra├º├úo ÔÇö confirma o PIX e libera as sess├Áes do ciclo.
                        </p>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {isPaid && (
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">Notas fiscais</p>
                <p className="text-xs text-muted-foreground">
                  Para reembolso em conv├¬nio, voc├¬ pode precisar da NF de intermedia├º├úo (Larsana) e da presta├º├úo de
                  servi├ºo do profissional parceiro.
                </p>
                {receipts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">As notas ser├úo disponibilizadas aqui ap├│s emiss├úo.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {receipts.map((receipt) => (
                      <li key={receipt.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
                        <span>
                          {receipt.receipt_kind === 'pp_prestacao'
                            ? 'Presta├º├úo de servi├ºo (PP)'
                            : receipt.receipt_kind === 'intermediacao'
                              ? 'Intermedia├º├úo Larsana'
                              : 'Nota fiscal'}
                        </span>
                        {receipt.storage_path ? (
                          <a href={receipt.storage_path} className="text-primary text-xs font-medium hover:underline">
                            Baixar
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">Em processamento</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
