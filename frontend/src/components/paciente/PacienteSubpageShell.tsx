import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'

type PacienteSubpageShellProps = {
  children: ReactNode
  title: string
  backTo?: string
  onBack?: () => void
  loading?: boolean
}

export function PacienteSubpageBackButton({ backTo = '/paciente/conta', onBack }: { backTo?: string; onBack?: () => void }) {
  const navigate = useNavigate()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="-ml-2 shrink-0 rounded-xl text-primary hover:text-primary"
      onClick={onBack ?? (() => navigate(backTo))}
      aria-label="Voltar"
    >
      <ChevronLeft className="size-5" />
    </Button>
  )
}

export function SubpageHeaderBar({
  title,
  backTo,
  onBack,
}: {
  title: string
  backTo?: string
  onBack?: () => void
}) {
  return (
    <div className="relative flex w-full min-h-9 items-center justify-center">
      <div className="absolute left-0">
        <PacienteSubpageBackButton backTo={backTo} onBack={onBack} />
      </div>
      <h1 className="max-w-[min(100%,16rem)] truncate px-10 text-center font-display text-xl font-bold leading-tight tracking-tight">
        {title}
      </h1>
    </div>
  )
}

export function PacienteSubpageShell({ children, title, backTo, onBack, loading }: PacienteSubpageShellProps) {
  return (
    <>
      <PageHeader loading={loading}>
        <SubpageHeaderBar title={title} backTo={backTo} onBack={onBack} />
      </PageHeader>
      <CrudScrollPageLayout>{children}</CrudScrollPageLayout>
    </>
  )
}

export function PacienteEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
