import { AlertTriangle, ClipboardList, Database, Stethoscope } from 'lucide-react'
import type { StatCardItem } from '@/components/crud/list-page/StatsCardRow'
import { isMedicalRecordNonCompliant, type MedicalRecordListRow } from '@/lib/medicalRecordsFilters'
import { medicalRecordTypeLabels } from '@/constants/labels'

export function buildMedicalRecordsStatCards(rows: MedicalRecordListRow[]): StatCardItem[] {
  const total = rows.length
  const evolucao = rows.filter((r) => r.record_type === 'evolucao').length
  const avaliacao = rows.filter((r) => r.record_type === 'avaliacao').length
  const nonCompliant = rows.filter(isMedicalRecordNonCompliant).length

  return [
    {
      label: 'Total',
      value: total,
      icon: Database,
      footer: 'Painel de conformidade CREFITO',
    },
    {
      label: medicalRecordTypeLabels.evolucao,
      value: evolucao,
      icon: ClipboardList,
      footer: total > 0 ? `${Math.round((evolucao / total) * 100)}% do total` : '—',
    },
    {
      label: medicalRecordTypeLabels.avaliacao,
      value: avaliacao,
      icon: Stethoscope,
      footer: total > 0 ? `${Math.round((avaliacao / total) * 100)}% do total` : '—',
    },
    {
      label: 'Pendências',
      value: nonCompliant,
      icon: AlertTriangle,
      footer: nonCompliant > 0 ? 'Sem conteúdo ou alerta 24h' : 'Conformidade OK',
    },
  ]
}
