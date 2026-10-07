import { useCallback, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { SchedulingAvailabilityInstructions, SchedulingAvailabilityWizard, formatAvailabilitySlotLabel } from '@/components/scheduling/SchedulingAvailabilityWizard'
import { useSuppressBottomNav } from '@/contexts/PageFooterContext'
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { cn } from '@/lib/utils'
import { demandsService } from '@/services/demands'
import { registerFixedCycleSchedule, submitPpAvailability } from '@/services/scheduling'

export function PPDemandSchedulePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const sidebarCollapsed = useSidebarCollapsed()
  const goBack = () => navigate(`/profissional/demandas/${id}`)

  const getSelectedSlotsRef = useRef<(() => { starts_at: string; ends_at?: string }[]) | null>(null)
  const [selectedCount, setSelectedCount] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingSlots, setPendingSlots] = useState<{ starts_at: string; ends_at?: string }[]>([])

  const handleSelectionChange = useCallback((count: number) => {
    setSelectedCount((current) => (current === count ? current : count))
  }, [])

  useSuppressBottomNav(true)

  const { data: demand, isLoading } = useQuery({
    queryKey: ['pp', 'demand_detail', id],
    queryFn: () => demandsService.getDetail(id!),
    enabled: !!id,
  })

  const isFixedSchedule = demand?.demand_type === 'continuidade'

  const submitMutation = useCrudMutation({
    mutationFn: async (slots: { starts_at: string; ends_at?: string }[]) => {
      if (!id) throw new Error('Demanda não encontrada')
      if (demand?.demand_type === 'continuidade') return registerFixedCycleSchedule(id, slots)
      await submitPpAvailability(id, slots)
      return { scheduled: slots.length }
    },
    queryKey: ['pp', 'demands'],
    successMessage: isFixedSchedule ? 'Horários fixos registrados' : 'Horários enviados ao paciente',
    onSuccess: () => {
      if (demand?.demand_type === 'continuidade') {
        navigate('/profissional/agenda')
        return
      }
      navigate(`/profissional/pacientes/${demand?.patient_id}`)
    },
  })

  const handleSubmit = () => {
    const slots = getSelectedSlotsRef.current?.() ?? []
    if (slots.length === 0) return
    setPendingSlots(slots)
    setConfirmOpen(true)
  }

  const handleConfirmSubmit = () => {
    submitMutation.mutate(pendingSlots)
    setConfirmOpen(false)
  }

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
          <p className="p-6 text-muted-foreground">Demanda não encontrada.</p>
        </CrudScrollPageLayout>
      </>
    )
  }

  const weeklyTarget = Math.min(
    3,
    Math.max(1, Math.round(Number(demand.patients?.suggested_weekly_frequency ?? 2))),
  )
  const slotLimit = demand.demand_type === 'continuidade' ? weeklyTarget : undefined
  const periodHint = demand.patients?.attendance_period
    ? ` Preferência informada pelo paciente: ${demand.patients.attendance_period}.`
    : ''

  return (
    <>
      <PageHeader>
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 rounded-xl" aria-label="Voltar">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="truncate font-display text-xl font-bold">Agendar atendimento</h1>
        </div>
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="space-y-4 pb-28 sm:pb-32">
          <CascadeItem>
            <SchedulingAvailabilityInstructions demandType={demand.demand_type} />
          </CascadeItem>
          <CascadeItem>
            {periodHint ? (
              <p className="text-sm text-muted-foreground">{periodHint}</p>
            ) : null}
            <SchedulingAvailabilityWizard
              demandType={demand.demand_type}
              maxSlots={slotLimit}
              getSelectedSlotsRef={getSelectedSlotsRef}
              onSelectionChange={handleSelectionChange}
            />
          </CascadeItem>
        </CascadeReveal>
      </CrudScrollPageLayout>

      <div
        className={cn(
          'fixed bottom-0 right-0 z-50 border-t border-border bg-background/95 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur supports-[backdrop-filter]:bg-background/90',
          'left-0 lg:transition-[left] lg:duration-300 lg:ease-in-out',
          sidebarCollapsed ? 'lg:left-[var(--sidebar-width-collapsed)]' : 'lg:left-[var(--sidebar-width)]',
        )}
      >
        <div className="shell-content-x py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-xs text-muted-foreground sm:text-left">
              {slotLimit != null ? `${selectedCount}/${slotLimit} selecionados` : `${selectedCount} horário(s) selecionado(s)`}
            </p>
            <Button
              type="button"
              className="h-12 w-full sm:w-auto sm:min-w-[15rem]"
              disabled={
                submitMutation.isPending
                || (slotLimit != null ? selectedCount !== slotLimit : selectedCount === 0)
              }
              onClick={handleSubmit}
            >
              {submitMutation.isPending
                ? 'Salvando...'
                : slotLimit != null
                  ? 'Registrar na agenda'
                  : 'Enviar opções ao paciente'}
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-xl px-4 py-5 sm:w-full sm:px-6">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle>Confirmar horários disponíveis?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left text-sm text-muted-foreground">
                <p>Revise os horários selecionados antes de enviar ao paciente:</p>
                <ul className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border bg-muted/40 px-3 py-2 text-foreground">
                  {pendingSlots.map((slot) => (
                    <li key={slot.starts_at} className="text-sm">
                      {formatAvailabilitySlotLabel(slot.starts_at)}
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row-reverse sm:justify-end">
            <AlertDialogAction
              disabled={submitMutation.isPending}
              className="mt-0 w-full sm:w-auto"
              onClick={(event) => {
                event.preventDefault()
                handleConfirmSubmit()
              }}
            >
              {submitMutation.isPending ? 'Enviando…' : 'Confirmar envio'}
            </AlertDialogAction>
            <AlertDialogCancel disabled={submitMutation.isPending} className="mt-0 w-full sm:w-auto">
              Voltar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
