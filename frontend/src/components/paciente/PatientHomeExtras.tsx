import { Link } from 'react-router-dom'
import { ChevronRight, Pill } from 'lucide-react'

export function PatientHomeLarsanaPillTeaser() {
  return (
    <Link
      to="/paciente/larsanapill"
      className="group block rounded-xl border border-border bg-card overflow-hidden transition-colors hover:bg-muted/30"
    >
      <div className="flex items-stretch gap-0">
        <div className="flex w-16 shrink-0 items-center justify-center bg-primary sm:w-20">
          <Pill className="size-7 text-primary-foreground" />
        </div>
        <div className="min-w-0 flex-1 px-4 py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Em breve</p>
          <p className="mt-0.5 font-medium text-foreground line-clamp-2">LarsanaPill</p>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            Protocolo, orientações e materiais práticos para o seu dia a dia.
          </p>
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
