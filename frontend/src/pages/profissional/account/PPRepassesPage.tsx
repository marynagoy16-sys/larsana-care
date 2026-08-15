import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Wallet } from 'lucide-react'
import { PPAccountSubpageHeader } from '@/components/profissional/account/PPAccountSubpageHeader'
import { RepasseStatusBadge, RepasseStatusIcon } from '@/components/profissional/repasses/RepasseStatusVisual'
import { CrudEmptyState } from '@/components/crud/CrudEmptyState'
import { Toggle } from '@/components/ui/toggle'
import { useImmersiveLayout } from '@/contexts/ImmersiveLayoutContext'
import { useBottomNavAutoHide } from '@/hooks/useBottomNavAutoHide'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import {
  TRANSFER_STATUS_LABELS,
  TRANSFER_STATUS_ORDER,
  type TransferStatus,
} from '@/services/ppTransfers'
import { transfersService } from '@/services/index'

type RepasseFilter = 'all' | TransferStatus

type RepasseRow = Record<string, unknown> & {
  id: string
  pp_transfer_amount_cents?: number | null
  status?: string | null
  created_at?: string | null
}

const REPASSE_FILTERS: { id: RepasseFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  ...TRANSFER_STATUS_ORDER.map((status) => ({
    id: status,
    label: TRANSFER_STATUS_LABELS[status],
  })),
]

const EMPTY_MESSAGES: Record<RepasseFilter, string> = {
  all: 'Nenhum repasse registrado ainda.',
  aguardando_nf: 'Nenhum repasse aguardando nota fiscal.',
  aguardando_validacao: 'Nenhum repasse aguardando validação.',
  liberado: 'Nenhum repasse liberado no momento.',
  transferido: 'Nenhum repasse transferido ainda.',
  falhou: 'Nenhum repasse com falha.',
  cancelado: 'Nenhum repasse cancelado.',
}

function matchesRepasseFilter(row: RepasseRow, filter: RepasseFilter): boolean {
  if (filter === 'all') return true
  return String(row.status ?? '') === filter
}

export function PPRepassesPage() {
  const navigate = useNavigate()
  const { setFixedMain } = useImmersiveLayout()
  const [repasseFilter, setRepasseFilter] = useState<RepasseFilter>('all')
  const [splitScrollMobile, setSplitScrollMobile] = useState(false)
  const [listScrollElement, setListScrollElement] = useState<HTMLDivElement | null>(null)
  const listScrollRef = useCallback((node: HTMLDivElement | null) => {
    setListScrollElement(node)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const sync = () => {
      setFixedMain(mq.matches)
      setSplitScrollMobile(mq.matches)
    }
    sync()
    mq.addEventListener('change', sync)
    return () => {
      mq.removeEventListener('change', sync)
      setFixedMain(false)
    }
  }, [setFixedMain])

  useBottomNavAutoHide(listScrollElement, splitScrollMobile)

  useEffect(() => {
    listScrollElement?.scrollTo({ top: 0 })
  }, [repasseFilter, listScrollElement])

  const { data, isLoading } = useQuery({
    queryKey: ['pp', 'transfers'],
    queryFn: () => transfersService.list('id, pp_transfer_amount_cents, status, created_at'),
  })

  const rows = useMemo(() => {
    const all = (data?.data ?? []) as RepasseRow[]
    return all.filter((row) => matchesRepasseFilter(row, repasseFilter))
  }, [data?.data, repasseFilter])

  return (
    <>
      <PPAccountSubpageHeader title="Repasses" loading={isLoading && !data} />

      <div className="flex min-h-0 flex-1 flex-col max-lg:h-full max-lg:overflow-hidden max-lg:px-[var(--shell-gap)] lg:pb-8">
        <div
          className={cn(
            'shrink-0 overflow-x-auto overscroll-x-contain py-1 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            'max-lg:-mx-[var(--shell-gap)] max-lg:w-[calc(100%+2*var(--shell-gap))]',
            'lg:mb-4',
          )}
        >
          <div className="flex w-max flex-nowrap gap-2">
            {REPASSE_FILTERS.map((filter, index) => (
              <Toggle
                key={filter.id}
                variant="outline"
                pressed={repasseFilter === filter.id}
                onPressedChange={(pressed) => {
                  if (pressed) setRepasseFilter(filter.id)
                }}
                className={cn(
                  'h-11 shrink-0 rounded-full px-5 text-sm whitespace-nowrap data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
                  index === 0 && 'max-lg:ml-[var(--shell-gap)]',
                  index === REPASSE_FILTERS.length - 1 && 'max-lg:mr-[var(--shell-gap)]',
                )}
              >
                {filter.label}
              </Toggle>
            ))}
          </div>
        </div>

        <div
          ref={listScrollRef}
          className="min-h-0 flex-1 max-lg:overflow-y-auto max-lg:pt-3 max-lg:scrollbar-sidebar max-lg:shell-scroll-with-bottom-nav"
        >
          {isLoading && !data ? (
            <p className="text-sm text-muted-foreground">Carregando repasses…</p>
          ) : rows.length === 0 ? (
            <CrudEmptyState message={EMPTY_MESSAGES[repasseFilter]} icon={Wallet} muted />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
              {rows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => navigate(`/profissional/repasses/${row.id}`)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/30 active:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <RepasseStatusIcon status={row.status} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium tabular-nums">
                      {formatCurrency(Number(row.pp_transfer_amount_cents ?? 0))}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      {formatDateTime(row.created_at)}
                    </p>
                  </div>
                  <RepasseStatusBadge
                    status={row.status}
                    label={
                      TRANSFER_STATUS_LABELS[String(row.status ?? '') as TransferStatus] ??
                      String(row.status ?? '—').replace(/_/g, ' ')
                    }
                  />
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
