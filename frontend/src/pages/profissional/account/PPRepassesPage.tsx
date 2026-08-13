import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight } from 'lucide-react'
import { PPAccountSubpageHeader } from '@/components/profissional/account/PPAccountSubpageHeader'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { ListToolbar } from '@/components/crud/list-page/ListToolbar'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/formatters'
import { transfersService } from '@/services/index'

export function PPRepassesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['pp', 'transfers'],
    queryFn: () => transfersService.list('id, pp_transfer_amount_cents, status, created_at'),
  })

  const rows = useMemo(() => {
    const all = (data?.data ?? []) as Array<Record<string, unknown> & { id: string }>
    const query = search.trim().toLowerCase()
    if (!query) return all

    return all.filter((row) => {
      const amount = formatCurrency(Number(row.pp_transfer_amount_cents ?? 0)).toLowerCase()
      const status = String(row.status ?? '').toLowerCase()
      return amount.includes(query) || status.includes(query)
    })
  }, [data?.data, search])

  return (
    <>
      <PPAccountSubpageHeader title="Repasses" loading={isLoading && !data} />

      <CrudScrollPageLayout>
        <div className="space-y-4 pb-8">
          <ListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Pesquisar repasses..."
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
          />

          {isLoading && !data ? (
            <p className="text-sm text-muted-foreground">Carregando repasses…</p>
          ) : rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8 text-center text-sm text-muted-foreground">
              Nenhum repasse registrado ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => navigate(`/profissional/repasses/${row.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:bg-muted/30 active:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    R$
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium tabular-nums">
                      {formatCurrency(Number(row.pp_transfer_amount_cents ?? 0))}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 capitalize">
                    {String(row.status ?? '—').replace(/_/g, ' ')}
                  </Badge>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      </CrudScrollPageLayout>
    </>
  )
}
