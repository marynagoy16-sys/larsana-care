import { usePageFooter } from '@/contexts/PageFooterContext'
import { BottomNav } from '@/components/layout/BottomNav'
import type { NavItem } from '@/config/navigation'

interface ShellBottomNavProps {
  items: NavItem[]
  fabIndex?: number
}

export function ShellBottomNav({ items, fabIndex }: ShellBottomNavProps) {
  const { suppressBottomNav } = usePageFooter()
  if (suppressBottomNav) return null
  return <BottomNav items={items} fabIndex={fabIndex} />
}
