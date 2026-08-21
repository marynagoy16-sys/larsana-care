import { useLocation, Link } from 'react-router-dom'
import { Construction } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getPageTitle } from '@/config/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getAppHomePathForRole } from '@/lib/native/routing'
import { COMING_SOON_BADGE } from '@/config/navigation'

export function ComingSoonPage() {
  const location = useLocation()
  const { role } = useAuth()
  const title = getPageTitle(location.pathname)
  const homePath = role ? getAppHomePathForRole(role) : '/login'

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center">
          <div className="w-14 h-14 rounded-full bg-primary/15 dark:bg-brand-dark/50 flex items-center justify-center mb-2">
            <Construction className="h-7 w-7 text-primary dark:text-brand-light" />
          </div>
          <Badge variant="muted" className="mb-2">{COMING_SOON_BADGE}</Badge>
          <CardTitle className="font-display">{title}</CardTitle>
          <CardDescription>
            Esta funcionalidade estará disponível em breve.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Estamos construindo o ecossistema LarsanaCare. Em breve você terá acesso completo a esta área.
          </p>
          <Button asChild className="w-full uppercase tracking-widest">
            <Link to={homePath}>Voltar ao início</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
