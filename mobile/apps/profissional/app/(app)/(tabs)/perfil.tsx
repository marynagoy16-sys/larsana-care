import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'

export default function PerfilTabScreen() {
  const { profile, signOut } = useAuth()

  const { data: professional, isLoading } = useQuery({
    queryKey: ['pp', 'profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data, error } = await supabase
        .from('professionals')
        .select('id, full_name, profession, credentialing_status, pp_class')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader title="Perfil" subtitle="Dados do profissional parceiro" />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#17310A" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-28">
          <View className="rounded-xl border border-border bg-card p-5 gap-3">
            <View>
              <Text className="text-xs text-muted-foreground">Nome</Text>
              <Text className="font-medium text-foreground">
                {professional?.full_name ?? profile?.full_name ?? '—'}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">E-mail</Text>
              <Text className="font-medium text-foreground">{profile?.email ?? '—'}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">Profissão</Text>
              <Text className="font-medium text-foreground">{professional?.profession ?? '—'}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">Classe</Text>
              <Text className="font-medium text-foreground">{professional?.pp_class ?? '—'}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">Credenciamento</Text>
              <Text className="font-medium text-foreground">
                {professional?.credentialing_status ?? '—'}
              </Text>
            </View>
          </View>

          <Button variant="outline" onPress={signOut} className="w-full">
            Sair
          </Button>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
