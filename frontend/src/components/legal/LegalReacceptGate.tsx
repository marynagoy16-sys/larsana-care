import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { CrudModal } from '@/components/crud/CrudModal'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/hooks/useAuth'
import { legalTermLabel, type LegalTermProfile } from '@/constants/legalTerms'
import {
  getLegalDocumentsHub,
  legalDocumentsQueryKeys,
  recordLegalAcceptance,
} from '@/services/legalDocuments'

function profileForRole(role: string | undefined): LegalTermProfile | null {
  if (role === 'pp') return 'pp'
  if (role === 'paciente') return 'paciente'
  return null
}

export function LegalReacceptGate() {
  const { user, role } = useAuth()
  const queryClient = useQueryClient()
  const legalProfile = profileForRole(role ?? undefined)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [open, setOpen] = useState(false)

  const { data: pendingTerms = [] } = useQuery({
    queryKey: legalDocumentsQueryKeys.hub(legalProfile ?? 'paciente'),
    queryFn: async () => {
      if (!legalProfile) return []
      const items = await getLegalDocumentsHub(legalProfile)
      return items.filter((item) => item.requires_reaccept)
    },
    enabled: !!user && !!legalProfile,
  })

  useEffect(() => {
    setOpen(pendingTerms.length > 0)
  }, [pendingTerms.length])

  const acceptMutation = useMutation({
    mutationFn: async () => {
      for (const term of pendingTerms) {
        if (!checked[term.term_id]) continue
        await recordLegalAcceptance(term.term_type as never, { contextType: 'reaccept' })
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['legal-documents'] })
      setOpen(false)
    },
  })

  if (!user || !legalProfile || pendingTerms.length === 0) return null

  const allChecked = pendingTerms.every((t) => checked[t.term_id])

  return (
    <CrudModal
      open={open}
      onOpenChange={setOpen}
      title="Nova versão dos termos"
      description="Atualizamos documentos legais. É necessário aceitar a versão vigente para continuar."
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>Seus aceites anteriores permanecem no histórico; esta ação registra a nova versão.</span>
        </div>

        {pendingTerms.map((term) => (
          <label key={term.term_id} className="flex items-start gap-3 rounded-lg border p-3 text-sm cursor-pointer">
            <Checkbox
              checked={!!checked[term.term_id]}
              onCheckedChange={(v) => setChecked((prev) => ({ ...prev, [term.term_id]: v === true }))}
            />
            <span>
              Li e aceito {legalTermLabel(term.term_type, term.title)} (v{term.version})
            </span>
          </label>
        ))}

        <div className="flex justify-end">
          <Button
            disabled={!allChecked || acceptMutation.isPending}
            onClick={() => acceptMutation.mutate()}
          >
            {acceptMutation.isPending ? 'Salvando…' : 'Confirmar aceites'}
          </Button>
        </div>
      </div>
    </CrudModal>
  )
}
