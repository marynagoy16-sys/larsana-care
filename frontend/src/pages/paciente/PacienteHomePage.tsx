import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { CrudListPageSkeleton, PageHeaderSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { PageHeader } from '@/components/layout/PageHeader'
import { PatientActiveTreatmentCard } from '@/components/paciente/PatientActiveTreatmentCard'
import { PatientHomeBanner } from '@/components/paciente/PatientHomeBanner'
import { PatientHomeJourney } from '@/components/paciente/PatientHomeJourney'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { loadPatientHome, patientPortalQueryKeys } from '@/services/patientPortal'

function PatientHomeGreeting({
  responsibleFirstName,
  patientName,
}: {
  responsibleFirstName: string
  patientName?: string
}) {
  return (
    <div className="min-w-0 space-y-0.5">
      <h1 className="font-display font-bold text-2xl lg:text-[1.75rem] leading-tight tracking-tight truncate">
        Olá, {responsibleFirstName}
      </h1>
      {patientName && (
        <p className="text-sm text-muted-foreground truncate">
          Cuidando de <span className="font-medium text-foreground">{patientName}</span>
        </p>
      )}
    </div>
  )
}

export function PacienteHomePage() {
  const { profile } = useAuth()
  const fallbackFirstName = profile?.full_name?.split(' ')[0] ?? 'responsável'

  const { data, isLoading, isError } = useQuery({
    queryKey: patientPortalQueryKeys.home,
    queryFn: loadPatientHome,
  })

  if (isLoading) {
    return (
      <>
        <PageHeader loading>
          <PageHeaderSkeleton />
        </PageHeader>
        <CrudScrollPageLayout>
          <CrudListPageSkeleton showStats={false} tableColumns={0} />
        </CrudScrollPageLayout>
      </>
    )
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader>
          <PatientHomeGreeting responsibleFirstName={fallbackFirstName} />
        </PageHeader>
        <CrudScrollPageLayout>
          <p className="text-muted-foreground p-6">Não foi possível carregar sua página inicial.</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  if (!data.linkedPatient) {
    return (
      <>
        <PageHeader>
          <PatientHomeGreeting responsibleFirstName={fallbackFirstName} />
        </PageHeader>
        <CrudScrollPageLayout>
          <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
            <p className="font-medium">Nenhum paciente vinculado à sua conta</p>
            <p className="text-sm text-muted-foreground">
              Entre em contato com a Larsana para vincular o responsável ao paciente.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/paciente/ajuda">Falar com a Larsana</Link>
            </Button>
          </div>
        </CrudScrollPageLayout>
      </>
    )
  }

  const { linkedPatient, activeCycle, latestAssessment } = data
  const responsibleFirstName = linkedPatient.responsibleName.split(' ')[0]

  return (
    <>
      <PageHeader>
        <PatientHomeGreeting
          responsibleFirstName={responsibleFirstName}
          patientName={linkedPatient.patientName}
        />
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="space-y-5 pb-8">
          <CascadeItem>
            <PatientHomeBanner context={data} />
          </CascadeItem>

        {!data.pendingProposal && !data.pendingCharge && !latestAssessment && (
          <CascadeItem>
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-6 text-sm text-muted-foreground text-center">
              Em breve você verá aqui o andamento do tratamento e avisos importantes.
            </div>
          </CascadeItem>
        )}

        {(latestAssessment || activeCycle) && (
          <CascadeItem>
            <PatientHomeJourney context={data} />
          </CascadeItem>
        )}

        {activeCycle && (
          <CascadeItem>
            <PatientActiveTreatmentCard cycle={activeCycle} />
          </CascadeItem>
        )}
      </CascadeReveal>
    </CrudScrollPageLayout>
    </>
  )
}
