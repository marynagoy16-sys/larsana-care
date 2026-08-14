import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { SchedulingAvailabilityWizard } from '@/components/scheduling/SchedulingAvailabilityWizard'
import { demandsService } from '@/services/demands'
import { submitPpAvailability } from '@/services/scheduling'
import { useCrudMutation } from '@/hooks/useCrudMutation'

export function PPDemandSchedulePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const goBack = () => navigate(`/profissional/demandas/${id}`)

  const { data: demand, isLoading } = useQuery({
    queryKey: ['pp', 'demand_detail', id],
    queryFn: () => demandsService.getDetail(id!),
    enabled: !!id,
  })

  const submitMutation = useCrudMutation({
    mutationFn: (slots: { starts_at: string; ends_at?: string }[]) => {
      if (!id) throw new Error('Demanda não encontrada')
      return submitPpAvailability(id, slots)
    },
    queryKey: ['pp', 'demands'],
    successMessage: 'Horários enviados ao paciente',
    onSuccess: () => {
      if (demand?.demand_type === 'continuidade') {
        navigate('/profissional/agenda')
        return
      }
      navigate(`/profissional/pacientes/${demand?.patient_id}`)
    },
  })

  if (isLoading) {
    return (
      <>
        <PageHeader loading>
          <span className="font-display font-bold text-xl">Agendar atendimento</span>
        </PageHeader>
        <CrudScrollPageLayout>
          <DetailPageSkeleton fields={4} />
        </CrudScrollPageLayout>
      </>
    )
  }

  if (!demand) {
    return (
      <>
        <PageHeader>
          <Button variant="ghost" size="icon" onClick={() => navigate('/profissional/demandas')} aria-label="Voltar">
            <ArrowLeft size={20} />
          </Button>
        </PageHeader>
        <CrudScrollPageLayout>
          <p className="text-muted-foreground p-6">Demanda não encontrada.</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="font-display font-bold text-xl truncate">Agendar atendimento</h1>
        </div>
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="pb-8">
          <CascadeItem>
            <SchedulingAvailabilityWizard
              demandType={demand.demand_type}
              isSubmitting={submitMutation.isPending}
              onSubmit={(slots) => submitMutation.mutate(slots)}
            />
          </CascadeItem>
        </CascadeReveal>
      </CrudScrollPageLayout>
    </>
  )
}
