import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePathname, useRouter } from 'expo-router'
import { Bell } from 'lucide-react-native'
import { useAuth } from '@/providers/AuthProvider'

function getHeaderTitle(pathname: string, firstName: string): string {
  if (pathname.endsWith('/inicio')) return `Olá, ${firstName}`
  if (pathname.endsWith('/cobrancas')) return 'Cobranças'
  if (pathname.endsWith('/repasses')) return 'Repasses'
  if (pathname.endsWith('/caixa')) return 'Caixa'
  if (pathname.endsWith('/mais')) return 'Mais'
  if (pathname.endsWith('/notificacoes')) return 'Notificações'
  return 'Financeiro'
}

export function AppHeader() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const pathname = usePathname()
  const { profile } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'você'
  const title = getHeaderTitle(pathname, firstName)
  const onNotificacoes = pathname.endsWith('/notificacoes')

  return (
    <View className="border-b border-border/50 bg-background">
      <View
        className="flex-row items-center gap-3 px-4 pb-3"
        style={{ paddingTop: Math.max(insets.top, 10) }}
      >
        <View className="w-11" />
        <Text
          className="min-w-0 flex-1 text-center font-display text-lg font-bold leading-tight text-foreground"
          numberOfLines={1}
        >
          {title}
        </Text>
        <Pressable
          onPress={() => router.push('/(app)/notificacoes')}
          className="rounded-xl border border-border/60 bg-card p-2.5 active:bg-muted/40"
          accessibilityLabel="Notificações"
        >
          <Bell size={20} color={onNotificacoes ? '#095742' : '#49796B'} />
        </Pressable>
      </View>
    </View>
  )
}
