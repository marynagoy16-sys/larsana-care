import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/shared/Logo'
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
        <Logo />
        <Text className="text-center text-lg font-semibold text-foreground">
          Este app é exclusivo para Profissionais Parceiros
        </Text>
        <Text className="text-center text-sm text-muted-foreground">
          Sua conta ({role ?? 'outro perfil'}) deve acessar a versão web em app.larsanacare.com.br
        </Text>
        <Button onPress={handleSignOut} variant="outline" className="w-full max-w-sm">
          Sair e usar outra conta
        </Button>
      </View>
    </SafeAreaView>
  )
}
