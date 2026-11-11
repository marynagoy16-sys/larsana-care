import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ANEXO_II_CANCELAMENTO_SUMMARY,
  LEGAL_TERM_PUBLIC_PATHS,
  legalTermLabel,
  PATIENT_CYCLE_TERM_TYPES,
} from '@/constants/legalTerms'
import { loadCurrentLegalTerms } from '@/services/legalDocuments'

type Props = {
  acceptI: boolean
  acceptII: boolean
  onAcceptIChange: (value: boolean) => void
  onAcceptIIChange: (value: boolean) => void
}

function TermLink({ termType, title }: { termType: string; title?: string | null }) {
  const path = LEGAL_TERM_PUBLIC_PATHS[termType as keyof typeof LEGAL_TERM_PUBLIC_PATHS]
  const label = legalTermLabel(termType, title)
  if (!path) return <span className="font-medium">{label}</span>
  return (
    <Link to={path} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline">
      {label}
    </Link>
  )
}

export function CycleLegalAcceptanceFields({
  acceptI,
  acceptII,
  onAcceptIChange,
  onAcceptIIChange,
}: Props) {
  const { data: termsLoaded = [] } = useQuery({
    queryKey: ['legal-documents', 'cycle-terms'],
    queryFn: () => loadCurrentLegalTerms(PATIENT_CYCLE_TERM_TYPES),
  })

  const anexoI = termsLoaded.find((t) => t.term_type === 'ANEXO_I_COMERCIAL_PACIENTE')
  const anexoII = termsLoaded.find((t) => t.term_type === 'ANEXO_II_CANCELAMENTO_PACIENTE')

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <p className="font-semibold text-sm">Aceite comercial do ciclo</p>

      <label className="flex items-start gap-3 text-sm cursor-pointer rounded-lg border p-3">
        <Checkbox checked={acceptI} onCheckedChange={(v) => onAcceptIChange(v === true)} />
        <span>
          Li e aceito <TermLink termType="ANEXO_I_COMERCIAL_PACIENTE" title={anexoI?.title} /> (v
          {anexoI?.version ?? '—'}) com os valores acima.
        </span>
      </label>

      <label className="flex items-start gap-3 text-sm cursor-pointer rounded-lg border p-3">
        <Checkbox checked={acceptII} onCheckedChange={(v) => onAcceptIIChange(v === true)} />
        <span>
          Declaro ciência de{' '}
          <TermLink termType="ANEXO_II_CANCELAMENTO_PACIENTE" title={anexoII?.title} /> (v
          {anexoII?.version ?? '—'}).
        </span>
      </label>

      <p className="text-xs text-muted-foreground">{ANEXO_II_CANCELAMENTO_SUMMARY}</p>
    </div>
  )
}
