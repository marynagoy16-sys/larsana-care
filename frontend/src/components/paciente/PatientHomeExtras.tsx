import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Pill } from 'lucide-react'
import {
  getPatientHomeLarsanaPillTeaser,
  patientHomeLarsanaPillQueryKeys,
  patientHomeLarsanaPillTeaserHref,
} from '@/services/larsanapill'

type PatientHomeLarsanaPillTeaserProps = {
  patientId: string
}

export function PatientHomeLarsanaPillTeaser({ patientId }: PatientHomeLarsanaPillTeaserProps) {
  const { data: teaser, isLoading } = useQuery({
    queryKey: patientHomeLarsanaPillQueryKeys.teaser(patientId),
    queryFn: () => getPatientHomeLarsanaPillTeaser(patientId),
    enabled: !!patientId,
  })

  if (isLoading || !teaser) return null

  const href = patientHomeLarsanaPillTeaserHref(teaser)

  return (
    <Link
      to={href}
      className="group block rounded-xl border border-border bg-card overflow-hidden transition-colors hover:bg-muted/30"
    >
      <div className="flex items-stretch gap-0">
        <div className="flex w-16 shrink-0 items-center justify-center bg-primary sm:w-20">
          <Pill className="size-7 text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1 px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{teaser.eyebrow}</p>
          <p className="mt-0.5 font-medium text-foreground line-clamp-2">{teaser.title}</p>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{teaser.subtitle}</p>
          {teaser.progressPercent != null && teaser.progressPercent > 0 ? (
            <div className="mt-2.5 h-1.5 max-w-[12rem] overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${teaser.progressPercent}%` }}
              />
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center pr-3 text-muted-foreground group-hover:text-primary">
          <ChevronRight className="size-5" />
        </div>
      </div>
    </Link>
  )
}

export function PatientHomeHelpLink() {
  return (
    <p className="text-center pt-2">
      <Link
        to="/paciente/ajuda"
        className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
      >
        Precisa de ajuda?
      </Link>
    </p>
  )
}
