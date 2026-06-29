import { Redirect, Stack, usePathname } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '@/providers/AuthProvider'
import { AppHeader } from '@/components/layout/DrawerMenu'
import { cn } from '@/lib/cn'

function useLarsanaPillImmersive(): boolean {
  const pathname = usePathname()
  return pathname.includes('larsanapill')
}

export default function AppLayout() {
  const { session, role, loading } = useAuth()
  const larsanaPillImmersive = useLarsanaPillImmersive()

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#17310A" />
      </View>
    )
  }

  if (!session) return <Redirect href="/(auth)/login" />
  if (role === null) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#17310A" />
      </View>
    )
  }
  if (role !== 'paciente') return <Redirect href="/(auth)/wrong-role" />

  return (
    <View className="flex-1 bg-background">
      {!larsanaPillImmersive ? <AppHeader /> : null}
      <View className={cn('flex-1', !larsanaPillImmersive && 'pt-4')}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </View>
  )
}
