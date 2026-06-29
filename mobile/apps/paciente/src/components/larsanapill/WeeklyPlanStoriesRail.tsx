import { Pressable, ScrollView, Text, View } from 'react-native'
import type { LarsanaPillWeeklyPlan } from '@/types/content'
import { getPlanColor } from '@/lib/larsanapill/planVisuals'

interface WeeklyPlanStoriesRailProps {
  plans: LarsanaPillWeeklyPlan[]
  progressByPlanId?: Record<string, { completed: number; total: number }>
  onSelectPlan: (slug: string) => void
}

export function WeeklyPlanStoriesRail({ plans, progressByPlanId = {}, onSelectPlan }: WeeklyPlanStoriesRailProps) {
  if (plans.length === 0) return null

  return (
    <View className="gap-3">
      <View>
        <Text className="text-lg font-semibold text-foreground">Planos para você</Text>
        <Text className="text-sm text-muted-foreground">Rotinas semanais guiadas para seu tratamento em casa</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
        {plans.map((plan) => {
          const progress = progressByPlanId[plan.id]
          const percent =
            progress && progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0
          const color = getPlanColor(plan.code)

          return (
            <Pressable
              key={plan.id}
              onPress={() => onSelectPlan(plan.slug)}
              className="w-[132px] shrink-0 items-center gap-2"
              style={{ flexGrow: 0 }}
            >
              <View
                className="h-[235px] w-[132px] overflow-hidden rounded-2xl"
                style={{ backgroundColor: color }}
              >
                {progress && progress.total > 0 ? (
                  <View className="absolute left-2 top-2 rounded-full bg-black/30 px-2 py-0.5">
                    <Text className="text-[10px] font-semibold text-white">{percent}%</Text>
                  </View>
                ) : null}
                <View className="absolute inset-x-0 bottom-0 bg-black/50 p-2.5">
                  <Text className="text-[10px] font-bold uppercase tracking-wide text-white/90">{plan.code}</Text>
                  <Text className="text-[11px] font-semibold leading-tight text-white" numberOfLines={3}>
                    {plan.title}
                  </Text>
                </View>
              </View>
              <Text className="w-full text-center text-[10px] font-medium text-muted-foreground" numberOfLines={2}>
                {plan.sessions_per_week}x/sem · {plan.minutes_per_session}min
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}
