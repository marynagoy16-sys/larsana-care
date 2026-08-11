import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'

type PacienteSubpageShellProps = {
  children: ReactNode
  backTo?: string
  onBack?: () => void
  loading?: boolean
}

export function PacienteSubpageBackButton({ backTo = '/paciente/conta', onBack }: { backTo?: string; onBack?: () => void }) {
  const navigate = useNavigate()

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 gap-1 px-2 text-primary hover:text-primary"
      onClick={onBack ?? (() => navigate(backTo))}
    >
      <ChevronLeft className="size-5" />
      Voltar
    </Button>
  )
}

export function PacienteSubpageShell({ children, backTo, onBack, loading }: PacienteSubpageShellProps) {
  return (
    <>
      <PageHeader loading={loading}>
        <PacienteSubpageBackButton backTo={backTo} onBack={onBack} />
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
