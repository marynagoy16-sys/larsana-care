import { Tabs } from 'expo-router'
import { ArrowLeftRight, Banknote, Home, MoreHorizontal, Receipt } from 'lucide-react-native'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#17310A',
        tabBarInactiveTintColor: '#5A7920',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8D8',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cobrancas"
        options={{
          title: 'Cobranças',
          tabBarIcon: ({ color, size }) => <Receipt size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="repasses"
        options={{
          title: 'Repasses',
          tabBarIcon: ({ color, size }) => <ArrowLeftRight size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="caixa"
        options={{
          title: 'Caixa',
          tabBarIcon: ({ color, size }) => <Banknote size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mais"
        options={{
          title: 'Mais',
          tabBarIcon: ({ color, size }) => <MoreHorizontal size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
