import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  BarChart3,
  Bell,
  ChevronRight,
  FileSpreadsheet,
  LogOut,
} from 'lucide-react-native'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/providers/AuthProvider'

type MenuItem = {
  title: string
  subtitle: string
  icon: typeof BarChart3
  href?: string
  onPress?: () => void
  destructive?: boolean
}

export default function MaisScreen() {
  const router = useRouter()
  const { signOut } = useAuth()

  const items: MenuItem[] = [
    {
      title: 'Relatórios',
      subtitle: 'Faturamento e aging de repasses',
      icon: BarChart3,
      href: '/(app)/relatorios',
    },
    {
      title: 'Exportação DELUMA',
      subtitle: 'Gerar e consultar exports mensais',
      icon: FileSpreadsheet,
      href: '/(app)/exportacao-deluma',
    },
    {
      title: 'Notificações',
      subtitle: 'Alertas e avisos',
      icon: Bell,
      href: '/(app)/notificacoes',
    },
    {
      title: 'Sair',
      subtitle: 'Encerrar sessão',
      icon: LogOut,
      destructive: true,
      onPress: () => void signOut().then(() => router.replace('/(auth)/login')),
    },
  ]

  return (
    <ScrollView className="flex-1 px-4" contentContainerClassName="gap-3 pb-8 pt-2">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <Pressable
            key={item.title}
            onPress={() => {
              if (item.onPress) item.onPress()
              else if (item.href) router.push(item.href as any)
            }}
          >
            <Card className="flex-row items-center gap-4 p-4">
              <View className={`rounded-xl p-2.5 ${item.destructive ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                <Icon size={22} color={item.destructive ? '#DC2626' : '#17310A'} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className={`text-base font-semibold ${item.destructive ? 'text-destructive' : 'text-foreground'}`}>
                  {item.title}
                </Text>
                <Text className="text-sm text-muted-foreground">{item.subtitle}</Text>
              </View>
              {!item.destructive ? <ChevronRight size={20} color="#5A7920" /> : null}
            </Card>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
