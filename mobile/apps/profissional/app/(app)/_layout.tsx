import { useState } from 'react'
import { Redirect, Stack } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '@/providers/AuthProvider'
import { AppHeader, DrawerMenu } from '@/components/layout/DrawerMenu'

export default function AppLayout() {
  const { session, role, loading } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

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

  if (role !== 'pp') return <Redirect href="/(auth)/wrong-role" />

  return (
    <View className="flex-1">
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  )
}
