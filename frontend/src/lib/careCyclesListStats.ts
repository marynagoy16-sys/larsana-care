import { Clock, CreditCard, Database, PlayCircle } from 'lucide-react'
import type { StatCardItem } from '@/components/crud/list-page/StatsCardRow'
import { isCareCyclePaymentPending } from '@/lib/careCyclesFilters'
import type { CycleListItem } from '@/services/cycles'

export function buildCareCyclesStatCards(rows: CycleListItem[]): StatCardItem[] {
  const total = rows.length
  const active = rows.filter((r) => r.status === 'ativo').length
  const awaitingPayment = rows.filter((r) => r.status === 'aguardando_pagamento').length
  const paymentPending = rows.filter(isCareCyclePaymentPending).length

  return [
    {
      label: 'Total',
      value: total,
      icon: Database,
      footer: 'Ciclos de tratamento',
    },
    {
      label: 'Ativos',
      value: active,
      icon: PlayCircle,
      footer: active > 0 ? 'Em andamento' : 'Nenhum ciclo ativo',
    },
    {
      label: 'Aguardando pagamento',
      value: awaitingPayment,
      icon: Clock,
      footer: awaitingPayment > 0 ? 'Liberar após confirmação' : 'Nenhum aguardando',
    },
    {
      label: 'Cobrança pendente',
      value: paymentPending,
      icon: CreditCard,
      footer: paymentPending > 0 ? 'Pendente ou vencido' : 'Financeiro em dia',
    },
  ]
}
