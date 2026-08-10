import { ScrollView, Text, View } from 'react-native'
import { SubScreenHeader } from '@/components/layout/SubScreenHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { Bell } from 'lucide-react-native'

export default function NotificacoesScreen() {
  return (
    <View className="flex-1 bg-background">
      <SubScreenHeader title="Notificações" />
      <ScrollView className="flex-1 px-4" contentContainerClassName="pb-8">
        <EmptyState
          title="Nenhuma notificação"
          description="Alertas financeiros e avisos aparecerão aqui."
        />
        <View className="items-center opacity-30">
          <Bell size={48} color="#49796B" />
        </View>
      </ScrollView>
    </View>
  )
}
