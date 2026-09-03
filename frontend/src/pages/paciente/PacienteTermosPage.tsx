import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PacienteEmptyState, PacienteSubpageShell } from '@/components/paciente/PacienteSubpageShell'
import { LegalDocumentsHub } from '@/components/legal/LegalDocumentsHub'
import { legalTermLabel } from '@/constants/legalTerms'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/formatters'

type LegalTerm = {
  id: string
  term_type: string
  title: string
  version: string
  content: string
}

export function PacienteTermosPage() {
  return (
    <PacienteSubpageShell title="Documentos e Termos">
      <div className="pb-8">
        <LegalDocumentsHub
          profile="paciente"
          detailBasePath="/paciente/termos"
          description="Termos de uso, privacidade, anexos comerciais e histórico de aceites."
        />
      </div>
    </PacienteSubpageShell>
  )
}

export function PacienteTermoDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: term, isLoading } = useQuery({
    queryKey: ['paciente', 'legal-term', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_terms')
        .select('id, term_type, title, version, content')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as LegalTerm
    },
  })

  const { data: acceptance } = useQuery({
    queryKey: ['paciente', 'legal-term-acceptance', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('digital_acceptances')
        .select('accepted_at, legal_terms(version)')
        .eq('term_id', id!)
        .order('accepted_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as { accepted_at: string; legal_terms: { version: string } | null } | null
    },
  })

  return (
    <PacienteSubpageShell
      title={term ? legalTermLabel(term.term_type, term.title) : 'Documento'}
      loading={isLoading}
      backTo="/paciente/termos"
    >
      <div className="space-y-4 pb-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : term ? (
          <>
            <p className="text-sm text-muted-foreground">Versão vigente {term.version}</p>
            {acceptance?.accepted_at ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                Aceito em {formatDateTime(acceptance.accepted_at)}
                {acceptance.legal_terms?.version ? ` — Versão ${acceptance.legal_terms.version}` : ''}
              </p>
            ) : null}
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-5">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{term.content}</p>
            </div>
          </>
        ) : (
          <PacienteEmptyState message="Documento não encontrado." />
        )}
      </div>
    </PacienteSubpageShell>
  )
}
