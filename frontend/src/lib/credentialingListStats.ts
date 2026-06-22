import { ClipboardList, Clock, Database, ShieldCheck } from 'lucide-react'
import type { StatCardItem } from '@/components/crud/list-page/StatsCardRow'
import type { CredentialingListItem } from '@/services/adminCredentialing'

const IN_PROGRESS_STATUSES = new Set([
  'rascunho',
  'documentos_pendentes',
  'termos_pendentes',
  'contrato_pendente',
])

export function buildCredentialingStatCards(rows: CredentialingListItem[]): StatCardItem[] {
  const total = rows.length
  const pendingReview = rows.filter((r) => r.credentialing_status === 'aguardando_aprovacao').length
  const inProgress = rows.filter((r) => IN_PROGRESS_STATUSES.has(r.credentialing_status)).length
  const active = rows.filter((r) => r.credentialing_status === 'ativo').length

  return [
    {
      label: 'Total',
      value: total,
      icon: Database,
      footer: 'Parceiros cadastrados',
    },
    {
      label: 'Aguardando aprovação',
      value: pendingReview,
      icon: Clock,
      footer: pendingReview > 0 ? 'Revisar e aprovar' : 'Nenhum pendente',
    },
    {
      label: 'Em onboarding',
      value: inProgress,
      icon: ClipboardList,
      footer: 'Preenchendo etapas',
    },
    {
      label: 'Ativos',
      value: active,
      icon: ShieldCheck,
      footer: total > 0 ? `${Math.round((active / total) * 100)}% credenciados` : '—',
    },
  ]
}
