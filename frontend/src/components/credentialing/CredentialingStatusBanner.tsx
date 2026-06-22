import { Clock, ShieldCheck } from 'lucide-react'
import { credentialingStatusLabels } from '@/constants/labels'
import {
  isCredentialingActive,
  isCredentialingPendingReview,
  type CredentialingSnapshot,
} from '@/lib/credentialingModel'
import { cn } from '@/lib/utils'

type Props = {
  snapshot: CredentialingSnapshot
  compact?: boolean
  className?: string
}

export function CredentialingStatusBanner({ snapshot, compact, className }: Props) {
  const status = snapshot.professional.credentialing_status

  if (isCredentialingActive(status)) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5',
          compact ? 'gap-2 px-2.5 py-2' : 'p-4',
          className,
        )}
      >
        <ShieldCheck className={cn('shrink-0 text-primary', compact ? 'h-4 w-4' : 'h-5 w-5')} />
        <div className="min-w-0">
          <p className="text-sm font-medium">Parceiro ativo</p>
          <p className="truncate text-xs text-muted-foreground">
            {credentialingStatusLabels.ativo}
            {snapshot.contract?.contract_number && (
              <> · {snapshot.contract.contract_number}</>
            )}
          </p>
        </div>
      </div>
    )
  }

  if (isCredentialingPendingReview(status)) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50',
          compact ? 'gap-2 px-2.5 py-2' : 'p-4',
          className,
        )}
      >
        <Clock className="h-5 w-5 shrink-0 text-amber-700" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-amber-900">Em análise</p>
          <p className="truncate text-xs text-amber-800">
            {credentialingStatusLabels.aguardando_aprovacao}
            {snapshot.contract?.contract_number && (
              <> · {snapshot.contract.contract_number}</>
            )}
          </p>
        </div>
      </div>
    )
  }

  return null
}
