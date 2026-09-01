import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { PPAccountSubpageHeader } from '@/components/profissional/account/PPAccountSubpageHeader'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { Toggle } from '@/components/ui/toggle'
import { formatDateTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import {
  markNotificationRead,
  notificationsQueryKeys,
  resolvePpNotificationHref,
  type AppNotificationRow,
} from '@/services/notifications'
import { supabase } from '@/lib/supabase'

type NotificationFilter = 'all' | 'unread' | 'read'

type NotificationRow = AppNotificationRow

const NOTIFICATION_FILTERS: { id: NotificationFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'unread', label: 'Novas' },
  { id: 'read', label: 'Lidas' },
]

const EMPTY_MESSAGES: Record<NotificationFilter, string> = {
  all: 'Nenhuma notificação no momento.',
  unread: 'Nenhuma notificação nova.',
  read: 'Nenhuma notificação lida.',
}

function matchesNotificationFilter(row: NotificationRow, filter: NotificationFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'unread') return !row.read_at
  return Boolean(row.read_at)
}

export function PPNotificacoesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilter>('all')

  const rowFilter = useMemo(
    () => (row: NotificationRow) => matchesNotificationFilter(row, notificationFilter),
    [notificationFilter],
  )

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pp', 'notifications'] })
      queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.unreadCount })
    },
  })

  const handleOpen = (notification: NotificationRow) => {
    const href = resolvePpNotificationHref(notification)
    if (!notification.read_at) {
      markRead.mutate(notification.id)
    }
    if (href) navigate(href)
  }

  return (
    <>
      <PPAccountSubpageHeader title="Notificações" />
      <EntityListPage
        title="Notificações"
        showStats={false}
        showPagination={false}
        showToolbar={false}
        mobileVariant="compact"
        queryKey={['pp', 'notifications']}
        queryFn={async () => {
          const { data, error, count } = await supabase
            .from('notifications')
            .select('id, title, body, type, payload, read_at, created_at', { count: 'exact' })
            .order('created_at', { ascending: false })
          if (error) throw error
          return { data: (data ?? []) as NotificationRow[], count: count ?? data?.length ?? 0 }
        }}
        emptyMessage={EMPTY_MESSAGES[notificationFilter]}
        emptyIcon={Bell}
        filterResetKey={notificationFilter}
        rowFilter={rowFilter}
        onRowClick={handleOpen}
        getMobileAvatarLabel={(row) => String(row.title ?? 'Notificação').slice(0, 1)}
        toolbar={
          <div
            className={cn(
              'overflow-x-auto overscroll-x-contain py-1 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              'max-lg:-mx-[var(--shell-gap)] max-lg:w-[calc(100%+2*var(--shell-gap))]',
            )}
          >
            <div className="flex w-max flex-nowrap gap-2">
              {NOTIFICATION_FILTERS.map((filter, index) => (
                <Toggle
                  key={filter.id}
                  variant="outline"
                  pressed={notificationFilter === filter.id}
                  onPressedChange={(pressed) => {
                    if (pressed) setNotificationFilter(filter.id)
                  }}
                  className={cn(
                    'h-11 shrink-0 rounded-full px-5 text-sm whitespace-nowrap data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
                    index === 0 && 'max-lg:ml-[var(--shell-gap)]',
                    index === NOTIFICATION_FILTERS.length - 1 && 'max-lg:mr-[var(--shell-gap)]',
                  )}
                >
                  {filter.label}
                </Toggle>
              ))}
            </div>
          </div>
        }
        columns={[
          {
            key: 'title',
            header: 'Título',
            mobilePrimary: true,
            cell: (row) => (
              <span className={cn('font-medium', !row.read_at && 'text-foreground')}>
                {String(row.title ?? '—')}
              </span>
            ),
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
