import { View } from 'react-native'
import { KpiCard } from '@/components/ui/KpiCard'
import type { FinanceKpis } from '@/services/dashboard'
import { formatCurrency, formatDate, formatReferenceMonth } from '@/lib/formatters'
import {
  ArrowLeftRight,
  Banknote,
  FileSpreadsheet,
  Receipt,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native'

export function DashboardKpiGrid({ kpis }: { kpis: FinanceKpis }) {
  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <KpiCard
          label="Cobranças mês"
          value={formatCurrency(kpis.chargesMonthTotal)}
          icon={Receipt}
          description={`${kpis.chargesMonthCount} cobranças`}
        />
        <KpiCard
          label="Total pago"
          value={formatCurrency(kpis.chargesPaidTotal)}
          icon={TrendingUp}
          description={`${kpis.chargesPaidCount} pagas`}
        />
      </View>
      <View className="flex-row gap-3">
        <KpiCard
          label="Em aberto"
          value={formatCurrency(kpis.chargesOpenTotal)}
          icon={TrendingDown}
          description={`${kpis.chargesOpenCount} pendentes`}
        />
        <KpiCard
          label="Repasses pend."
          value={formatCurrency(kpis.pendingTransfersTotal)}
          icon={ArrowLeftRight}
          description={`${kpis.pendingTransfersCount} repasses`}
        />
      </View>
      <View className="flex-row gap-3">
        <KpiCard
          label="Despesas mês"
          value={formatCurrency(kpis.expensesMonthTotal)}
          icon={Banknote}
        />
        <KpiCard
          label="Último DELUMA"
          value={
            kpis.lastDelumaExport
              ? formatReferenceMonth(kpis.lastDelumaExport.reference_month)
              : '—'
          }
          icon={FileSpreadsheet}
          description={
            kpis.lastDelumaExport
              ? `Gerado em ${formatDate(kpis.lastDelumaExport.generated_at)}`
              : 'Nenhum export'
          }
        />
      </View>
    </View>
  )
}
