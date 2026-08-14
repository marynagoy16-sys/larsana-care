import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useUnreadNotificationsCount } from '@/hooks/useUnreadNotificationsCount'

type NotificationBellButtonProps = {
  href: string
}

export function NotificationBellButton({ href }: NotificationBellButtonProps) {
  const { data: unreadCount = 0 } = useUnreadNotificationsCount()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative rounded-lg h-9 w-9 text-muted-foreground hover:text-foreground"
      aria-label={
        unreadCount > 0
          ? `Notificações, ${unreadCount} não lida${unreadCount === 1 ? '' : 's'}`
          : 'Notificações'
      }
      asChild
    >
      <Link to={href}>
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
        ) : null}
      </Link>
    </Button>
  )
}
