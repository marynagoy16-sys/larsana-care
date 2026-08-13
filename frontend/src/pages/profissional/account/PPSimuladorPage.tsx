import { PPAccountSubpageHeader } from '@/components/profissional/account/PPAccountSubpageHeader'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { transfersService } from '@/services/index'

export function PPSimuladorPage() {
  return (
    <>
      <PPAccountSubpageHeader title="Simulador de ganhos" />
      <EntityListPage
        title="Simulador de ganhos"
        showStats={false}
        showPagination={false}
        showToolbar={false}
        searchable={false}
        mobileVariant="compact"
        queryKey={['pp', 'simulador']}
        queryFn={() => transfersService.list('id, pp_transfer_amount_cents, status, created_at')}
        emptyMessage="Sem repasses no histórico para estimativa. Os valores aparecerão aqui conforme ciclos forem liberados."
        getMobileAvatarLabel={() => 'R$'}
        columns={[
          {
            key: 'amount',
            header: 'Valor',
            mobilePrimary: true,
            cell: (row) => (
              <span className="font-medium tabular-nums">
                {formatCurrency(Number(row.pp_transfer_amount_cents ?? 0))}
              </span>
            ),
          },
          {
            key: 'meta',
            header: 'Detalhe',
            mobileSubtitle: true,
            cell: (row) => {
              const date = row.created_at ? formatDateTime(String(row.created_at)) : null
              return date ? `${String(row.status ?? '—')} · ${date}` : String(row.status ?? '—')
            },
          },
        ]}
      />
    </>
  )
}
