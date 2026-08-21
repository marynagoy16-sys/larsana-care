import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { PacienteEmptyState, PacienteSubpageShell } from '@/components/paciente/PacienteSubpageShell'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { notificationsQueryKeys } from '@/services/notifications'

type NotificationRow = {
  id: string
  title: string
  body: string | null
  type: string | null
  payload: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

function resolveNotificationHref(notification: NotificationRow): string | null {
  const type = notification.type ?? ''
  if (type.includes('agendamento') || type.includes('horario') || type === 'scheduling') {
    return '/paciente/agendamento'
  }
  if (type === 'proposta' || type.includes('proposta')) {
    return '/paciente/proposta'
  }
  if (type.includes('pagamento') || type === 'cobranca') {
    return '/paciente/pagamentos'
  }
  if (type === 'nps_sessao') {
    const href = notification.payload?.href
    return typeof href === 'string' ? href : null
  }
  const payload = notification.payload
  if (payload?.proposal_id || payload?.scheduling_proposal_id) {
    return '/paciente/agendamento'
  }
  if (payload?.assessment_id) {
    return '/paciente/proposta'
  }
  if (typeof payload?.href === 'string') {
    return payload.href
  }
  return null
}

export function PacienteNotificacoesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['paciente', 'notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, body, type, payload, read_at, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as NotificationRow[]
    },
  })

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paciente', 'notifications'] })
      queryClient.invalidateQueries({ queryKey: notificationsQueryKeys.unreadCount })
    },
  })

  const handleOpen = (notification: NotificationRow) => {
    const href = resolveNotificationHref(notification)
    if (!notification.read_at) {
      markRead.mutate(notification.id)
    }
    if (href) navigate(href)
  }

  const notifications = data ?? []
  const unreadCount = notifications.filter((n) => !n.read_at).length

  return (
    <PacienteSubpageShell title="Notificações" loading={isLoading}>
      <div className="space-y-4 pb-8">
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Alertas e avisos importantes'}
        </p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando notificações…</p>
        ) : notifications.length === 0 ? (
          <PacienteEmptyState message="Você não tem notificações no momento." icon={Bell} />
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const isUnread = !notification.read_at
              const href = resolveNotificationHref(notification)

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleOpen(notification)}
                  className={cn(
                    'w-full rounded-xl border px-4 py-4 text-left transition-colors',
                    isUnread ? 'border-primary/25 bg-primary/5' : 'border-border bg-card',
                    href && 'hover:bg-muted/40 cursor-pointer',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Bell className="size-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{notification.title}</p>
                      {notification.body ? (
                        <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDateTime(notification.created_at)}
                      </p>
                      {href ? (
                        <p className="text-xs font-medium text-primary mt-2">Toque para abrir</p>
                      ) : isUnread ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 mt-2 text-primary"
                          onClick={(event) => {
                            event.stopPropagation()
                            markRead.mutate(notification.id)
                          }}
                        >
                          Marcar como lida
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </PacienteSubpageShell>
  )
}
