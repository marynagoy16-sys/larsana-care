import { Link } from 'react-router-dom'
import { ChevronRight, UserSearch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/formatters'
import type { PatientServiceRequestSummary } from '@/services/patientPortal'

type Props = {
  serviceRequest: PatientServiceRequestSummary
}

export function PatientHomeServiceRequestCard({ serviceRequest }: Props) {
  const { activeDemand, waitlist } = serviceRequest
  const isWaitlistOnly = Boolean(waitlist) && !activeDemand
  const isAllocated = activeDemand?.status === 'alocada' || Boolean(activeDemand?.assigned_professional_id)

  if (isAllocated) return null

  const title = isWaitlistOnly
    ? 'Você está na lista de espera'
    : 'Procurando profissional parceiro'

  const description = isWaitlistOnly
    ? 'Registramos seu interesse. Avisaremos quando houver cobertura na sua região.'
    : 'Estamos buscando um profissional parceiro disponível para iniciar seu atendimento.'

  const createdAt = activeDemand?.created_at ?? waitlist?.created_at

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <UserSearch size={20} className="text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{title}</p>
          {createdAt ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Solicitação em {formatDateTime(createdAt)}
            </p>
          ) : null}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{description}</p>

      <Button asChild variant="outline" size="sm" className="h-9 w-full bg-secondary hover:bg-secondary/80">
        <Link to="/paciente/solicitar">
          Acompanhar solicitação
          <ChevronRight className="ml-0.5 size-4" />
        </Link>
      </Button>
    </div>
  )
}
