import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { PacienteEmptyState, PacienteSubpageShell } from '@/components/paciente/PacienteSubpageShell'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type NotificationRow = {
  id: string
  title: string
  body: string | null
  read_at: string | null
  created_at: string
}

export function PacienteNotificacoesPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['paciente', 'notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, body, read_at, created_at')
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
    },
  })

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
          <PacienteEmptyState message="Você não tem notificações no momento." />
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const isUnread = !notification.read_at

              return (
                <div
                  key={notification.id}
                  className={cn(
                    'rounded-xl border px-4 py-4',
                    isUnread ? 'border-primary/25 bg-primary/5' : 'border-border bg-card',
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
                      {isUnread ? (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 mt-2 text-primary"
                          onClick={() => markRead.mutate(notification.id)}
                        >
                          Marcar como lida
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PacienteSubpageShell>
  )
}
