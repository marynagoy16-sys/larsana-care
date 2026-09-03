import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LegalTermAcceptanceStepForm } from '@/components/legal/LegalTermAcceptanceStepForm'
import { loadCurrentLegalTerms, recordPatientRepresentation } from '@/services/legalDocuments'

type Props = {
  showFamilyAuthorization?: boolean
  showLegalRepresentation?: boolean
  onComplete?: () => void
}

/** Fluxos condicionais de autorização familiar e representação legal. */
export function PatientRepresentationFlow({
  showFamilyAuthorization = false,
  showLegalRepresentation = false,
  onComplete,
}: Props) {
  const [familyScope, setFamilyScope] = useState('')
  const [legalScope, setLegalScope] = useState('')
  const [familyDone, setFamilyDone] = useState(false)
  const [legalDone, setLegalDone] = useState(false)

  const { data: terms = [] } = useQuery({
    queryKey: ['legal', 'representation'],
    queryFn: () => loadCurrentLegalTerms(['AUTORIZACAO_FAMILIAR', 'REPRESENTACAO_LEGAL']),
    enabled: showFamilyAuthorization || showLegalRepresentation,
  })

  const familyMutation = useMutation({
    mutationFn: () =>
      recordPatientRepresentation('family_contact', 'AUTORIZACAO_FAMILIAR', familyScope || undefined),
    onSuccess: () => {
      setFamilyDone(true)
      if (!showLegalRepresentation || legalDone) onComplete?.()
    },
  })

  const legalMutation = useMutation({
    mutationFn: () =>
      recordPatientRepresentation('legal_representative', 'REPRESENTACAO_LEGAL', legalScope || undefined),
    onSuccess: () => {
      setLegalDone(true)
      if (!showFamilyAuthorization || familyDone) onComplete?.()
    },
  })

  if (!showFamilyAuthorization && !showLegalRepresentation) return null

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-medium">Documentos de representação</p>

      {showFamilyAuthorization && !familyDone && (
        <div className="space-y-3">
          <LegalTermAcceptanceStepForm
            title="Autorização familiar"
            termTypes={['AUTORIZACAO_FAMILIAR']}
            legalTerms={terms.filter((t) => t.term_type === 'AUTORIZACAO_FAMILIAR')}
            acceptedTermTypes={[]}
            onAccept={async () => {
              await familyMutation.mutateAsync()
            }}
            submitLabel="Registrar autorização familiar"
          />
          <div className="space-y-2">
            <Label htmlFor="familyScope">Escopo (opcional)</Label>
            <Input
              id="familyScope"
              value={familyScope}
              onChange={(e) => setFamilyScope(e.target.value)}
              placeholder="Ex.: contato para agendamentos"
            />
          </div>
        </div>
      )}

      {showLegalRepresentation && !legalDone && (
        <div className="space-y-3">
          <LegalTermAcceptanceStepForm
            title="Representação legal"
            termTypes={['REPRESENTACAO_LEGAL']}
            legalTerms={terms.filter((t) => t.term_type === 'REPRESENTACAO_LEGAL')}
            acceptedTermTypes={[]}
            onAccept={async () => {
              await legalMutation.mutateAsync()
            }}
            submitLabel="Registrar representação legal"
          />
          <div className="space-y-2">
            <Label htmlFor="legalScope">Escopo (opcional)</Label>
            <Input
              id="legalScope"
              value={legalScope}
              onChange={(e) => setLegalScope(e.target.value)}
              placeholder="Ex.: responsável legal por menor"
            />
          </div>
        </div>
      )}

      {(familyDone || legalDone) && (
        <p className="text-sm text-emerald-700 dark:text-emerald-400">Representação registrada.</p>
      )}
    </div>
  )
}
