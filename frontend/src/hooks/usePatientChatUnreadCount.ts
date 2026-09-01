import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { getPatientChatUnreadCount, patientChatQueryKeys } from '@/services/patientChat'

export function usePatientChatUnreadCount(enabled = true) {
  const location = useLocation()
  const onChatPage = location.pathname.startsWith('/paciente/chat')

  return useQuery({
    queryKey: patientChatQueryKeys.unreadCount,
    queryFn: getPatientChatUnreadCount,
    enabled: enabled && !onChatPage,
    staleTime: 15_000,
    refetchInterval: onChatPage ? false : 30_000,
  })
}
