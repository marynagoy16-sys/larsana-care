type CycleSessionsProgressProps = {
  done: number
  total: number
  fullWidth?: boolean
}

export function CycleSessionsProgress({ done, total, fullWidth = false }: CycleSessionsProgressProps) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className={fullWidth ? 'w-full' : 'min-w-[4.5rem]'}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-bold tabular-nums text-foreground">
          {done} / {total}
        </p>
        <p className="text-sm font-medium tabular-nums text-muted-foreground">{pct}%</p>
      </div>
      <div
        className={`mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden${fullWidth ? '' : ' max-w-[4.5rem]'}`}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
