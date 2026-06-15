import type { LarsanaPillWeeklyPlan } from '@/types/academy'
import { getPlanGradient } from '@/lib/larsanapill/planVisuals'
import { cn } from '@/lib/utils'

interface WeeklyPlanStoriesRailProps {
  plans: LarsanaPillWeeklyPlan[]
  progressByPlanId?: Record<string, { completed: number; total: number }>
  onSelectPlan: (slug: string) => void
}

export function WeeklyPlanStoriesRail({ plans, progressByPlanId = {}, onSelectPlan }: WeeklyPlanStoriesRailProps) {
  if (plans.length === 0) return null

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold">Planos para você</h2>
        <p className="text-sm text-muted-foreground">Rotinas semanais guiadas para seu tratamento em casa</p>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-sidebar snap-x snap-mandatory">
        {plans.map((plan) => {
          const progress = progressByPlanId[plan.id]
          const percent =
            progress && progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0
          const gradient = getPlanGradient(plan.code)

          return (
            <button
              key={plan.id}
              type="button"
              onClick={() => onSelectPlan(plan.slug)}
              className="group flex w-[132px] shrink-0 snap-start flex-col items-center gap-2 sm:w-[156px]"
            >
              <div
                className={cn(
                  'relative h-[235px] w-[132px] overflow-hidden rounded-2xl bg-gradient-to-b shadow-md transition-transform group-hover:scale-[1.02] sm:h-[277px] sm:w-[156px]',
                  gradient,
                )}
              >
                {progress && progress.total > 0 && (
                  <svg className="absolute inset-1 h-[calc(100%-8px)] w-[calc(100%-8px)]" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" className="stroke-white/25" strokeWidth="4" />
                    <circle
                      cx="50"
                      cy="50"
                      r="46"
                      fill="none"
                      className="stroke-white"
                      strokeWidth="4"
                      strokeDasharray={`${percent * 2.89} 289`}
                      strokeLinecap="round"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                )}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-white/90">{plan.code}</span>
                  <span className="line-clamp-3 text-left text-[11px] font-semibold leading-tight text-white">
                    {plan.title}
                  </span>
                </div>
              </div>
              <span className="line-clamp-2 w-full text-center text-[10px] font-medium text-muted-foreground">
                {plan.sessions_per_week}x/sem · {plan.minutes_per_session}min
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
