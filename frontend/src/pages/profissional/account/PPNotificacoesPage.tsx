import { PPAccountSubpageHeader } from '@/components/profissional/account/PPAccountSubpageHeader'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { formatDateTime } from '@/lib/formatters'
import { notificationsService } from '@/services/index'

export function PPNotificacoesPage() {
  return (
    <>
      <PPAccountSubpageHeader title="Notificações" />
      <EntityListPage
        title="Notificações"
        showStats={false}
        showPagination={false}
        mobileVariant="compact"
        queryKey={['pp', 'notifications']}
        queryFn={() => notificationsService.list()}
        emptyMessage="Nenhuma notificação no momento."
        getMobileAvatarLabel={(row) => String(row.title ?? 'Notificação').slice(0, 2)}
        columns={[
          {
            key: 'title',
            header: 'Título',
            mobilePrimary: true,
            cell: (row) => <span className="font-medium">{String(row.title ?? '—')}</span>,
          },
          {
            key: 'date',
            header: 'Data',
            mobileSubtitle: true,
            cell: (row) => formatDateTime(String(row.created_at ?? '')),
          },
        ]}
      />
    </>
  )
}
