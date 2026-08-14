import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

type LegalTerm = {
  id: string
  term_type: string
  version: string
  title: string
  content: string | null
  is_current: boolean
}

export function PacienteAceitePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [accepted, setAccepted] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)

  const { data: terms = [], isLoading } = useQuery({
    queryKey: ['paciente', 'legal_terms_current'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_terms')
        .select('id, term_type, version, title, content, is_current')
        .eq('is_current', true)
        .in('term_type', ['TERMO_ADESAO', 'LGPD'])
      if (error) throw error
      return (data ?? []) as LegalTerm[]
    },
  })

  const allChecked = terms.length > 0 && terms.every((t) => accepted[t.id])

  const handleSubmit = async () => {
    if (!user?.id || !allChecked) return
    setSubmitting(true)
    try {
      const rows = terms.map((term) => ({
        acceptor_role: 'paciente' as const,
        acceptor_user_id: user.id,
        term_id: term.id,
      }))
      const { error } = await supabase.from('digital_acceptances').insert(rows)
      if (error) throw error
      navigate('/paciente')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader>
        <h1 className="font-display font-bold text-xl">Aceite inicial</h1>
      </PageHeader>

      <CrudScrollPageLayout>
        <div className="space-y-5 pb-8 max-w-2xl">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando termos...</p>
          ) : terms.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum termo pendente.</p>
          ) : (
            terms.map((term) => (
              <div key={term.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <h2 className="font-semibold text-sm">{term.title}</h2>
                {term.content ? (
                  <div className="text-sm text-muted-foreground max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {term.content}
                  </div>
                ) : null}
                <label className="flex items-start gap-3 text-sm cursor-pointer">
                  <Checkbox
                    checked={!!accepted[term.id]}
                    onCheckedChange={(v) =>
                      setAccepted((prev) => ({ ...prev, [term.id]: v === true }))
                    }
                  />
                  <span>Li e aceito {term.title}</span>
                </label>
              </div>
            ))
          )}

          <Button disabled={!allChecked || submitting} onClick={handleSubmit}>
            {submitting ? 'Salvando...' : 'Continuar para o app'}
          </Button>
        </div>
      </CrudScrollPageLayout>
    </>
  )
}
