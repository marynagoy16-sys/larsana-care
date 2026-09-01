import { usePageFooter } from '@/contexts/PageFooterContext'
import { BottomNav } from '@/components/layout/BottomNav'
import { usePatientChatUnreadCount } from '@/hooks/usePatientChatUnreadCount'
import type { NavItem } from '@/config/navigation'

interface ShellBottomNavProps {
  items: NavItem[]
  fabIndex?: number
  showChatUnreadBadge?: boolean
}

export function ShellBottomNav({ items, fabIndex, showChatUnreadBadge = false }: ShellBottomNavProps) {
  const { suppressBottomNav, bottomNavCollapsed } = usePageFooter()
  const { data: chatUnread = 0 } = usePatientChatUnreadCount(showChatUnreadBadge)

  if (suppressBottomNav) return null

  const badgeCounts =
    showChatUnreadBadge && chatUnread > 0 ? { '/paciente/chat': chatUnread } : undefined

  return (
    <BottomNav
      items={items}
      fabIndex={fabIndex}
      collapsed={bottomNavCollapsed}
      badgeCounts={badgeCounts}
    />
  )
}
