import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/providers/AuthProvider'

export default function WrongRoleScreen() {
  const router = useRouter()
  const { signOut } = useAuth()

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background px-6">
      <View className="w-full max-w-md gap-4 rounded-xl border border-border bg-card p-6">
        <Text className="text-lg font-semibold text-foreground">Acesso não permitido</Text>
        <Text className="text-sm text-muted-foreground">
          Esta conta não tem perfil de paciente. Use o app correto para o seu perfil.
        </Text>
        <Button
          onPress={async () => {
            await signOut()
            router.replace('/(auth)/login')
          }}
        >
          Voltar ao login
        </Button>
      </View>
    </SafeAreaView>
  )
}
