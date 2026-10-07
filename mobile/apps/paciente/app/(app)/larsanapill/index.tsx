import { useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Bell } from 'lucide-react-native'
import { SubScreenHeader } from '@/components/layout/SubScreenHeader'
import { Button } from '@/components/ui/Button'

export default function LarsanaPillHubScreen() {
  const [notified, setNotified] = useState(false)

  const askNotify = () => {
    setNotified(true)
    Alert.alert('LarsanaPill', 'Avisaremos quando o LarsanaPill estiver disponível.')
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <SubScreenHeader title="LarsanaPill" />
      <View className="px-4 py-4">
        <View className="overflow-hidden rounded-2xl border border-border bg-card">
          <View className="bg-primary px-6 py-8">
            <View className="self-start rounded-full bg-white/15 px-2 py-0.5">
              <Text className="text-[10.5px] font-semibold text-white">Em breve</Text>
            </View>
            <Text className="mt-4 text-2xl font-bold text-white">LarsanaPill</Text>
          </View>
          <View className="gap-5 px-6 py-6">
            <Text className="text-sm leading-5 text-muted-foreground">
              Em breve, um espaço com protocolo, orientações e materiais práticos para o seu dia a dia. Quer saber quando estiver disponível?
            </Text>
            <Button onPress={askNotify} disabled={notified}>
              <Bell size={16} color="#fff" />
              <Text className="text-base font-semibold text-primary-foreground">
                {notified ? 'Avisaremos você' : 'Avise-me'}
              </Text>
            </Button>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}
