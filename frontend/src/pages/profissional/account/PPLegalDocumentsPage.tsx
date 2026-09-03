import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PPAccountSubpageHeader } from '@/components/profissional/account/PPAccountSubpageHeader'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { LegalDocumentsHub } from '@/components/legal/LegalDocumentsHub'
import { legalTermLabel } from '@/constants/legalTerms'
import { formatDateTime } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'

type LegalTerm = {
  id: string
  term_type: string
  title: string
  version: string
  content: string
}

export function PPLegalDocumentsPage() {
  return (
    <>
      <PPAccountSubpageHeader title="Documentos e Termos" />
      <CrudScrollPageLayout>
        <div className="pb-8">
          <LegalDocumentsHub
            profile="pp"
            detailBasePath="/profissional/documentos"
            description="Contrato, anexos, sigilo e histórico de aceites do credenciamento."
          />
        </div>
      </CrudScrollPageLayout>
    </>
  )
}

export function PPLegalDocumentDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: term, isLoading } = useQuery({
    queryKey: ['pp', 'legal-term', id],
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
    queryKey: ['pp', 'legal-term-acceptance', id],
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
    <>
      <PPAccountSubpageHeader title={term ? legalTermLabel(term.term_type, term.title) : 'Documento'} loading={isLoading} />
      <CrudScrollPageLayout>
        <Link to="/profissional/documentos" className="mb-4 inline-block text-sm text-primary hover:underline">
          ← Voltar à central de documentos
        </Link>
        <div className="space-y-4 pb-8">
          {term ? (
            <>
              <p className="text-sm text-muted-foreground">Versão vigente {term.version}</p>
              {acceptance?.accepted_at ? (
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  Aceito em {formatDateTime(acceptance.accepted_at)}
                  {acceptance.legal_terms?.version ? ` — Versão ${acceptance.legal_terms.version}` : ''}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Sem aceite registrado para este documento.</p>
              )}
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-5">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{term.content}</p>
              </div>
              <Link to="/profissional/documentos" className="text-sm text-primary hover:underline">
                Voltar à central de documentos
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Documento não encontrado.</p>
          )}
        </div>
      </CrudScrollPageLayout>
    </>
  )
}
