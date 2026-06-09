import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-48 max-w-[70%]" />
      <Skeleton className="h-4 w-64 max-w-[90%]" />
    </div>
  )
}

export function MetricCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card overflow-hidden min-w-0">
      <div className="flex flex-1 flex-col p-4 pb-3 min-h-[88px]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
            <Skeleton className="h-4 w-24 max-w-[70%]" />
          </div>
          <Skeleton className="h-4 w-4 shrink-0 rounded" />
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-8 w-12 hidden sm:block" />
        </div>
      </div>
      <Skeleton className="h-9 w-full rounded-none shrink-0" />
    </div>
  )
}

export function ToolbarSkeleton({ actions = 3 }: { actions?: number }) {
  return (
    <div className="flex flex-nowrap items-center gap-2 min-w-0 w-full">
      <Skeleton className="h-9 flex-1 min-w-0 rounded-md" />
      <div className="flex items-center gap-1 shrink-0">
        {Array.from({ length: actions }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-9 rounded-md" />
        ))}
      </div>
    </div>
  )
}

function SimpleMobileCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <Skeleton className="h-4 w-3/4 max-w-[200px]" />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-3.5 w-full max-w-[100px]" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-12" />
          <Skeleton className="h-3.5 w-full max-w-[80px]" />
        </div>
      </div>
    </div>
  )
}

function RichMobileCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Skeleton className="h-1 w-full rounded-none" />
      <div className="p-3.5 space-y-3">
        <div className="flex items-start gap-2.5">
          <Skeleton className="h-4 w-4 rounded mt-2 shrink-0" />
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-4 w-3/4 max-w-[180px]" />
            <Skeleton className="h-3 w-1/2 max-w-[120px]" />
          </div>
          <Skeleton className="h-6 w-14 rounded-full shrink-0" />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/80">
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-10" />
            <Skeleton className="h-3.5 w-full max-w-[100px]" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-3.5 w-full max-w-[80px]" />
          </div>
        </div>
      </div>
    </div>
  )
}

function DesktopTableSkeleton({
  rows = 6,
  columns = 5,
  selectable = false,
}: {
  rows?: number
  columns?: number
  selectable?: boolean
}) {
  const colWidths = ['w-28', 'w-24', 'w-32', 'w-20', 'w-36', 'w-24', 'w-8']
  return (
    <div className="hidden md:block rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-3 bg-muted/30 border-b border-border">
        {selectable && <Skeleton className="h-4 w-4 shrink-0" />}
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className={cn('h-3', colWidths[i % colWidths.length])} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
          {selectable && <Skeleton className="h-4 w-4 shrink-0" />}
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className={cn('h-4', colWidths[i % colWidths.length])} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CrudTableSkeleton({
  rows = 5,
  columns = 4,
  variant = 'default',
}: {
  rows?: number
  columns?: number
  variant?: 'default' | 'rich'
}) {
  const Mobile = variant === 'rich' ? RichMobileCardSkeleton : SimpleMobileCardSkeleton
  return (
    <>
      <div className="space-y-2.5 md:hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <Mobile key={i} />
        ))}
      </div>
      <DesktopTableSkeleton rows={rows} columns={columns} selectable={variant === 'rich'} />
    </>
  )
}

export function PaginationSkeleton() {
  return (
    <div className="flex flex-nowrap items-center justify-between gap-2 min-w-0">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-8 w-[70px] rounded-md" />
      <div className="flex items-center gap-1">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  )
}

export function CrudListPageSkeleton({
  showStats = true,
  statsCount = 4,
  tableColumns = 4,
  toolbarActions = 3,
}: {
  showStats?: boolean
  statsCount?: number
  tableColumns?: number
  toolbarActions?: number
}) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando">
      {showStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {Array.from({ length: statsCount }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
      )}
      <ToolbarSkeleton actions={toolbarActions} />
      <CrudTableSkeleton columns={tableColumns} />
    </div>
  )
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Carregando dashboard">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-44 shrink-0 rounded-md" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-24 mt-2" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="lg:col-span-2 h-[320px] rounded-xl" />
        <Skeleton className="h-[320px] rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

export function DetailPageSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Carregando detalhe">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-md shrink-0" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="rounded-xl border border-border p-5 space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-4 w-28 shrink-0" />
            <Skeleton className="h-4 flex-1 max-w-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
