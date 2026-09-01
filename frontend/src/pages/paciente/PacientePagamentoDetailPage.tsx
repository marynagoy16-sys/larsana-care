import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { CheckCircle2, Copy } from 'lucide-react'
import { PacienteSubpageShell } from '@/components/paciente/PacienteSubpageShell'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { paymentStatusLabels } from '@/constants/labels'
import { simulateChargePayment, syncPatientChargeWithAsaas, updateChargePaymentMethod } from '@/services/patientPayments'
import { ensurePatientPrimaryAddressGeocoded } from '@/services/patientAddressGeocode'
import { patientPortalQueryKeys } from '@/services/patientPortal'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { getPatientReceiptSignedUrl } from '@/services/patientReceipts'
import { PaymentTrustBanner } from '@/components/paciente/PaymentTrustBanner'
import { BoletoIcon, PaymentMethodIconSlot, PixIcon } from '@/components/paciente/PaymentMethodIcons'
import { isPaymentSimulationEnabled } from '@/lib/paymentSimulation'
import { patientServiceQueryKeys } from '@/services/patientServiceRequest'

import { cn } from '@/lib/utils'

type PaymentMethodChoice = 'PIX' | 'BOLETO'

type ChargeRow = {
  id: string
  patient_id: string
  amount_cents: number
  assessment_credit_cents?: number
  charge_kind?: string | null
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
  const [pixReceiverMessage, setPixReceiverMessage] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodChoice>('PIX')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['paciente', 'charges', id],
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from('charges_patient')
        .select(
          'id, patient_id, amount_cents, assessment_credit_cents, charge_kind, payment_status, due_date, description, payment_method, cycle_id, asaas_payment_id, pix_qr_code, pix_copy_paste, boleto_url',
        )
        .eq('id', id!)
        .single()
      if (error) throw error
      return row as unknown as ChargeRow
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

  useEffect(() => {
    if (data?.payment_method === 'PIX' || data?.payment_method === 'BOLETO') {
      setPaymentMethod(data.payment_method)
    }
  }, [data?.payment_method])

  const methodMutation = useMutation({
    mutationFn: async (method: PaymentMethodChoice) => {
      if (!id) throw new Error('Cobrança não encontrada')
      await updateChargePaymentMethod(id, method)
      return method
    },
    onSuccess: (method) => {
      setPaymentMethod(method)
      setPixReceiverMessage(null)
      queryClient.invalidateQueries({ queryKey: ['paciente', 'charges', id] })
    },
    onError: (err: Error) => toast.error(err.message || 'Não foi possível alterar a forma de pagamento'),
  })

  const syncChargeMutation = useMutation({
    mutationFn: async () => {
      if (!data) throw new Error('Cobrança não carregada')
      const result = await syncPatientChargeWithAsaas({
        patientId: data.patient_id,
        chargeId: data.id,
        amountCents: data.amount_cents,
        paymentMethod,
        description: data.description ?? 'Pagamento Larsana Care',
        dueDate: data.due_date ?? undefined,
        forceNewAsaasPayment: Boolean(data.asaas_payment_id),
      })
      if (!result.synced) {
        throw new Error(
          result.error
            ?? (paymentMethod === 'BOLETO' ? 'Não foi possível gerar o boleto' : 'Não foi possível gerar o PIX'),
        )
      }
      setPixReceiverMessage(result.pixReceiverMessage ?? null)
      return result
    },
    onSuccess: (result) => {
      if (paymentMethod === 'PIX' && result.pixReceiverReady === false && result.pixReceiverMessage) {
        toast.warning('PIX gerado, mas a conta recebedora ainda não está pronta', {
          description: result.pixReceiverMessage,
        })
      }
      queryClient.invalidateQueries({ queryKey: ['paciente', 'charges', id] })
      toast.success(paymentMethod === 'BOLETO' ? 'Boleto gerado com sucesso' : 'PIX gerado com sucesso')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Não foi possível gerar a cobrança. Tente novamente.')
    },
  })

  const simulateMutation = useMutation({
    mutationFn: async () => {
      if (data?.patient_id) {
        await ensurePatientPrimaryAddressGeocoded(data.patient_id)
      }
      return simulateChargePayment(id!)
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['paciente', 'charges', id] })
      queryClient.invalidateQueries({ queryKey: ['paciente', 'charges-list'] })
      queryClient.invalidateQueries({ queryKey: patientPortalQueryKeys.home })
      queryClient.invalidateQueries({ queryKey: patientServiceQueryKeys.status })

      if (result.already_paid) {
        toast.info('Este pagamento já estava confirmado.')
        return
      }

      toast.success(
        result.sessions_count > 0
          ? `Pagamento confirmado! ${result.sessions_count} sessões liberadas.`
          : 'Pagamento confirmado! Sua solicitação foi enviada.',
      )
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Não foi possível simular o pagamento.')
    },
  })

  const copyPix = async () => {
    if (!data?.pix_copy_paste) return
    try {
      await navigator.clipboard.writeText(data.pix_copy_paste)
      toast.success('Código PIX copiado')
    } catch {
      toast.error('Não foi possível copiar o código PIX')
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
        <p className="text-muted-foreground">Cobrança não encontrada.</p>
      </PacienteSubpageShell>
    )
  }

  const isPaid = data.payment_status === 'pago'
  const assessmentCredit = data.assessment_credit_cents ?? 0
  const grossAmount = data.amount_cents + assessmentCredit
  const statusLabel = paymentStatusLabels[data.payment_status] ?? data.payment_status
  const hasAsaasCharge = Boolean(data.asaas_payment_id)
  const isPix = paymentMethod === 'PIX'
  const isBoleto = paymentMethod === 'BOLETO'
  const pixSrc = pixImageSrc(data.pix_qr_code)
  const showSimulatePayment = isPaymentSimulationEnabled() && !isPaid
  const asaasInvoiceUrl = data.asaas_payment_id
    ? `https://www.asaas.com/i/${data.asaas_payment_id.replace(/^pay_/, '')}`
    : null
  const paymentBusy = methodMutation.isPending || syncChargeMutation.isPending

  const handlePaymentMethodChange = (method: PaymentMethodChoice) => {
    if (method === paymentMethod || paymentBusy) return
    if (!hasAsaasCharge) {
      setPaymentMethod(method)
      if (method !== data.payment_method) {
        methodMutation.mutate(method)
      }
      return
    }
    methodMutation.mutate(method)
  }

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
              {assessmentCredit > 0 && data.charge_kind === 'cycle' ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Subtotal {formatCurrency(grossAmount)} − desconto da avaliação paga{' '}
                  {formatCurrency(assessmentCredit)}
                </p>
              ) : null}
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
            </div>

            {!isPaid && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Forma de pagamento</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['PIX', 'BOLETO'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      disabled={paymentBusy}
                      onClick={() => handlePaymentMethodChange(method)}
                      className={cn(
                        'flex min-h-[4.5rem] flex-col items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-medium transition-colors',
                        paymentMethod === method
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-foreground hover:bg-muted/40',
                      )}
                    >
                      <PaymentMethodIconSlot>
                        {method === 'PIX' ? (
                          <PixIcon />
                        ) : (
                          <BoletoIcon
                            className={paymentMethod === method ? 'text-primary' : undefined}
                          />
                        )}
                      </PaymentMethodIconSlot>
                      <span className="w-full text-center leading-none">{method === 'PIX' ? 'PIX' : 'Boleto'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!isPaid && (
              <>
                {hasAsaasCharge ? (
                  <div className="space-y-4">
                    {pixReceiverMessage ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs leading-relaxed text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
                        {pixReceiverMessage}
                      </div>
                    ) : null}
                    {isPix && (pixSrc || data.pix_copy_paste) && (
                      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3 text-center">
                        <p className="font-medium text-foreground">Pague com PIX</p>
                        <p className="text-xs text-muted-foreground text-center leading-relaxed">
                          Se a leitura do QR Code falhar, o código copiado costuma funcionar.
                        </p>
                        {data.pix_copy_paste && (
                          <Button type="button" className="w-full" onClick={() => void copyPix()}>
                            <Copy className="size-4 mr-2" />
                            Copiar código PIX
                          </Button>
                        )}
                        {pixSrc && (
                          <img
                            src={pixSrc}
                            alt="QR Code PIX"
                            className="mx-auto w-48 h-48 object-contain rounded-lg bg-white p-2"
                          />
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => syncChargeMutation.mutate()}
                          disabled={syncChargeMutation.isPending}
                        >
                          {syncChargeMutation.isPending
                            ? isBoleto
                              ? 'Gerando boleto…'
                              : 'Gerando novo PIX…'
                            : isBoleto
                              ? 'Gerar novo boleto'
                              : 'Gerar novo PIX'}
                        </Button>
                        {asaasInvoiceUrl ? (
                          <Button asChild variant="ghost" className="w-full text-primary">
                            <a href={asaasInvoiceUrl} target="_blank" rel="noopener noreferrer">
                              Abrir pagamento no Asaas
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    )}
                    {isBoleto && data.boleto_url && (
                      <Button asChild className="w-full h-12 lg:h-10">
                        <a href={data.boleto_url} target="_blank" rel="noopener noreferrer">
                          Abrir boleto
                        </a>
                      </Button>
                    )}
                    {isPix && !pixSrc && !data.pix_copy_paste && (
                      <p className="text-sm text-muted-foreground text-center">
                        Cobrança gerada. Aguarde a atualização do QR Code PIX.
                      </p>
                    )}
                    {isBoleto && !data.boleto_url && (
                      <p className="text-sm text-muted-foreground text-center">
                        Cobrança gerada. Aguarde a geração do boleto.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <Button
                      className="w-full h-12 lg:h-10"
                      onClick={() => syncChargeMutation.mutate()}
                      disabled={syncChargeMutation.isPending || methodMutation.isPending}
                    >
                      {syncChargeMutation.isPending
                        ? isBoleto
                          ? 'Gerando boleto…'
                          : 'Gerando PIX…'
                        : isBoleto
                          ? 'Gerar boleto'
                          : 'Gerar PIX'}
                    </Button>

                    {showSimulatePayment ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-12 lg:h-10"
                          onClick={() => simulateMutation.mutate()}
                          disabled={simulateMutation.isPending || paymentBusy}
                        >
                          {simulateMutation.isPending ? 'Confirmando…' : 'Simular pagamento confirmado'}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          Ambiente de demonstração — confirma o pagamento e envia a solicitação.
                        </p>
                      </>
                    ) : null}
                  </>
                )}
              </>
            )}

            {isPaid && (
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">Notas fiscais</p>
                <p className="text-xs text-muted-foreground">
                  Para reembolso em convênio, você pode precisar da NF de intermediação (Larsana) e da prestação de
                  serviço do profissional parceiro.
                </p>
                {receipts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">As notas serão disponibilizadas aqui após emissão.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {receipts.map((receipt) => (
                      <li key={receipt.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
                        <span>
                          {receipt.receipt_kind === 'pp_prestacao'
                            ? 'Prestação de serviço (PP)'
                            : receipt.receipt_kind === 'intermediacao'
                              ? 'Intermediação Larsana'
                              : 'Nota fiscal'}
                        </span>
                        {receipt.storage_path ? (
                          <button
                            type="button"
                            className="text-primary text-xs font-medium hover:underline"
                            onClick={() => {
                              void getPatientReceiptSignedUrl(receipt.storage_path!).then((url) => {
                                window.open(url, '_blank', 'noopener,noreferrer')
                              }).catch((err: Error) => toast.error(err.message))
                            }}
                          >
                            Baixar
                          </button>
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

            {!isPaid && <PaymentTrustBanner />}
          </div>
        </div>
      </div>
    </PacienteSubpageShell>
  )
}
