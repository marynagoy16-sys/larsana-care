type CycleSessionsProgressProps = {
  done: number
  total: number
}

export function CycleSessionsProgress({ done, total }: CycleSessionsProgressProps) {
  const pct = total > 0 ? (done / total) * 100 : 0

  return (
    <div className="min-w-[4.5rem]">
      <p className="text-sm font-bold tabular-nums text-foreground">
        {done} / {total}
      </p>
      <div className="mt-1 h-1.5 w-full max-w-[4.5rem] rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
