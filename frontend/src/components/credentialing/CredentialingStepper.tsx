import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CREDENTIALING_STEPS, type CredentialingStepId, type StepCompletion } from '@/lib/credentialingModel'

type Props = {
  currentStep: CredentialingStepId
  completion: StepCompletion
  onStepClick?: (step: CredentialingStepId) => void
  variant?: 'pills' | 'sidebar'
}

export function CredentialingStepper({
  currentStep,
  completion,
  onStepClick,
  variant = 'pills',
}: Props) {
  if (variant === 'sidebar') {
    return (
      <nav aria-label="Etapas do credenciamento" className="flex flex-col">
        {CREDENTIALING_STEPS.map((step, index) => {
          const isActive = step.id === currentStep
          const isDone = completion[step.id]
          const isLast = index === CREDENTIALING_STEPS.length - 1

          return (
            <div key={step.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    isActive && 'bg-primary text-primary-foreground shadow-sm',
                    !isActive && isDone && 'bg-primary/20 text-primary',
                    !isActive && !isDone && 'bg-muted text-muted-foreground',
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}
                </span>
                {!isLast && (
                  <div
                    className={cn(
                      'my-1 w-0.5 flex-1 min-h-3 rounded-full',
                      isDone ? 'bg-primary/50' : 'bg-border',
                    )}
                    aria-hidden
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => onStepClick?.(step.id)}
                className={cn(
                  'mb-3 flex flex-1 items-center rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                  isActive && 'bg-primary/10 font-medium text-primary',
                  !isActive && isDone && 'text-primary hover:bg-primary/5',
                  !isActive && !isDone && 'text-muted-foreground hover:bg-muted',
                )}
              >
                {step.label}
              </button>
            </div>
          )
        })}
      </nav>
    )
  }

  return (
    <nav aria-label="Etapas do credenciamento" className="flex items-center overflow-x-auto pb-0.5">
      {CREDENTIALING_STEPS.map((step, index) => {
        const isActive = step.id === currentStep
        const isDone = completion[step.id]
        const isLast = index === CREDENTIALING_STEPS.length - 1

        return (
          <div key={step.id} className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={() => onStepClick?.(step.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                isActive && 'bg-primary text-primary-foreground shadow-sm',
                !isActive && isDone && 'bg-primary/15 text-primary',
                !isActive && !isDone && 'bg-muted text-muted-foreground',
                onStepClick ? 'cursor-pointer hover:opacity-90' : 'cursor-default',
              )}
            >
              {isDone && (
                <Check
                  className={cn('h-3 w-3 shrink-0', isActive ? 'text-primary-foreground' : 'text-primary')}
                  aria-hidden
                />
              )}
              {step.label}
            </button>
            {!isLast && (
              <div
                className={cn(
                  'mx-1.5 h-0.5 w-4 shrink-0 rounded-full sm:w-6',
                  isDone ? 'bg-primary/50' : 'bg-border',
                )}
                aria-hidden
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}

export function CredentialingStepHint({
  step,
  readOnly,
  asTitle,
}: {
  step: CredentialingStepId
  readOnly?: boolean
  asTitle?: boolean
}) {
  const hints: Record<CredentialingStepId, string> = {
    dados: readOnly
      ? 'Dados pessoais e profissionais cadastrados.'
      : 'Informe seus dados pessoais e profissionais.',
    categorias: readOnly
      ? 'Categorias técnicas de atendimento selecionadas.'
      : 'Selecione as categorias técnicas de atendimento e, se aplicável, solicite habilitação Cardiorrespiratória.',
    conselho: readOnly
      ? 'Registro no conselho profissional.'
      : 'Registre seu conselho profissional (CREFITO ou COREN).',
    documentos: readOnly
      ? 'Documentos enviados no credenciamento.'
      : 'Envie RG/CNH, carteirinha do conselho e antecedentes criminais.',
    banco: readOnly
      ? 'Dados bancários para repasses.'
      : 'Informe conta bancária e chave PIX para repasses.',
    contrato: readOnly
      ? 'Termos aceitos e contrato LRS-PROF.'
      : 'Leia e aceite os termos e o contrato LRS-PROF para enviar à Larsana.',
  }

  const label = CREDENTIALING_STEPS.find((s) => s.id === step)?.label ?? step

  if (asTitle) {
    return (
      <div>
        <h3 className="font-display text-lg font-semibold">{label}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{hints[step]}</p>
      </div>
    )
  }

  return (
    <p className="text-sm text-muted-foreground">
      Etapa atual: <strong className="text-foreground">{label}</strong>. {hints[step]}
    </p>
  )
}
