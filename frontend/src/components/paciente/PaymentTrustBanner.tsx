import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

type PaymentTrustBannerProps = {
  className?: string
}

export function PaymentTrustBanner({ className }: PaymentTrustBannerProps) {
  return (
    <div className={cn('pt-4', className)}>
      <div
        className={cn(
          'flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 rounded-lg px-3 py-2.5 text-center',
          'bg-muted/50 dark:bg-muted/30',
        )}
      >
        <Lock className="size-3.5 shrink-0 text-muted-foreground" />
        <p className="text-[11px] leading-snug font-medium text-muted-foreground">
          Ambiente seguro e certificado por criptografia SSL
        </p>
      </div>
    </div>
  )
}
