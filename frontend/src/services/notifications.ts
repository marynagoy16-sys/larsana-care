import { supabase } from '@/lib/supabase'

export const notificationsQueryKeys = {
  unreadCount: ['notifications', 'unread-count'] as const,
}

export async function getUnreadNotificationsCount(): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null)

  if (error) throw error
  return count ?? 0
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export type AppNotificationRow = {
  id: string
  title: string | null
  body: string | null
  type: string | null
  payload: Record<string, unknown> | null
  read_at: string | null
  created_at: string | null
}

export function resolvePpNotificationHref(
  notification: Pick<AppNotificationRow, 'type' | 'title' | 'payload'>,
): string | null {
  const payload = notification.payload
  const type = notification.type ?? ''
  const title = String(notification.title ?? '')

  if (typeof payload?.demand_id === 'string') {
    const isScheduleAction =
      type === 'agendamento' || type.includes('agendamento') || /envie horários/i.test(title)
    if (isScheduleAction) {
      return `/profissional/demandas/${payload.demand_id}/agendar`
    }
  }

  if (typeof payload?.href === 'string') {
    return payload.href
  }

  if (
    type === 'agendamento_confirmado'
    || type.includes('agendamento')
    || type.includes('remarcacao')
    || type.includes('sub_')
  ) {
    if (typeof payload?.demand_id === 'string') {
      return `/profissional/demandas/${payload.demand_id}`
    }
    return '/profissional/agenda'
  }

  if (typeof payload?.demand_id === 'string') {
    return `/profissional/demandas/${payload.demand_id}`
  }

  if (typeof payload?.patient_id === 'string') {
    return `/profissional/pacientes/${payload.patient_id}`
  }

  if (typeof payload?.session_id === 'string') {
    return '/profissional/agenda'
  }

  return null
}
