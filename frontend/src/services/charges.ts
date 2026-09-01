import { supabase } from '@/lib/supabase'

export type PaymentStatus = 'pendente' | 'pago' | 'vencido' | 'cancelado'
export type ChargeKind = 'cycle' | 'assessment_request' | 'assessment_fee'
export type PaymentMethod = 'PIX' | 'BOLETO'

export const PAYMENT_STATUS_ORDER: PaymentStatus[] = ['pendente', 'pago', 'vencido', 'cancelado']

export const CHARGE_KIND_LABELS: Record<ChargeKind, string> = {
  cycle: 'Ciclo',
  assessment_request: 'Solicitação de avaliação',
  assessment_fee: 'Taxa de avaliação',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX: 'PIX',
  BOLETO: 'Boleto',
}

export const PAYMENT_TIMING_LABELS: Record<string, string> = {
  antecipado: 'Antecipado',
  pos_ciclo: 'Pós-ciclo',
}

export type ChargeListItem = {
  id: string
  amount_cents: number
  payment_status: PaymentStatus
  payment_method: PaymentMethod | null
  due_date: string | null
  created_at: string
  paid_at: string | null
  charge_kind: ChargeKind
  description: string | null
  patients?: { full_name: string } | null
  care_cycles?: { cycle_number: number } | null
}

export type ChargeDetail = ChargeListItem & {
  patient_id: string
  cycle_id: string | null
  assessment_id: string | null
  assessment_credit_cents: number
  asaas_payment_id: string | null
  boleto_url: string | null
  pix_copy_paste: string | null
  payment_timing: string | null
  updated_at: string
}

const chargeListSelect = `
  id, amount_cents, payment_status, payment_method, due_date, created_at, paid_at,
  charge_kind, description,
  patients ( full_name ),
  care_cycles ( cycle_number )
`

export async function listStaffCharges(): Promise<{ data: ChargeListItem[]; count: number }> {
  const { data, error } = await supabase
    .from('charges')
    .select(chargeListSelect)
    .order('created_at', { ascending: false })

  if (error) throw error
  const rows = (data ?? []) as ChargeListItem[]
  return { data: rows, count: rows.length }
}

export async function getStaffChargeDetail(id: string): Promise<ChargeDetail | null> {
  const { data, error } = await supabase
    .from('charges')
    .select(
      `
      ${chargeListSelect.trim()},
      patient_id, cycle_id, assessment_id, assessment_credit_cents,
      asaas_payment_id, boleto_url, pix_copy_paste, payment_timing, updated_at
    `,
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return (data ?? null) as ChargeDetail | null
}

export function formatChargeDueHint(dueDate: string | null, status: PaymentStatus): string | null {
  if (!dueDate || status === 'pago' || status === 'cancelado') return null
  const due = new Date(`${dueDate}T12:00:00`)
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) {
    const overdue = Math.abs(diffDays)
    return overdue === 1 ? '1 dia em atraso' : `${overdue} dias em atraso`
  }
  if (diffDays === 0) return 'Vence hoje'
  if (diffDays === 1) return 'Vence amanhã'
  return `Vence em ${diffDays} dias`
}
