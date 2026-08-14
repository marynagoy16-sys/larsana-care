import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import {
  Bell,
  ChevronRight,
  LogOut,
  Shield,
  TrendingUp,
  Trophy,
  User,
  Wallet,
} from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'

type MenuItem = {
  label: string
  href: string
  Icon: typeof User
  description?: string
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Minha jornada', href: '/(app)/minha-evolucao', Icon: Trophy, description: 'Pontos, patente e percentual de repasse' },
  { label: 'Repasses', href: '/(app)/repasses', Icon: Wallet, description: 'Ganhos por ciclo liberados pela Larsana' },
  { label: 'Simulador de ganhos', href: '/(app)/simulador', Icon: TrendingUp, description: 'Estimativa com base no histórico' },
  { label: 'Credenciamento', href: '/(app)/credenciamento', Icon: Shield, description: 'Documentos, conselho e dados bancários' },
  { label: 'Notificações', href: '/(app)/notificacoes', Icon: Bell, description: 'Alertas e avisos importantes' },
  { label: 'Perfil', href: '/(app)/perfil', Icon: User, description: 'Dados do profissional parceiro' },
]

export default function ContaTabScreen() {
  const router = useRouter()
  const { profile, signOut } = useAuth()

  const { data: professional, isLoading } = useQuery({
    queryKey: ['pp', 'profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data, error } = await supabase
        .from('professionals')
        .select('id, full_name, profession, credentialing_status')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader title="Conta" subtitle="Financeiro, credenciamento e perfil" />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#095742" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-28">
          <View className="rounded-xl border border-border bg-card p-5 gap-3">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User size={22} color="#095742" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="font-display text-lg font-bold text-foreground" numberOfLines={1}>
                  {professional?.full_name ?? profile?.full_name ?? 'Profissional'}
                </Text>
                <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                  {profile?.email ?? '—'}
                </Text>
              </View>
            </View>
            {professional?.profession ? (
              <Text className="text-sm text-muted-foreground">{professional.profession}</Text>
            ) : null}
          </View>

          <View className="rounded-xl border border-border bg-card overflow-hidden">
            {MENU_ITEMS.map((item, index) => {
              const ItemIcon = item.Icon
              return (
                <Pressable
                  key={item.href}
                  onPress={() => router.push(item.href as '/(app)/repasses')}
                  className={`flex-row items-center gap-3 px-4 py-3.5 active:bg-muted/40 ${
                    index < MENU_ITEMS.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <ItemIcon size={20} color="#095742" />
                  <View className="flex-1 min-w-0">
                    <Text className="font-medium text-foreground">{item.label}</Text>
                    {item.description ? (
                      <Text className="text-xs text-muted-foreground">{item.description}</Text>
                    ) : null}
                  </View>
                  <ChevronRight size={18} color="#49796B" />
                </Pressable>
              )
            })}
          </View>

          <Button
            variant="outline"
            className="border-destructive/30"
            onPress={async () => {
              await signOut()
              router.replace('/(auth)/login')
            }}
          >
            <View className="flex-row items-center gap-2">
              <LogOut size={16} color="#dc2626" />
              <Text className="font-semibold text-destructive">Sair</Text>
            </View>
          </Button>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
