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
      <nav aria-label="Etapas do credenciamento" className="space-y-1">
        {CREDENTIALING_STEPS.map((step, index) => {
          const isActive = step.id === currentStep
          const isDone = completion[step.id]
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick?.(step.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                isActive && 'bg-primary text-primary-foreground shadow-sm',
                !isActive && isDone && 'bg-primary/10 text-primary hover:bg-primary/15',
                !isActive && !isDone && 'text-muted-foreground hover:bg-muted',
              )}
            >
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  isActive && 'bg-primary-foreground/20 text-primary-foreground',
                  !isActive && isDone && 'bg-primary/20 text-primary',
                  !isActive && !isDone && 'bg-muted text-muted-foreground',
                )}
              >
                {isDone && !isActive ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className="font-medium">{step.label}</span>
            </button>
          )
        })}
      </nav>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {CREDENTIALING_STEPS.map((step) => {
        const isActive = step.id === currentStep
        const isDone = completion[step.id]
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onStepClick?.(step.id)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              isActive && 'bg-primary text-primary-foreground',
              !isActive && isDone && 'bg-primary/15 text-primary',
              !isActive && !isDone && 'bg-muted text-muted-foreground',
              onStepClick ? 'cursor-pointer hover:opacity-90' : 'cursor-default',
            )}
          >
            {step.label}
          </button>
        )
      })}
    </div>
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
