import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { PacienteEmptyState, PacienteSubpageShell } from '@/components/paciente/PacienteSubpageShell'
import { supabase } from '@/lib/supabase'

const PATIENT_TERM_TYPES = ['TERMO_ADESAO', 'DIRETRIZES', 'LGPD'] as const

const TERM_LABELS: Record<(typeof PATIENT_TERM_TYPES)[number], string> = {
  TERMO_ADESAO: 'Termo de adesão',
  DIRETRIZES: 'Diretrizes de uso',
  LGPD: 'Política de privacidade',
}

type LegalTerm = {
  id: string
  term_type: string
  title: string
  version: string
  content: string
}

export function PacienteTermosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['paciente', 'legal-terms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_terms')
        .select('id, term_type, title, version, content')
        .in('term_type', [...PATIENT_TERM_TYPES])
        .eq('is_current', true)
        .order('term_type')
      if (error) throw error
      return (data ?? []) as LegalTerm[]
    },
  })

  return (
    <PacienteSubpageShell title="Termos" loading={isLoading}>
      <div className="space-y-4 pb-8">
        <p className="text-sm text-muted-foreground">Termos de uso e política de privacidade</p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando termos…</p>
        ) : (data ?? []).length === 0 ? (
          <PacienteEmptyState message="Nenhum termo disponível no momento." />
        ) : (
          <div className="space-y-2">
            {(data ?? []).map((term) => (
              <Link
                key={term.id}
                to={`/paciente/termos/${term.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">
                    {TERM_LABELS[term.term_type as (typeof PATIENT_TERM_TYPES)[number]] ?? term.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Versão {term.version}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </PacienteSubpageShell>
  )
}

export function PacienteTermoDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
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

  return (
    <PacienteSubpageShell
      title={data?.title ?? 'Termo'}
      loading={isLoading}
      backTo="/paciente/termos"
    >
      <div className="space-y-4 pb-8">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : data ? (
          <>
            <p className="text-sm text-muted-foreground">Versão {data.version}</p>
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-5">
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{data.content}</p>
            </div>
          </>
        ) : (
          <PacienteEmptyState message="Termo não encontrado." />
        )}
      </div>
    </PacienteSubpageShell>
  )
}
