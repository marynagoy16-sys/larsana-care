import { Database, Filter, Layers, List, type LucideIcon } from 'lucide-react'
import type { StatCardItem } from '@/components/crud/list-page/StatsCardRow'
import { getRepasseStatusVisual } from '@/lib/repasseStatus'
import { getPaymentStatusVisual } from '@/components/admin/finance/PaymentStatusVisual'
import { paymentStatusLabels } from '@/constants/labels'
import { TRANSFER_STATUS_LABELS, type TransferStatus } from '@/services/ppTransfers'

const STATUS_KEYS = [
  'status',
  'care_status',
  'payment_status',
  'credentialing_status',
  'record_type',
  'payment_method',
]

function findStatusKey<T extends Record<string, unknown>>(rows: T[]): string | undefined {
  if (rows.length === 0) return undefined
  return STATUS_KEYS.find((key) => key in rows[0])
}

function capitalizeFirst(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function getStatStatusIcon(statusKey: string, status: string): LucideIcon {
  if (statusKey === 'status') {
    return getRepasseStatusVisual(status).icon
  }
  if (statusKey === 'payment_status') {
    return getPaymentStatusVisual(status).icon
  }
  return Layers
}

function formatStatStatusLabel(statusKey: string, status: string): string {
  if (statusKey === 'status' && status in TRANSFER_STATUS_LABELS) {
    return TRANSFER_STATUS_LABELS[status as TransferStatus]
  }
  if (statusKey === 'payment_status') {
    return paymentStatusLabels[status] ?? capitalizeFirst(status.replace(/_/g, ' '))
  }
  return capitalizeFirst(status.replace(/_/g, ' '))
}

export function buildEntityListStats<T extends Record<string, unknown>>(
  rows: T[],
  filteredRows: T[],
  options: {
    title: string
    search: string
    page: number
    pageSize: number
    pageCount: number
  },
): StatCardItem[] {
  const { title, search, page, pageSize, pageCount } = options
  const total = rows.length
  const filtered = filteredRows.length
  const from = filtered === 0 ? 0 : page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, filtered)
  const statusKey = findStatusKey(rows)

  if (statusKey && total > 0) {
    const counts = new Map<string, number>()
    for (const row of rows) {
      const status = String(row[statusKey] ?? '—')
      counts.set(status, (counts.get(status) ?? 0) + 1)
    }
    const topStatuses = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
    const cards: StatCardItem[] = [
      {
        label: 'Total',
        value: total,
        icon: Database,
        footer: title,
      },
      ...topStatuses.map(([status, count]) => ({
        label: formatStatStatusLabel(statusKey, status),
        value: count,
        icon: getStatStatusIcon(statusKey, status),
        footer: total > 0 ? `${Math.round((count / total) * 100)}% do total` : '—',
      })),
    ]
    const fillerCards: StatCardItem[] = [
      {
        label: search ? 'Filtrados' : 'Visíveis',
        value: search ? filtered : total,
        icon: Filter,
        footer: search ? 'Com busca ativa' : 'Sem filtro',
      },
      {
        label: 'Nesta página',
        value: pageCount,
        icon: List,
        footer: filtered > 0 ? `${from}–${to} de ${filtered}` : 'Nenhum registro',
      },
    ]
    for (const filler of fillerCards) {
      if (cards.length >= 4) break
      cards.push(filler)
    }
    return cards.slice(0, 4)
  }

  return [
    {
      label: 'Total',
      value: total,
      icon: Database,
      footer: title,
    },
    {
      label: search ? 'Filtrados' : 'Registros',
      value: filtered,
      icon: Filter,
      footer: search ? 'Resultado da busca' : 'Sem filtro aplicado',
    },
    {
      label: 'Nesta página',
      value: pageCount,
      icon: List,
      footer: filtered > 0 ? `${from}–${to} de ${filtered}` : 'Nenhum registro',
    },
    {
      label: 'Páginas',
      value: Math.max(1, Math.ceil(filtered / pageSize)),
      icon: Layers,
      footer: filtered > 0 ? `${page + 1}ª página ativa` : '—',
    },
  ]
}
