import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { getHomePathForRole } from '@/types/auth'

export function NotFoundPage() {
  const { role } = useAuth()
  const homePath = role ? getHomePathForRole(role) : '/login'

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
      <p className="font-display text-6xl font-bold text-primary">404</p>
      <h1 className="font-display text-xl font-bold">Página não encontrada</h1>
      <p className="text-muted-foreground text-sm max-w-sm">
        A página que você procura não existe ou foi movida.
      </p>
      <Button asChild>
        <Link to={homePath}>Ir para o início</Link>
      </Button>
    </div>
  )
}
