import { useEffect, useMemo, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { legalTermLabel } from '@/constants/legalTerms'
import type { LegalTermType } from '@/constants/legalTerms'
import type { LegalTermRow } from '@/services/legalDocuments'
import { hasAcceptedTermType } from '@/constants/legalTerms'

type Props = {
  title: string
  description?: string
  termTypes: readonly LegalTermType[]
  legalTerms: LegalTermRow[]
  acceptedTermTypes: string[]
  onAccept: (termTypes: LegalTermType[]) => Promise<void>
  disabled?: boolean
  submitLabel?: string
  awarenessOnly?: boolean
  /** Oculta o botão interno; use com onAllCheckedChange + submit do formulário pai. */
  showSubmitButton?: boolean
  onAllCheckedChange?: (allChecked: boolean) => void
}

export function LegalTermAcceptanceStepForm({
  title,
  description,
  termTypes,
  legalTerms,
  acceptedTermTypes,
  onAccept,
  disabled,
  submitLabel = 'Confirmar e continuar',
  awarenessOnly = false,
  showSubmitButton = true,
  onAllCheckedChange,
}: Props) {
  const termsForStep = useMemo(
    () =>
      termTypes
        .map((type) => legalTerms.find((t) => t.term_type === type))
        .filter(Boolean) as LegalTermRow[],
    [legalTerms, termTypes],
  )

  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const type of termTypes) {
      initial[type] = hasAcceptedTermType(acceptedTermTypes, type)
    }
    return initial
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allChecked = termTypes.every((type) => checked[type])

  useEffect(() => {
    onAllCheckedChange?.(allChecked && termsForStep.length > 0)
  }, [allChecked, onAllCheckedChange, termsForStep.length])

  const handleSubmit = async () => {
    if (!allChecked) return
    setSubmitting(true)
    setError(null)
    try {
      const pending = termTypes.filter((type) => !hasAcceptedTermType(acceptedTermTypes, type))
      if (pending.length > 0) {
        await onAccept(pending)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível registrar o aceite')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      {termsForStep.length === 0 ? (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
          Documentos ainda não publicados pela Larsana. A gestão configurará em Configurações → Termos.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {termsForStep.map((term) => (
            <div key={term.id} className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div>
                <p className="text-sm font-medium">{legalTermLabel(term.term_type, term.title)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Versão {term.version}</p>
              </div>
              {term.content ? (
                <div className="max-h-40 overflow-y-auto rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {term.content.slice(0, 1200)}
                  {term.content.length > 1200 ? '…' : ''}
                </div>
              ) : null}
              <label className="flex items-start gap-3 text-sm cursor-pointer">
                <Checkbox
                  checked={!!checked[term.term_type]}
                  onCheckedChange={(v) =>
                    setChecked((prev) => ({ ...prev, [term.term_type]: v === true }))
                  }
                  disabled={disabled || hasAcceptedTermType(acceptedTermTypes, term.term_type as LegalTermType)}
                />
                <span>
                  {awarenessOnly
                    ? `Declaro ciência de ${legalTermLabel(term.term_type, term.title)}`
                    : `Li e aceito ${legalTermLabel(term.term_type, term.title)}`}
                </span>
              </label>
            </div>
          ))}
        </div>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {showSubmitButton ? (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || submitting || !allChecked || termsForStep.length === 0}
        >
          {submitting ? 'Registrando…' : submitLabel}
        </Button>
      ) : null}
    </div>
  )
}
