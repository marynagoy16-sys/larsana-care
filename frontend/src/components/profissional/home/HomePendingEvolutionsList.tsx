import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  pendingEvolutionDeadlineLabel,
  type PendingEvolutionRow,
} from '@/services/ppEvolutions'

const MAX_ITEMS = 3

interface HomePendingEvolutionsListProps {
  items: PendingEvolutionRow[]
}

export function HomePendingEvolutionsList({ items }: HomePendingEvolutionsListProps) {
  const navigate = useNavigate()
  const preview = items.slice(0, MAX_ITEMS)

  if (preview.length === 0) return null

  return (
    <div className="space-y-2">
      {preview.map((row) => {
        const patientName = row.care_cycles?.patients?.full_name ?? 'Paciente'
        const cycle = row.care_cycles?.cycle_number
        const deadline = pendingEvolutionDeadlineLabel(row)
        const overdue = deadline.startsWith('Atrasada')

        return (
          <button
            key={row.id}
            type="button"
            onClick={() => navigate(`/profissional/evolucao/nova?session=${row.id}`)}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{patientName}</p>
              <p className="text-xs text-muted-foreground">
                {cycle != null ? `Ciclo ${cycle} · Terapia #${row.session_number}` : `Terapia #${row.session_number}`}
              </p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 border-0 text-[11px]',
                overdue
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
              )}
            >
              {deadline}
            </Badge>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        )
      })}
    </div>
  )
}
