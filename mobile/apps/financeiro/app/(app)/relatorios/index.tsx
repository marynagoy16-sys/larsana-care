import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { BarChart3, ChevronRight, Clock } from 'lucide-react-native'
import { SubScreenHeader } from '@/components/layout/SubScreenHeader'
import { Card } from '@/components/ui/Card'

const REPORTS = [
  {
    title: 'Faturamento',
    subtitle: 'Cobranças por período com breakdown por status',
    href: '/(app)/relatorios/faturamento',
    icon: BarChart3,
  },
  {
    title: 'Repasses Aging',
    subtitle: 'Repasses pendentes ordenados por dias em aberto',
    href: '/(app)/relatorios/repasses-aging',
    icon: Clock,
  },
] as const

export default function RelatoriosHubScreen() {
  const router = useRouter()

  return (
    <View className="flex-1 bg-background">
      <SubScreenHeader title="Relatórios" />
      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-3 pb-8 pt-2">
        {REPORTS.map((report) => {
          const Icon = report.icon
          return (
            <Pressable key={report.href} onPress={() => router.push(report.href)}>
              <Card className="flex-row items-center gap-4 p-4">
                <View className="rounded-xl bg-primary/10 p-2.5">
                  <Icon size={22} color="#17310A" />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-base font-semibold text-foreground">{report.title}</Text>
                  <Text className="text-sm text-muted-foreground">{report.subtitle}</Text>
                </View>
                <ChevronRight size={20} color="#5A7920" />
              </Card>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}
