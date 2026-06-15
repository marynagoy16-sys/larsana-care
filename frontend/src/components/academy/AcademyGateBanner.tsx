import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AcademyGateBannerProps {
  message: string
}

export function AcademyGateBanner({ message }: AcademyGateBannerProps) {
  return (
    <Card className="border-primary/30 bg-muted/50">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm">{message}</p>
        </div>
        <Button asChild className="rounded-full shrink-0">
          <Link to="/profissional/academy">Ir para Academy</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
