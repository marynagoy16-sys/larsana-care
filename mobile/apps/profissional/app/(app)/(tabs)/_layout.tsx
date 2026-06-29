import { Tabs } from 'expo-router'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ClipboardPlus,
  Home,
  MapPin,
  User,
  Wallet,
} from 'lucide-react-native'
import { cn } from '@/lib/cn'

const TAB_ITEMS = [
  { name: 'inicio', label: 'Início', href: '/(app)/(tabs)/inicio', Icon: Home },
  { name: 'demandas', label: 'Demandas', href: '/(app)/(tabs)/demandas', Icon: MapPin },
  { name: 'evolucao', label: 'Evolução', href: '/(app)/(tabs)/evolucao', Icon: ClipboardPlus, fab: true },
  { name: 'repasses', label: 'Repasses', href: '/(app)/(tabs)/repasses', Icon: Wallet },
  { name: 'perfil', label: 'Perfil', href: '/(app)/(tabs)/perfil', Icon: User },
] as const

function LarsanaTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()

  return (
    <View
      className="border-t border-border bg-card/95"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      <View className="flex-row items-end justify-around px-2 pt-2">
        {TAB_ITEMS.map((item, index) => {
          const isFocused = state.index === index
          const TabIcon = item.Icon

          if ('fab' in item && item.fab) {
            return (
              <Pressable
                key={item.name}
                onPress={() => navigation.navigate(item.name)}
                className="-mt-6 items-center"
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View className="h-14 w-14 items-center justify-center rounded-full bg-primary shadow-md">
                  <TabIcon size={24} color="#fff" />
                </View>
                <Text className="mt-1 text-[10px] font-bold text-primary">{item.label}</Text>
              </Pressable>
            )
          }

          return (
            <Pressable
              key={item.name}
              onPress={() => navigation.navigate(item.name)}
              className="min-w-[56px] items-center gap-0.5 px-1"
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <TabIcon size={22} color={isFocused ? '#17310A' : '#5A7920'} />
              <Text
                className={cn(
                  'max-w-[64px] truncate text-[10px]',
                  isFocused ? 'font-bold text-nav-icon' : 'text-muted-foreground',
                )}
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
    <Tabs
      tabBar={(props) => <LarsanaTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="inicio" options={{ title: 'Início' }} />
      <Tabs.Screen name="demandas" options={{ title: 'Demandas' }} />
      <Tabs.Screen name="evolucao" options={{ title: 'Evolução' }} />
      <Tabs.Screen name="repasses" options={{ title: 'Repasses' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil' }} />
    </Tabs>
  )
}
