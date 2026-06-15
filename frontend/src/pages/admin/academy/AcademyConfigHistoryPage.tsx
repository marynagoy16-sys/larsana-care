import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/formatters'
import { getGateRulesLog } from '@/services/academy'
import { GATE_PRESET_LABELS, type AcademyGatePreset } from '@/types/academy'

export function AcademyConfigHistoryPage() {
  const navigate = useNavigate()
  const [allRows, setAllRows] = useState<Array<Record<string, unknown> & { id: string }>>([])

  const stats = useMemo(() => {
    const presets = allRows.filter((r) => r.preset).length
    return [
      { label: 'Total', value: allRows.length, footer: 'Alterações registradas' },
      { label: 'Com preset', value: presets },
      { label: 'Sem preset', value: allRows.length - presets },
      { label: 'Alvos distintos', value: new Set(allRows.map((r) => r.gate_target ?? '—')).size },
    ]
  }, [allRows])

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="icon" className="rounded-xl shrink-0" onClick={() => navigate('/admin/academy/config')} aria-label="Voltar">
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl lg:text-2xl leading-tight tracking-tight">
              Histórico de configuração
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Auditoria de alterações nos gates Academy</p>
          </div>
        </div>
      </PageHeader>

      <EntityListPage
        title="Histórico"
        description="Registro de presets e regras aplicadas"
        queryKey={['admin', 'academy', 'config-log']}
        queryFn={async () => {
          const data = await getGateRulesLog()
          setAllRows(data as unknown as Array<Record<string, unknown> & { id: string }>)
          return { data: data as unknown as Array<Record<string, unknown> & { id: string }>, count: data.length }
        }}
        stats={stats}
        statsColumns={4}
        searchable={false}
        columns={[
          {
            key: 'preset',
            header: 'Preset',
            mobilePrimary: true,
            cell: (r) => (r.preset ? GATE_PRESET_LABELS[r.preset as AcademyGatePreset] : '—'),
          },
          { key: 'target', header: 'Alvo', cell: (r) => String(r.gate_target ?? '—') },
          { key: 'when', header: 'Quando', cell: (r) => formatDateTime(String(r.changed_at)) },
          { key: 'by', header: 'Por', cell: (r) => String(r.changed_by ?? '—').slice(0, 8) },
        ]}
      />
    </>
  )
}
