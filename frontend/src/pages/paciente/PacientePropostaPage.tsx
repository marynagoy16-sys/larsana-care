import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeaderSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { PageHeader } from '@/components/layout/PageHeader'
import { useSuppressBottomNav } from '@/contexts/PageFooterContext'
import { PatientProposalSummary } from '@/components/paciente/PatientProposalSummary'
import {
  buildFrequencyDisclaimer,
  PatientWeeklyFrequencyPicker,
} from '@/components/paciente/PatientWeeklyFrequencyPicker'
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
import { Button } from '@/components/ui/button'
import {
  acceptAssessmentProposal,
  assessmentFamilyResponseQueryKeys,
  getPatientProposalPreview,
} from '@/services/assessmentFamilyResponse'
import { loadPatientHome, patientPortalQueryKeys } from '@/services/patientPortal'
import { toast } from 'sonner'

export function PacientePropostaPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [chosenFrequency, setChosenFrequency] = useState<number | null>(null)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [declineOpen, setDeclineOpen] = useState(false)

  const homeQuery = useQuery({
    queryKey: patientPortalQueryKeys.home,
    queryFn: loadPatientHome,
  })

  const pendingAssessment = homeQuery.data?.pendingProposal

  const previewQuery = useQuery({
    queryKey: assessmentFamilyResponseQueryKeys.preview(pendingAssessment?.id ?? ''),
    queryFn: () => getPatientProposalPreview(pendingAssessment!.id),
    enabled: !!pendingAssessment?.id,
  })

  const recommended = previewQuery.data?.proposed_weekly_frequency ?? pendingAssessment?.proposed_weekly_frequency ?? 2
  const selectedFrequency = chosenFrequency ?? recommended

  const hasProposalContent =
    !homeQuery.isLoading
    && !(pendingAssessment && previewQuery.isLoading)
    && !homeQuery.isError
    && !!pendingAssessment
    && !previewQuery.isError
    && !!previewQuery.data

  useSuppressBottomNav(hasProposalContent)

  const acceptMutation = useMutation({
    mutationFn: (response: 'SIM' | 'NAO') =>
      acceptAssessmentProposal({
        assessmentId: pendingAssessment!.id,
        response,
        chosenWeeklyFrequency: response === 'SIM' ? selectedFrequency : undefined,
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: patientPortalQueryKeys.home })
      queryClient.invalidateQueries({ queryKey: ['paciente', 'assessments'] })
      queryClient.invalidateQueries({ queryKey: ['paciente', 'charges'] })
      queryClient.invalidateQueries({ queryKey: ['paciente', 'cycles'] })

      if (result.family_response === 'SIM' && result.charge_id) {
        navigate(`/paciente/pagamentos/${result.charge_id}`)
        return
      }

      toast.info('Proposta recusada. Foi gerada uma cobrança de R$ 50 referente à avaliação.')
      navigate('/paciente')
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Não foi possível registrar sua resposta.')
    },
  })

  const handleAcceptClick = () => {
    if (selectedFrequency < recommended) {
      setDisclaimerOpen(true)
      return
    }
    acceptMutation.mutate('SIM')
  }

  const handleConfirmAccept = () => {
    setDisclaimerOpen(false)
    acceptMutation.mutate('SIM')
  }

  const headerContent = useMemo(
    () => (
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="ghost" size="icon" asChild className="shrink-0 rounded-xl" aria-label="Voltar">
          <Link to="/paciente">
            <ArrowLeft size={20} />
          </Link>
        </Button>
        <h1 className="font-display font-bold text-xl lg:text-2xl truncate">Proposta de tratamento</h1>
      </div>
    ),
    [],
  )

  const loadingHeaderContent = useMemo(() => <PageHeaderSkeleton />, [])

  if (homeQuery.isLoading || (pendingAssessment && previewQuery.isLoading)) {
    return (
      <>
        <PageHeader loading>
          {loadingHeaderContent}
        </PageHeader>
        <CrudScrollPageLayout>
          <div className="animate-pulse space-y-4 p-2">
            <div className="h-40 rounded-xl bg-muted" />
            <div className="h-24 rounded-xl bg-muted" />
          </div>
        </CrudScrollPageLayout>
      </>
    )
  }

  if (homeQuery.isError || !pendingAssessment || previewQuery.isError || !previewQuery.data) {
    return (
      <>
        <PageHeader>{headerContent}</PageHeader>
        <CrudScrollPageLayout>
          <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3">
            <p className="font-medium">Nenhuma proposta pendente</p>
            <p className="text-sm text-muted-foreground">
              Não há proposta aguardando sua resposta no momento.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link to="/paciente">Voltar ao início</Link>
            </Button>
          </div>
        </CrudScrollPageLayout>
      </>
    )
  }

  const preview = previewQuery.data

  return (
    <>
      <PageHeader>{headerContent}</PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="space-y-5 pb-36">
          <CascadeItem>
            <PatientProposalSummary preview={preview} />
          </CascadeItem>

          <CascadeItem>
            <PatientWeeklyFrequencyPicker
              value={selectedFrequency}
              recommended={recommended}
              onChange={setChosenFrequency}
            />
          </CascadeItem>
        </CascadeReveal>
      </CrudScrollPageLayout>

      <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
        <div className="shell-content-x space-y-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            size="lg"
            className="w-full"
            onClick={handleAcceptClick}
            disabled={acceptMutation.isPending}
          >
            Aceitar e pagar
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 hover:border-red-400 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300 dark:hover:bg-red-950/60"
            onClick={() => setDeclineOpen(true)}
            disabled={acceptMutation.isPending}
          >
            Recusar proposta
          </Button>
        </div>
      </div>

      <AlertDialog open={disclaimerOpen} onOpenChange={setDisclaimerOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Frequência menor que a recomendada</AlertDialogTitle>
            <AlertDialogDescription>
              {buildFrequencyDisclaimer(recommended)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAccept} disabled={acceptMutation.isPending}>
              Sim, desejo seguir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recusar proposta?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao recusar, será gerada uma cobrança de R$ 50 referente à avaliação domiciliar, com vencimento em 30 dias.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDeclineOpen(false)
                acceptMutation.mutate('NAO')
              }}
              disabled={acceptMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar recusa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
