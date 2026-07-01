import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '@/providers/AuthProvider'

export default function Index() {
  const { session, role, loading } = useAuth()

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

  if (role === 'pp') return <Redirect href="/(app)/(tabs)/inicio" />

  return <Redirect href="/(auth)/wrong-role" />
}
