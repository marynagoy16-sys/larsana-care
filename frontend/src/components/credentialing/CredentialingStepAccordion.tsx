import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCredentialingStepDescription } from '@/components/credentialing/CredentialingStepper'
import {
  CREDENTIALING_STEPS,
  type CredentialingStepId,
  type StepCompletion,
} from '@/lib/credentialingModel'
import { scrollAccordionCardIntoView } from '@/lib/scrollIntoReadableArea'
import { cn } from '@/lib/utils'

const collapseTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }

type CredentialingStepAccordionProps = {
  currentStep: CredentialingStepId
  completion: StepCompletion
  readOnly: boolean
  editable: boolean
  isLastStep: boolean
  stepIndex: number
  saving: boolean
  submitting: boolean
  onStepChange: (step: CredentialingStepId) => void
  onGoBack: () => void
  onGoNext: () => void
  onSubmit: () => void
  renderStep: (stepId: CredentialingStepId) => ReactNode
}

export function CredentialingStepAccordion({
  currentStep,
  completion,
  readOnly,
  editable,
  isLastStep,
  stepIndex,
  saving,
  submitting,
  onStepChange,
  onGoBack,
  onGoNext,
  onSubmit,
  renderStep,
}: CredentialingStepAccordionProps) {
  const [openStep, setOpenStep] = useState<CredentialingStepId | null>(currentStep)
  const cardRefs = useRef<Partial<Record<CredentialingStepId, HTMLDivElement | null>>>({})
  const skipInitialScroll = useRef(true)

  useEffect(() => {
    setOpenStep(currentStep)
  }, [currentStep])

  useEffect(() => {
    if (!openStep) return
    if (skipInitialScroll.current) {
      skipInitialScroll.current = false
      return
    }
    const timer = window.setTimeout(() => {
      const card = cardRefs.current[openStep]
      if (card) scrollAccordionCardIntoView(card)
    }, collapseTransition.duration * 1000 + 32)
    return () => window.clearTimeout(timer)
  }, [openStep])

  const toggleStep = (stepId: CredentialingStepId) => {
    if (openStep === stepId) {
      setOpenStep(null)
      return
    }
    setOpenStep(stepId)
    onStepChange(stepId)
  }

  return (
    <div className="space-y-3">
      {CREDENTIALING_STEPS.map((step, index) => {
        const isOpen = openStep === step.id
        const isDone = completion[step.id]
        const isActive = currentStep === step.id

        return (
          <div
            key={step.id}
            ref={(node) => {
              cardRefs.current[step.id] = node
            }}
            className={cn(
              'rounded-xl border bg-card overflow-hidden transition-colors scroll-mt-3',
              isOpen ? 'border-primary/30 shadow-sm' : 'border-border',
              isDone && !isOpen && 'border-primary/15',
            )}
          >
            <button
              type="button"
              onClick={() => toggleStep(step.id)}
              className={cn(
                'flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors',
                isOpen ? 'bg-primary/5' : 'hover:bg-muted/20 active:bg-muted/30',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  isDone && 'bg-primary/15 text-primary',
                  !isDone && isActive && 'bg-primary text-primary-foreground',
                  !isDone && !isActive && 'bg-muted text-muted-foreground',
                )}
              >
                {isDone ? <Check className="size-3.5" aria-hidden /> : index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={cn('text-sm font-semibold', isDone ? 'text-primary' : 'text-foreground')}>
                    {step.label}
                  </p>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      isDone
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {isDone ? 'Concluído' : 'Pendente'}
                  </span>
                </div>
                {!isOpen ? (
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {getCredentialingStepDescription(step.id, readOnly)}
                  </p>
                ) : null}
              </div>

              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={collapseTransition}
                className="inline-flex shrink-0 mt-0.5"
              >
                <ChevronDown className="size-4 text-muted-foreground" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={collapseTransition}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border px-4 py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {getCredentialingStepDescription(step.id, readOnly)}
                    </p>
                    {renderStep(step.id)}

                    {editable && isActive ? (
                      <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                        <Button type="button" variant="ghost" disabled={stepIndex === 0} onClick={onGoBack}>
                          Voltar
                        </Button>
                        {isLastStep ? (
                          <Button type="button" disabled={submitting} onClick={onSubmit}>
                            {submitting ? 'Enviando…' : 'Enviar para aprovação'}
                          </Button>
                        ) : (
                          <Button type="button" disabled={saving} onClick={onGoNext}>
                            {saving ? 'Salvando…' : 'Próximo'}
                          </Button>
                        )}
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
