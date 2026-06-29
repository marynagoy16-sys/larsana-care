import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Logo } from '@/components/shared/Logo'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/providers/AuthProvider'

export default function WrongRoleScreen() {
  const { signOut, role } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView className="flex-1 bg-background px-6">
      <View className="flex-1 items-center justify-center gap-6">
        <Logo subtitle="Portal Financeiro" />
        <View className="items-center gap-2">
          <Text className="text-center font-display text-xl font-bold text-foreground">Acesso não permitido</Text>
          <Text className="text-center text-sm text-muted-foreground">
            Sua conta ({role ?? 'desconhecida'}) não tem permissão para acessar o app financeiro.
          </Text>
        </View>
        <Button onPress={() => void handleSignOut()} className="w-full max-w-sm">
          Voltar ao login
        </Button>
      </View>
    </SafeAreaView>
  )
}
