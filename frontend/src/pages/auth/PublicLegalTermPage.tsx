import { Link, useLocation, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'
import {
  PUBLIC_LEGAL_TERM_LABELS,
  getPublicLegalTerm,
  isPublicLegalTermSlug,
  type PublicLegalTermSlug,
} from '@/services/publicLegalTerms'

const PATH_TO_SLUG: Record<string, PublicLegalTermSlug> = {
  '/termos-de-uso': 'termos-de-uso',
  '/politica-de-privacidade': 'politica-de-privacidade',
  '/termos-profissionais': 'termos-profissionais',
  '/privacidade-profissionais': 'privacidade-profissionais',
  '/politica-de-cookies': 'politica-de-cookies',
  '/regras-cancelamento': 'regras-cancelamento',
}

export function PublicLegalTermPage() {
  const { pathname } = useLocation()
  const { slug: paramSlug } = useParams<{ slug?: string }>()
  const validSlug = PATH_TO_SLUG[pathname] ?? (paramSlug && isPublicLegalTermSlug(paramSlug) ? paramSlug : null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public', 'legal-term', validSlug],
    queryFn: () => getPublicLegalTerm(validSlug!),
    enabled: !!validSlug,
  })

  const title = validSlug ? PUBLIC_LEGAL_TERM_LABELS[validSlug] : 'Termo'

  return (
    <div className="min-h-dvh bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex justify-center">
          <Logo layout="horizontal" adaptToTheme style="v1" size="sm" subtitle="Fisioterapia Domiciliar" />
        </div>

        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Voltar ao login
        </Link>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight">{data?.title ?? title}</h1>
          {data?.version ? (
            <p className="text-sm text-muted-foreground">Versão {data.version}</p>
          ) : null}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : isError || !validSlug ? (
          <p className="text-sm text-muted-foreground">Termo não encontrado.</p>
        ) : data ? (
          <div className="rounded-xl border border-border bg-card px-4 py-5">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {data.content?.trim() || 'Conteúdo indisponível no momento.'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Termo não encontrado.</p>
        )}
      </div>
    </div>
  )
}
