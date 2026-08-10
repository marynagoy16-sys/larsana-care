import { Tabs, usePathname, useRouter } from 'expo-router'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import type { LucideIcon } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  CreditCard,
  FileText,
  Heart,
  HelpCircle,
  Home,
  Pill,
  User,
} from 'lucide-react-native'
import { cn } from '@/lib/cn'

type TabItem =
  | { name: string; label: string; Icon: LucideIcon; kind: 'tab' }
  | { name: string; label: string; Icon: LucideIcon; kind: 'fab'; href: string }

// Alinhado à web: 7 itens, LarsanaPill no centro
const TAB_ITEMS: TabItem[] = [
  { name: 'inicio', label: 'Início', Icon: Home, kind: 'tab' },
  { name: 'pagamentos', label: 'Pagar', Icon: CreditCard, kind: 'tab' },
  { name: 'tratamento', label: 'Tratam.', Icon: Heart, kind: 'tab' },
  { name: 'larsanapill', label: 'LarsanaPill', Icon: Pill, kind: 'fab', href: '/(app)/larsanapill' },
  { name: 'documentos', label: 'Docs', Icon: FileText, kind: 'tab' },
  { name: 'ajuda', label: 'Ajuda', Icon: HelpCircle, kind: 'tab' },
  { name: 'conta', label: 'Conta', Icon: User, kind: 'tab' },
]

function PacienteTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const pathname = usePathname()
  const activeRoute = state.routes[state.index]?.name

  return (
    <View
      className="border-t border-border bg-card/95"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}
    >
      <View className="flex-row items-end px-1 pt-2">
        {TAB_ITEMS.map((item) => {
          const TabIcon = item.Icon

          if (item.kind === 'fab') {
            const isActive = pathname.includes('larsanapill')
            return (
              <View key={item.name} className="flex-1 items-center">
                <Pressable
                  onPress={() => router.push(item.href as '/(app)/larsanapill')}
                  className="-mt-6 items-center"
                  accessibilityRole="button"
                  accessibilityLabel="LarsanaPill"
                >
                  <View
                    className={cn(
                      'h-14 w-14 items-center justify-center rounded-full bg-primary shadow-md',
                      isActive && 'ring-4 ring-primary/25',
                    )}
                  >
                    <TabIcon size={24} color="#fff" />
                  </View>
                  <Text
                    className="mt-1 text-center text-[8px] font-bold text-primary"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              </View>
            )
          }

          const isFocused = activeRoute === item.name

          return (
            <Pressable
              key={item.name}
              onPress={() => navigation.navigate(item.name)}
              className="flex-1 items-center gap-0.5 pb-1"
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <TabIcon size={20} color={isFocused ? '#095742' : '#49796B'} />
              <Text
                className={cn(
                  'w-full text-center text-[9px]',
                  isFocused ? 'font-bold text-nav-icon' : 'text-muted-foreground',
                )}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {item.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <PacienteTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="inicio" options={{ title: 'Início' }} />
      <Tabs.Screen name="pagamentos" options={{ title: 'Pagamentos' }} />
      <Tabs.Screen name="tratamento" options={{ title: 'Tratamento' }} />
      <Tabs.Screen name="documentos" options={{ title: 'Documentos' }} />
      <Tabs.Screen name="ajuda" options={{ title: 'Ajuda' }} />
      <Tabs.Screen name="notificacoes" options={{ href: null }} />
      <Tabs.Screen name="conta" options={{ title: 'Conta' }} />
    </Tabs>
  )
}
