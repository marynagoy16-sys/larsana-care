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
}

export function CredentialingStatusBanner({ snapshot, compact }: Props) {
  const status = snapshot.professional.credentialing_status

  if (isCredentialingActive(status)) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5',
          compact ? 'p-3' : 'p-4',
        )}
      >
        <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
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
          compact ? 'p-3' : 'p-4',
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
