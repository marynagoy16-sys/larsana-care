import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { CycleLegalAcceptanceFields } from '@/components/legal/CycleLegalAcceptanceFields'
import { recordCycleLegalAcceptances } from '@/services/legalDocuments'

type Props = {
  cycleId: string
  sessionCount: number
  unitPriceCents: number
  totalCents: number
  onAccepted?: () => void
}

export function CycleLegalAcceptancePanel({
  cycleId,
  sessionCount,
  unitPriceCents,
  totalCents,
  onAccepted,
}: Props) {
  const [acceptI, setAcceptI] = useState(false)
  const [acceptII, setAcceptII] = useState(false)

  const mutation = useMutation({
    mutationFn: () => recordCycleLegalAcceptances(cycleId, acceptI, acceptII),
    onSuccess: () => onAccepted?.(),
  })

  return (
    <div className="space-y-4">
      <CycleLegalAcceptanceFields
        sessionCount={sessionCount}
        unitPriceCents={unitPriceCents}
        totalCents={totalCents}
        acceptI={acceptI}
        acceptII={acceptII}
        onAcceptIChange={setAcceptI}
        onAcceptIIChange={setAcceptII}
      />

      <Button
        size="sm"
        disabled={!acceptI || !acceptII || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? 'Registrando…' : 'Confirmar aceites do ciclo'}
      </Button>

      {mutation.isError ? (
        <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
      ) : null}
    </div>
  )
}
