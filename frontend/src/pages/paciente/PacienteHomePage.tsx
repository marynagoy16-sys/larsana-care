import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { CrudListPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { PageHeader } from '@/components/layout/PageHeader'
import { Logo } from '@/components/shared/Logo'
import { PatientActiveTreatmentCard } from '@/components/paciente/PatientActiveTreatmentCard'
import { PatientHomeBanner } from '@/components/paciente/PatientHomeBanner'
import { PatientHomeServiceRequestCard } from '@/components/paciente/PatientHomeServiceRequestCard'
import { PatientHomeSchedulingBanner } from '@/components/paciente/PatientHomeSchedulingBanner'
import { PatientHomeHelpLink, PatientHomeLarsanaPillTeaser } from '@/components/paciente/PatientHomeExtras'
import { PatientHomeJourney } from '@/components/paciente/PatientHomeJourney'
import { PatientHomeKpiRow } from '@/components/paciente/PatientHomeKpiRow'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { loadPatientHome, patientPortalQueryKeys } from '@/services/patientPortal'

function PatientHomeHeaderLogo() {
  return <Logo layout="horizontal" adaptToTheme style="v1" size="xs" />
}

function HomeSectionTitle({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <div className={cn('flex items-center gap-3', action && 'justify-between')}>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {action}
    </div>
  )
}

export function PacienteHomePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: patientPortalQueryKeys.home,
    queryFn: loadPatientHome,
  })

  if (isLoading) {
    return (
      <>
        <PageHeader>
          <PatientHomeHeaderLogo />
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
          <PatientHomeHeaderLogo />
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
          <PatientHomeHeaderLogo />
        </PageHeader>
        <CrudScrollPageLayout>
          <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
            <p className="font-medium">Complete seu cadastro para continuar</p>
            <p className="text-sm text-muted-foreground">
              Precisamos do endereço e telefone para encontrar um profissional parceiro na sua região.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/paciente/onboarding">Completar cadastro</Link>
            </Button>
          </div>
        </CrudScrollPageLayout>
      </>
    )
  }

  const { activeCycle, latestAssessment, linkedPatient, serviceRequest } = data
  const hasOpenServiceRequest = Boolean(serviceRequest)

  const sidebarContent = (
    <>
      {(latestAssessment || activeCycle) && <PatientHomeJourney context={data} />}
      <PatientHomeLarsanaPillTeaser patientId={linkedPatient.patientId} />
    </>
  )

  return (
    <>
      <PageHeader>
        <PatientHomeHeaderLogo />
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="w-full space-y-5 pb-6 lg:max-w-none lg:space-y-6 lg:pb-8">
          {(data.pendingProposal || data.pendingCharge) && (
            <CascadeItem>
              <PatientHomeBanner context={data} />
            </CascadeItem>
          )}

          {serviceRequest && (
            <CascadeItem>
              <PatientHomeServiceRequestCard serviceRequest={serviceRequest} />
            </CascadeItem>
          )}

          <CascadeItem>
            <PatientHomeSchedulingBanner />
          </CascadeItem>

          <CascadeItem className="hidden lg:block">
            <PatientHomeKpiRow context={data} />
          </CascadeItem>

          <CascadeItem className="space-y-3">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_min(20rem,32%)] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="min-w-0 space-y-3">
                <HomeSectionTitle
                  title="Seu tratamento"
                  action={
                    <Button variant="ghost" size="sm" className="h-auto px-0 text-primary" asChild>
                      <Link to="/paciente/tratamento">
                        Ver tratamento
                        <ChevronRight className="ml-0.5 h-4 w-4" />
                      </Link>
                    </Button>
                  }
                />

                {!data.pendingProposal && !data.pendingCharge && !latestAssessment && !activeCycle && !hasOpenServiceRequest && (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-6 text-sm text-muted-foreground text-center">
                    Em breve você verá aqui o andamento do tratamento e avisos importantes.
                  </div>
                )}

                {activeCycle && (
                  <PatientActiveTreatmentCard
                    cycle={activeCycle}
                    professionalNameFallback={linkedPatient.professionalName}
                    featured
                  />
                )}
              </div>

              <div className="hidden min-w-0 flex-col gap-6 lg:flex">{sidebarContent}</div>
            </div>
          </CascadeItem>

          <CascadeItem className="space-y-3 lg:hidden">{sidebarContent}</CascadeItem>

          <CascadeItem>
            <PatientHomeHelpLink />
          </CascadeItem>
        </CascadeReveal>
      </CrudScrollPageLayout>
    </>
  )
}
