import { PacienteSubpageBackButton } from '@/components/paciente/PacienteSubpageShell'
import { PageHeader } from '@/components/layout/PageHeader'

interface PPAccountSubpageHeaderProps {
  title: string
  loading?: boolean
}

export function PPAccountSubpageHeader({ title, loading }: PPAccountSubpageHeaderProps) {
  return (
    <PageHeader loading={loading}>
      <div className="flex items-center gap-3 min-w-0">
        <PacienteSubpageBackButton backTo="/profissional/conta" />
        <h1 className="font-display font-bold text-xl truncate">{title}</h1>
      </div>
    </PageHeader>
  )
}
