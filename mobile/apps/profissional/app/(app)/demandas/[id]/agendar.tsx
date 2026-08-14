import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { getDemandDetail } from '@/services/demands'
import { supabase } from '@/lib/supabase'
import { addDays, format, setHours, setMinutes, startOfWeek } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const HOUR_OPTIONS = [6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20]

type CellKey = `${number}-${number}`

export default function DemandScheduleScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const queryClient = useQueryClient()
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), [])
  const [selected, setSelected] = useState<Set<CellKey>>(new Set())

  const { data: demand, isLoading } = useQuery({
    queryKey: ['pp', 'demand_detail', id],
    queryFn: () => getDemandDetail(id!),
    enabled: !!id,
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      const slots = [...selected].map((key) => {
        const [dayOffset, hour] = key.split('-').map(Number)
        const startsAt = setMinutes(setHours(addDays(weekStart, dayOffset), hour), 0)
        return {
          starts_at: startsAt.toISOString(),
          ends_at: setMinutes(setHours(addDays(weekStart, dayOffset), hour + 1), 0).toISOString(),
        }
      })
      const { data, error } = await (supabase as any).rpc('submit_pp_availability', {
        p_demand_id: id,
        p_slots: slots,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pp', 'demands'] })
      if (demand?.demand_type === 'continuidade') {
        router.replace('/(app)/agenda')
      } else {
        router.replace(`/(app)/pacientes/${demand?.patient_id}`)
      }
    },
  })

  const toggle = (key: CellKey) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#095742" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-2">
            <ArrowLeft size={22} color="#095742" />
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">Agendar atendimento</Text>
        </View>
      </PageHeader>

      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-28">
        <Text className="text-sm text-muted-foreground">
          Selecione horários disponíveis. A família escolherá uma opção.
        </Text>

        {WEEKDAY_LABELS.map((label, dayOffset) => (
          <View key={label} className="gap-2">
            <Text className="text-xs font-semibold uppercase text-muted-foreground">
              {label} · {format(addDays(weekStart, dayOffset), 'd/M', { locale: ptBR })}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {HOUR_OPTIONS.map((hour) => {
                const key = `${dayOffset}-${hour}` as CellKey
                const active = selected.has(key)
                return (
                  <Pressable
                    key={key}
                    onPress={() => toggle(key)}
                    className={`rounded-lg border px-3 py-2 ${active ? 'border-primary bg-primary/10' : 'border-border bg-card'}`}
                  >
                    <Text className={`text-sm ${active ? 'text-primary font-semibold' : 'text-foreground'}`}>
                      {String(hour).padStart(2, '0')}:00
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-border bg-background px-4 py-4">
        <Button
          onPress={() => submitMutation.mutate()}
          loading={submitMutation.isPending}
          disabled={selected.size === 0}
          className="w-full"
        >
          Enviar opções ao paciente
        </Button>
      </View>
    </SafeAreaView>
  )
}
