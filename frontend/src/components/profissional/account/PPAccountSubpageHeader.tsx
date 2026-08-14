import { SubpageHeaderBar } from '@/components/paciente/PacienteSubpageShell'
import { PageHeader } from '@/components/layout/PageHeader'

interface PPAccountSubpageHeaderProps {
  title: string
  loading?: boolean
}

export function PPAccountSubpageHeader({ title, loading }: PPAccountSubpageHeaderProps) {
  return (
    <PageHeader loading={loading}>
      <SubpageHeaderBar title={title} backTo="/profissional/conta" />
    </PageHeader>
  )
}
