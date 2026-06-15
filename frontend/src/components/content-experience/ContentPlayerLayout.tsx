import { useEffect, type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useImmersiveLayout } from '@/contexts/ImmersiveLayoutContext'
import { cn } from '@/lib/utils'

interface ContentPlayerLayoutProps {
  backHref: string
  backLabel?: string
  children: ReactNode
  isLoading?: boolean
  skeleton?: ReactNode
  className?: string
}

export function ContentPlayerLayout({
  backHref,
  backLabel = 'Voltar',
  children,
  isLoading,
  skeleton,
  className,
}: ContentPlayerLayoutProps) {
  const { setImmersive } = useImmersiveLayout()

  useEffect(() => {
    setImmersive(true)
    return () => setImmersive(false)
  }, [setImmersive])

  if (isLoading) {
    return (
      <div className={cn('flex h-full min-h-0 flex-col', className)}>
        <div className="shrink-0 border-b px-4 py-3">
          <Button variant="ghost" size="sm" className="rounded-full" asChild>
            <Link to={backHref}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              {backLabel}
            </Link>
          </Button>
        </div>
        {skeleton}
      </div>
    )
  }

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)}>
      <div className="shrink-0 border-b px-4 py-3">
        <Button variant="ghost" size="sm" className="rounded-full" asChild>
          <Link to={backHref}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
