import { Redirect, Stack, usePathname } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuth, isFinanceRole } from '@/providers/AuthProvider'
import { AppHeader } from '@/components/layout/DrawerMenu'
import { cn } from '@/lib/cn'

const TAB_SUFFIXES = ['/inicio', '/cobrancas', '/repasses', '/caixa', '/mais']

export default function AppLayout() {
  const { session, role, loading } = useAuth()
  const pathname = usePathname()
  const showAppHeader = TAB_SUFFIXES.some((suffix) => pathname.endsWith(suffix))

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#095742" />
      </View>
    )
  }

  if (!session) return <Redirect href="/(auth)/login" />
  if (role === null) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#095742" />
      </View>
    )
  }
  if (!isFinanceRole(role)) return <Redirect href="/(auth)/wrong-role" />

  return (
    <View className="flex-1 bg-background">
      {showAppHeader ? <AppHeader /> : null}
      <View className={cn('flex-1', showAppHeader && 'pt-4')}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </View>
  )
}
