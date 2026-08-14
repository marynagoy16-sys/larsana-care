import { useQuery } from '@tanstack/react-query'
import { getUnreadNotificationsCount, notificationsQueryKeys } from '@/services/notifications'

export function useUnreadNotificationsCount(enabled = true) {
  return useQuery({
    queryKey: notificationsQueryKeys.unreadCount,
    queryFn: getUnreadNotificationsCount,
    enabled,
    staleTime: 30_000,
  })
}
