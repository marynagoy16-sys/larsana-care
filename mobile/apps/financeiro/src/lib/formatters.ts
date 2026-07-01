export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100)
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function formatMonthYear(isoOrMonth: string): string {
  if (/^\d{4}-\d{2}$/.test(isoOrMonth)) {
    const [year, month] = isoOrMonth.split('-')
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
      new Date(Number(year), Number(month) - 1, 1),
    )
  }
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(isoOrMonth))
}

export function formatReferenceMonth(month: string): string {
  return formatMonthYear(month.length === 7 ? `${month}-01` : month)
}

export function getCurrentMonthKey(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function getMonthRange(monthKey: string): { start: string; end: string } {
  const [year, month] = monthKey.split('-').map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { start: fmt(start), end: fmt(end) }
}

export function daysSince(iso: string): number {
  const target = new Date(iso)
  const now = new Date()
  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.floor((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))
}

export function parseCurrencyToCents(value: string): number {
  const digits = value.replace(/\D/g, '')
  return Number(digits || '0')
}

export function formatCentsInput(cents: number): string {
  return formatCurrency(cents)
}

export type PaymentStatusFilter = 'todos' | 'pago' | 'pendente' | 'vencido'

export function getEffectivePaymentStatus(
  paymentStatus: string,
  dueDate: string | null,
): 'pago' | 'pendente' | 'vencido' | 'cancelado' {
  if (paymentStatus === 'pago' || paymentStatus === 'cancelado') {
    return paymentStatus as 'pago' | 'cancelado'
  }
  if (dueDate) {
    const due = new Date(dueDate)
    const today = new Date()
    due.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    if (due < today) return 'vencido'
  }
  return 'pendente'
}

export function paymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pago: 'Pago',
    pendente: 'Pendente',
    vencido: 'Vencido',
    cancelado: 'Cancelado',
  }
  return labels[status] ?? status
}

export function transferStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    aguardando_nf: 'Aguardando NF',
    aguardando_validacao: 'Aguardando validação',
    liberado: 'Liberado',
    transferido: 'Transferido',
    falhou: 'Falhou',
  }
  return labels[status] ?? status
}

export const PENDING_TRANSFER_STATUSES = ['aguardando_nf', 'aguardando_validacao', 'liberado', 'falhou'] as const

export function isPendingTransfer(status: string): boolean {
  return status !== 'transferido'
}
