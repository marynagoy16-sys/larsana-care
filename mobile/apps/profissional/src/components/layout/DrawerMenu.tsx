import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  Bell,
  Calendar,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileCheck,
  GraduationCap,
  LogOut,
  MapPin,
  Menu,
  Shield,
  Stethoscope,
  TrendingUp,
  User,
  Wallet,
  X,
} from 'lucide-react-native'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/shared/Logo'

interface DrawerItem {
  label: string
  href: string
  icon: typeof Calendar
}

interface DrawerSection {
  title: string
  icon: typeof Calendar
  items: DrawerItem[]
}

interface DrawerMenuProps {
  open: boolean
  onClose: () => void
}

interface AppHeaderProps {
  onMenuPress: () => void
}

const DRAWER_SECTIONS: DrawerSection[] = [
  {
    title: 'Hoje',
    icon: Calendar,
    items: [
      { label: 'Início', href: '/(app)/(tabs)/inicio', icon: Calendar },
      { label: 'Agenda', href: '/(app)/agenda', icon: Calendar },
      { label: 'Demandas', href: '/(app)/(tabs)/demandas', icon: MapPin },
    ],
  },
  {
    title: 'Formação',
    icon: GraduationCap,
    items: [
      { label: 'Academy', href: '/(app)/academy', icon: GraduationCap },
      { label: 'Certificados', href: '/(app)/academy/certificados', icon: FileCheck },
    ],
  },
  {
    title: 'Clínico',
    icon: Stethoscope,
    items: [
      { label: 'Evoluções pendentes', href: '/(app)/(tabs)/evolucao', icon: ClipboardList },
      { label: 'Meus pacientes', href: '/(app)/pacientes', icon: User },
      { label: 'Avaliações', href: '/(app)/avaliacoes', icon: FileCheck },
    ],
  },
  {
    title: 'Financeiro',
    icon: Wallet,
    items: [
      { label: 'Repasses', href: '/(app)/(tabs)/repasses', icon: Wallet },
      { label: 'Simulador de ganhos', href: '/(app)/simulador', icon: TrendingUp },
    ],
  },
  {
    title: 'Conta',
    icon: User,
    items: [
      { label: 'Credenciamento', href: '/(app)/credenciamento', icon: Shield },
      { label: 'Cartão de visita', href: '/(app)/cartao', icon: CreditCard },
      { label: 'Notificações', href: '/(app)/notificacoes', icon: Bell },
      { label: 'Perfil', href: '/(app)/(tabs)/perfil', icon: User },
    ],
  },
]

export function DrawerMenu({ open, onClose }: DrawerMenuProps) {
  const router = useRouter()
  const { signOut } = useAuth()

  const handleNavigate = (href: string) => {
    onClose()
    router.push(href as any)
  }

  const handleSignOut = async () => {
    await signOut()
    onClose()
    router.replace('/(auth)/login')
  }

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 flex-row">
        <SafeAreaView className="h-full w-[80%] max-w-[320px] bg-card" edges={['top', 'bottom']}>
          <View className="flex-1">
            <View className="flex-row items-center justify-between border-b border-border/50 px-4 py-4">
              <Logo subtitle="Profissional" />
              <Pressable onPress={onClose} className="p-2">
                <X size={20} color="#5A7920" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 p-3">
              {DRAWER_SECTIONS.map((section) => {
                const SectionIcon = section.icon
                return (
                  <View key={section.title} className="mb-4">
                    <View className="flex-row items-center gap-2 px-2 py-2">
                      <SectionIcon size={16} color="#5A7920" />
                      <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {section.title}
                      </Text>
                    </View>
                    <View className="gap-0.5">
                      {section.items.map((item) => {
                        const ItemIcon = item.icon
                        return (
                          <Pressable
                            key={item.label}
                            onPress={() => handleNavigate(item.href)}
                            className="flex-row items-center gap-3 rounded-lg px-3 py-2.5 active:bg-muted/40"
                          >
                            <ItemIcon size={16} color="#17310A" />
                            <Text className="flex-1 text-sm text-foreground">{item.label}</Text>
                            <ChevronRight size={14} color="#5A7920" />
                          </Pressable>
                        )
                      })}
                    </View>
                  </View>
                )
              })}
            </ScrollView>

            <View className="border-t border-border/80 p-3">
              <Button variant="outline" onPress={handleSignOut} className="w-full">
                <LogOut size={16} color="#5A7920" />
                <Text className="ml-2 text-sm">Sair</Text>
              </Button>
            </View>
          </View>
        </SafeAreaView>

        <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      </View>
    </Modal>
  )
}

export function AppHeader({ onMenuPress }: AppHeaderProps) {
  const insets = useSafeAreaInsets()
  return (
    <View className="border-b border-border bg-background">
      <View style={{ paddingTop: Math.max(insets.top, 8) }} className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={onMenuPress} className="p-2">
          <Menu size={22} color="#17310A" />
        </Pressable>
        <Text className="font-display text-base font-bold text-foreground">Olá, Profissional</Text>
        <Pressable className="relative p-2">
          <Bell size={20} color="#17310A" />
          <View className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
        </Pressable>
      </View>
    </View>
  )
}
