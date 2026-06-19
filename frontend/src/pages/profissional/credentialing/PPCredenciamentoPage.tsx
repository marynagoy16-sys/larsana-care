import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CredentialingStatusBanner } from '@/components/credentialing/CredentialingStatusBanner'
import { CredentialingStepHint, CredentialingStepper } from '@/components/credentialing/CredentialingStepper'
import { DadosStepForm } from '@/components/credentialing/steps/DadosStepForm'
import { ConselhoStepForm } from '@/components/credentialing/steps/ConselhoStepForm'
import {
  DocumentosStepForm,
  isDocumentosStepValid,
} from '@/components/credentialing/steps/DocumentosStepForm'
import { BancoStepForm } from '@/components/credentialing/steps/BancoStepForm'
import { ContratoStepForm } from '@/components/credentialing/steps/ContratoStepForm'
import {
  CREDENTIALING_STEPS,
  computeStepCompletion,
  isCredentialingEditable,
  resolveCurrentStep,
  type CredentialingStepId,
} from '@/lib/credentialingModel'
import {
  acceptContratoAndSubmit,
  credentialingQueryKeys,
  loadCredentialingSnapshot,
  loadPpLegalTermsForContrato,
  removeProfessionalDocument,
  saveBancoStep,
  saveConselhoStep,
  saveDadosStep,
  stepHasPersistedSave,
  uploadProfessionalDocument,
} from '@/services/credentialing'
import { useImmersiveLayout } from '@/contexts/ImmersiveLayoutContext'
import { toast } from 'sonner'
import type { ContratoAcceptValues } from '@/schemas/credentialing'

export function PPCredenciamentoPage() {
  const queryClient = useQueryClient()
  const { setFixedMain } = useImmersiveLayout()
  const [step, setStep] = useState<CredentialingStepId>('dados')
  const [uploadingType, setUploadingType] = useState<string | null>(null)

  useEffect(() => {
    setFixedMain(true)
    return () => setFixedMain(false)
  }, [setFixedMain])

  const snapshotQuery = useQuery({
    queryKey: credentialingQueryKeys.snapshot,
    queryFn: loadCredentialingSnapshot,
  })

  const legalTermsQuery = useQuery({
    queryKey: [...credentialingQueryKeys.snapshot, 'legal-terms'],
    queryFn: loadPpLegalTermsForContrato,
    enabled: step === 'contrato',
  })

  const snapshot = snapshotQuery.data
  const status = snapshot?.professional.credentialing_status ?? 'rascunho'
  const editable = isCredentialingEditable(status)
  const readOnly = !editable

  const completion = useMemo(
    () => (snapshot ? computeStepCompletion(snapshot) : null),
    [snapshot],
  )

  useEffect(() => {
    if (completion && editable) {
      setStep(resolveCurrentStep(completion))
    }
  }, [completion, editable])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: credentialingQueryKeys.snapshot })
  }

  const saveMutation = useMutation({
    mutationFn: async ({ stepId, values }: { stepId: CredentialingStepId; values: unknown }) => {
      if (stepId === 'dados') await saveDadosStep(values as Parameters<typeof saveDadosStep>[0])
      if (stepId === 'conselho') await saveConselhoStep(values as Parameters<typeof saveConselhoStep>[0])
      if (stepId === 'banco') await saveBancoStep(values as Parameters<typeof saveBancoStep>[0])
    },
    onSuccess: () => {
      invalidate()
      toast.success('Dados salvos')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const submitMutation = useMutation({
    mutationFn: acceptContratoAndSubmit,
    onSuccess: (result) => {
      invalidate()
      toast.success(
        result.contractNumber
          ? `Enviado para aprovação · ${result.contractNumber}`
          : 'Credenciamento enviado para aprovação',
      )
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const stepIndex = CREDENTIALING_STEPS.findIndex((s) => s.id === step)
  const isLastStep = stepIndex === CREDENTIALING_STEPS.length - 1

  const goNext = async () => {
    if (readOnly) {
      if (stepIndex < CREDENTIALING_STEPS.length - 1) {
        setStep(CREDENTIALING_STEPS[stepIndex + 1].id)
      }
      return
    }

    if (step === 'documentos') {
      if (!snapshot || !isDocumentosStepValid(snapshot)) {
        toast.error('Envie todos os documentos obrigatórios')
        return
      }
      if (stepIndex < CREDENTIALING_STEPS.length - 1) {
        setStep(CREDENTIALING_STEPS[stepIndex + 1].id)
      }
      return
    }

    if (stepHasPersistedSave(step)) {
      const form = document.getElementById('credentialing-step-form') as HTMLFormElement | null
      form?.requestSubmit()
      return
    }

    if (stepIndex < CREDENTIALING_STEPS.length - 1) {
      setStep(CREDENTIALING_STEPS[stepIndex + 1].id)
    }
  }

  const goBack = () => {
    if (stepIndex > 0) setStep(CREDENTIALING_STEPS[stepIndex - 1].id)
  }

  const handleStepSave = async (values: unknown) => {
    await saveMutation.mutateAsync({ stepId: step, values })
    if (stepIndex < CREDENTIALING_STEPS.length - 1) {
      setStep(CREDENTIALING_STEPS[stepIndex + 1].id)
    }
  }

  const handleContratoSubmit = async (_values: ContratoAcceptValues) => {
    await submitMutation.mutateAsync()
  }

  const renderStepContent = () => {
    if (!snapshot) return null

    switch (step) {
      case 'dados':
        return (
          <DadosStepForm
            key={`dados-${snapshot.professional.id}`}
            snapshot={snapshot}
            disabled={readOnly}
            onSubmit={(values) => handleStepSave(values)}
          />
        )
      case 'conselho':
        return (
          <ConselhoStepForm
            key={`conselho-${snapshot.council?.registration_number ?? 'empty'}`}
            snapshot={snapshot}
            disabled={readOnly}
            onSubmit={(values) => handleStepSave(values)}
          />
        )
      case 'documentos':
        return (
          <DocumentosStepForm
            snapshot={snapshot}
            disabled={readOnly}
            uploadingType={uploadingType}
            onUpload={async (file, type) => {
              setUploadingType(type)
              try {
                await uploadProfessionalDocument(file, type)
                invalidate()
                toast.success('Documento enviado')
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Erro ao enviar')
              } finally {
                setUploadingType(null)
              }
            }}
            onRemove={async (id) => {
              try {
                await removeProfessionalDocument(id)
                invalidate()
                toast.success('Documento removido')
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Erro ao remover')
              }
            }}
          />
        )
      case 'banco':
        return (
          <BancoStepForm
            key={`banco-${snapshot.bank?.account_number ?? 'empty'}`}
            snapshot={snapshot}
            disabled={readOnly}
            onSubmit={(values) => handleStepSave(values)}
          />
        )
      case 'contrato':
        return (
          <ContratoStepForm
            key={`contrato-${snapshot.contract?.contract_number ?? 'none'}-${snapshot.acceptedTermTypes.join(',')}`}
            snapshot={snapshot}
            legalTerms={legalTermsQuery.data ?? []}
            disabled={readOnly || submitMutation.isPending}
            onSubmit={handleContratoSubmit}
          />
        )
      default:
        return null
    }
  }

  if (snapshotQuery.isLoading) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Carregando credenciamento…</p>
      </div>
    )
  }

  if (!snapshot || !completion) {
    return (
      <div className="flex h-full min-h-0 items-center p-6">
        <p className="text-muted-foreground">Perfil profissional não encontrado. Entre em contato com a Larsana.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col pb-[var(--shell-gap)] pr-[var(--shell-gap)] lg:flex-row">
      {/* Sidebar */}
      <aside className="flex shrink-0 flex-col gap-4 border-b bg-muted/10 p-4 lg:w-72 lg:border-b-0 lg:border-r lg:p-5">
        <CredentialingStatusBanner snapshot={snapshot} compact />

        <div className="lg:hidden">
          <CredentialingStepper
            currentStep={step}
            completion={completion}
            onStepClick={setStep}
            variant="pills"
          />
        </div>

        <div className="hidden min-h-0 flex-1 flex-col lg:flex">
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Etapas
          </p>
          <CredentialingStepper
            currentStep={step}
            completion={completion}
            onStepClick={setStep}
            variant="sidebar"
          />
        </div>
      </aside>

      {/* Painel direito — header/footer fixos, corpo scrollável */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-card">
        <header className="shrink-0 border-b bg-muted/20 px-5 py-4 lg:px-8">
          <CredentialingStepHint step={step} readOnly={readOnly} asTitle />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-sidebar px-5 py-5 lg:px-8 lg:py-6">
          {renderStepContent()}

          {editable && Object.values(completion).every(Boolean) && (
            <p className="mt-6 flex items-center gap-2 text-xs text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Todas as etapas preenchidas — revise e envie na etapa Contrato.
            </p>
          )}
        </div>

        {editable && (
          <footer className="flex shrink-0 items-center justify-between gap-4 border-t bg-muted/20 px-5 py-4 lg:px-8">
            <Button type="button" variant="ghost" disabled={stepIndex === 0} onClick={goBack}>
              Voltar
            </Button>
            {isLastStep ? (
              <Button
                type="button"
                disabled={submitMutation.isPending}
                onClick={() => {
                  const form = document.getElementById('credentialing-step-form') as HTMLFormElement | null
                  form?.requestSubmit()
                }}
              >
                {submitMutation.isPending ? 'Enviando…' : 'Enviar para aprovação'}
              </Button>
            ) : (
              <Button
                type="button"
                disabled={saveMutation.isPending}
                onClick={() => void goNext()}
              >
                {saveMutation.isPending ? 'Salvando…' : 'Próximo'}
              </Button>
            )}
          </footer>
        )}
      </section>
    </div>
  )
}
