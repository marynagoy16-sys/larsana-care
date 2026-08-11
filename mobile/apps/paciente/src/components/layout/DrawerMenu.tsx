import { Pressable, Text, View, useColorScheme } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePathname, useRouter } from 'expo-router'
import { Bell } from 'lucide-react-native'
import { Logo } from '@/components/shared/Logo'

function getHeaderTitle(pathname: string): string {
  if (pathname.includes('larsanapill')) return 'LarsanaPill'
  if (pathname.includes('/nps/')) return 'Sua avaliação'
  if (/\/pagamentos\/[^/]+$/.test(pathname)) return 'Pagamento'
  if (pathname.includes('/tratamento/ciclo/')) return 'Ciclo de tratamento'

  if (pathname.endsWith('/solicitar')) return 'Solicitar atendimento'
  if (pathname.endsWith('/pagamentos')) return 'Pagamentos'
  if (pathname.endsWith('/tratamento')) return 'Meu tratamento'
  if (pathname.endsWith('/documentos')) return 'Documentos'
  if (pathname.endsWith('/conta')) return 'Conta'
  if (pathname.endsWith('/proposta')) return 'Proposta'
  if (pathname.endsWith('/ajuda')) return 'Ajuda'
  if (pathname.endsWith('/notificacoes')) return 'Notificações'

  return 'Paciente'
}

export function AppHeader() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const pathname = usePathname()
  const colorScheme = useColorScheme()
  const onInicio = pathname.endsWith('/inicio')
  const onDark = colorScheme === 'dark'

  const title = getHeaderTitle(pathname)
  const onNotificacoes = pathname.endsWith('/notificacoes')

  return (
    <View className="border-b border-border/50 bg-background">
      <View
        className="flex-row items-center gap-3 px-4 pb-3"
        style={{ paddingTop: Math.max(insets.top, 10) }}
      >
        <View className="w-11" />
        {onInicio ? (
          <View className="min-w-0 flex-1 items-center justify-center">
            <Logo variant={onDark ? 'dark' : 'light'} horizontal />
          </View>
        ) : (
          <Text
            className="min-w-0 flex-1 text-center font-display text-lg font-bold leading-tight text-foreground"
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
        <Pressable
          onPress={() => router.push('/(app)/(tabs)/notificacoes')}
          className="rounded-xl border border-border/60 bg-card p-2.5 active:bg-muted/40"
          accessibilityLabel="Notificações"
        >
          <Bell size={20} color={onNotificacoes ? '#095742' : '#49796B'} />
        </Pressable>
      </View>
    </View>
  )
}
