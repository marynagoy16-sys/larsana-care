import { Tabs, usePathname, useRouter } from 'expo-router'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import type { LucideIcon } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Home, Heart, Pill, User, UserPlus } from 'lucide-react-native'
import { cn } from '@/lib/cn'

type TabItem =
  | { name: string; label: string; Icon: LucideIcon; kind: 'tab'; href?: string }
  | { name: string; label: string; Icon: LucideIcon; kind: 'fab'; href: string }

const TAB_ITEMS: TabItem[] = [
  { name: 'inicio', label: 'Início', Icon: Home, kind: 'tab' },
  { name: 'larsanapill', label: 'LarsanaPill', Icon: Pill, kind: 'tab', href: '/(app)/larsanapill' },
  { name: 'solicitar', label: 'Solicitar', Icon: UserPlus, kind: 'fab', href: '/(app)/(tabs)/solicitar' },
  { name: 'tratamento', label: 'Tratam.', Icon: Heart, kind: 'tab' },
  { name: 'conta', label: 'Conta', Icon: User, kind: 'tab' },
]

function glassTabButtonClass(isActive: boolean) {
  return cn(
    'h-10 w-10 items-center justify-center rounded-xl',
    isActive ? 'border border-primary/30 bg-primary/15' : 'bg-transparent',
  )
}

function PacienteTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const pathname = usePathname()
  const activeRoute = state.routes[state.index]?.name

  return (
    <View
      className="absolute inset-x-0 bottom-0 px-4"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
      pointerEvents="box-none"
    >
      <View className="mx-auto w-full max-w-[24rem] overflow-hidden rounded-[1.25rem] border border-white/30 bg-card/55 shadow-lg">
        <View className="flex-row items-end px-1.5 pb-2 pt-2.5">
          {TAB_ITEMS.map((item) => {
            const TabIcon = item.Icon

            if (item.kind === 'fab') {
              const isActive = pathname.includes('solicitar')
              return (
                <View key={item.name} className="flex-1 items-center">
                  <Pressable
                    onPress={() => router.push(item.href as '/(app)/(tabs)/solicitar')}
                    className="-mt-7 items-center"
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    <View
                      className={cn(
                        'h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-primary/90 shadow-lg',
                        isActive && 'ring-4 ring-background/50',
                      )}
                    >
                      <TabIcon size={24} color="#fff" />
                    </View>
                    <Text
                      className={cn(
                        'mt-1 text-center text-[9px] font-bold',
                        isActive ? 'text-nav-icon' : 'text-muted-foreground',
                      )}
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

            const isFocused = item.href ? pathname.includes(item.name) : activeRoute === item.name

            return (
              <Pressable
                key={item.name}
                onPress={() => (item.href ? router.push(item.href as '/(app)/larsanapill') : navigation.navigate(item.name))}
                className="flex-1 items-center gap-1 pb-0.5"
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View className={glassTabButtonClass(isFocused)}>
                  <TabIcon size={20} color={isFocused ? '#095742' : '#49796B'} />
                </View>
                <Text
                  className={cn(
                    'w-full text-center text-[10px]',
                    isFocused ? 'font-bold text-nav-icon' : 'text-muted-foreground',
                  )}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {item.label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <PacienteTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="inicio" options={{ title: 'Início' }} />
      <Tabs.Screen name="solicitar" options={{ title: 'Solicitar' }} />
      <Tabs.Screen name="tratamento" options={{ title: 'Tratamento' }} />
      <Tabs.Screen name="conta" options={{ title: 'Conta' }} />
      <Tabs.Screen name="notificacoes" options={{ href: null }} />
      <Tabs.Screen name="pagamentos" options={{ href: null }} />
      <Tabs.Screen name="documentos" options={{ href: null }} />
      <Tabs.Screen name="ajuda" options={{ href: null }} />
    </Tabs>
  )
}
