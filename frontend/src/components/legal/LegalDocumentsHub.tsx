import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, FileText } from 'lucide-react'
import { formatDateTime } from '@/lib/formatters'
import { legalTermLabel, type LegalTermProfile } from '@/constants/legalTerms'
import { getLegalDocumentsHub, legalDocumentsQueryKeys } from '@/services/legalDocuments'

type Props = {
  profile: LegalTermProfile
  detailBasePath: string
  title?: string
  description?: string
}

export function LegalDocumentsHub({
  profile,
  detailBasePath,
  title = 'Documentos, Termos e Políticas',
  description = 'Consulte versões vigentes e histórico de aceites.',
}: Props) {
  const { data, isLoading } = useQuery({
    queryKey: legalDocumentsQueryKeys.hub(profile),
    queryFn: () => getLegalDocumentsHub(profile),
  })

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando documentos…</p>
  }

  const items = data ?? []

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground rounded-xl border border-dashed border-border px-4 py-8 text-center">
        Nenhum documento publicado no momento.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.term_id}
            to={`${detailBasePath}/${item.term_id}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 transition-colors hover:bg-muted/40"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="size-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">
                {legalTermLabel(item.term_type, item.title)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Versão vigente {item.version}</p>
              {item.accepted_at ? (
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                  Aceito em {formatDateTime(item.accepted_at)}
                  {item.accepted_version ? ` — Versão ${item.accepted_version}` : ''}
                </p>
              ) : item.requires_reaccept ? (
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">Reaceite necessário</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Sem aceite registrado</p>
              )}
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  )
}
