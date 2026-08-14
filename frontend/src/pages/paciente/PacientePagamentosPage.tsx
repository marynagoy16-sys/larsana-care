import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { PacienteEmptyState, PacienteSubpageShell } from '@/components/paciente/PacienteSubpageShell'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { paymentStatusLabels } from '@/constants/labels'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type ChargeRow = {
  id: string
  amount_cents: number
  payment_status: string
  due_date: string | null
  description: string | null
}

export function PacientePagamentosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['paciente', 'charges-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('charges_patient')
        .select('id, amount_cents, payment_status, due_date, description')
        .order('due_date', { ascending: false })
      if (error) throw error
      return (data ?? []) as ChargeRow[]
    },
  })

  const charges = Array.isArray(data) ? data : []

  return (
    <PacienteSubpageShell title="Pagamentos" loading={isLoading}>
      <div className="space-y-4 pb-8">
        <p className="text-sm text-muted-foreground">PIX, boletos e comprovantes dos ciclos</p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando pagamentos…</p>
        ) : charges.length === 0 ? (
          <PacienteEmptyState message="Nenhuma cobrança encontrada no momento." />
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
            {charges.map((charge) => {
              const statusLabel = paymentStatusLabels[charge.payment_status] ?? charge.payment_status
              const isPaid = charge.payment_status === 'pago'

              return (
                <Link
                  key={charge.id}
                  to={`/paciente/pagamentos/${charge.id}`}
                  className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{formatCurrency(charge.amount_cents)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {charge.description ?? 'Cobrança do ciclo'}
                      {charge.due_date ? ` · Venc. ${formatDate(charge.due_date)}` : ''}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                      isPaid ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {statusLabel}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </PacienteSubpageShell>
  )
}
