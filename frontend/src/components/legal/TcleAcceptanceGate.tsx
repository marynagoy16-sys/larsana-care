import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { LegalTermAcceptanceStepForm } from '@/components/legal/LegalTermAcceptanceStepForm'
import { loadCurrentLegalTerms, recordLegalAcceptance } from '@/services/legalDocuments'

type Props = {
  patientId?: string
  onAccepted?: () => void
}

/** Gate TCLE antes do primeiro atendimento/avaliação. */
export function TcleAcceptanceGate({ patientId, onAccepted }: Props) {
  const [accepted, setAccepted] = useState(false)

  const { data: terms = [] } = useQuery({
    queryKey: ['legal', 'tcle'],
    queryFn: () => loadCurrentLegalTerms(['TCLE_FISIO', 'TERMO_CONSENTIMENTO']),
  })

  const mutation = useMutation({
    mutationFn: async () => {
      await recordLegalAcceptance('TCLE_FISIO', {
        contextType: 'session',
        patientId,
      })
    },
    onSuccess: () => {
      setAccepted(true)
      onAccepted?.()
    },
  })

  if (accepted) return null

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20 p-4">
      <LegalTermAcceptanceStepForm
        title="Termo de Consentimento (TCLE)"
        description="Obrigatório antes do primeiro atendimento ou avaliação domiciliar."
        termTypes={['TCLE_FISIO']}
        legalTerms={terms.filter((t) => t.term_type === 'TCLE_FISIO')}
        acceptedTermTypes={[]}
        onAccept={async () => {
          await mutation.mutateAsync()
        }}
        submitLabel="Confirmar TCLE"
      />
    </div>
  )
}
