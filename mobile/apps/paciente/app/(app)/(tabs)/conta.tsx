import { useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import {
  Bell,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  LogOut,
  Pill,
  User,
} from 'lucide-react-native'
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
  { label: 'Pagamentos', href: '/(app)/(tabs)/pagamentos', Icon: CreditCard, description: 'PIX e boletos' },
  { label: 'Documentos', href: '/(app)/(tabs)/documentos', Icon: FileText, description: 'Termos e comprovantes' },
  {
    label: 'LarsanaPill',
    href: '/(app)/larsanapill',
    Icon: Pill,
    description: 'Exercícios e orientações em casa',
  },
  { label: 'Notificações', href: '/(app)/(tabs)/notificacoes', Icon: Bell, description: 'Alertas e avisos importantes' },
  { label: 'Ajuda', href: '/(app)/(tabs)/ajuda', Icon: HelpCircle, description: 'Suporte e FAQ' },
]

export default function ContaScreen() {
  const router = useRouter()
  const { signOut, profile } = useAuth()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['paciente', 'responsible'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_responsibles')
        .select('id, full_name, email, phone')
      if (error) throw error
      const rows = data ?? []
      return { data: rows, count: rows.length }
    },
  })

  const update = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('patient_responsibles')
        .update({ full_name: fullName, email, phone })
        .limit(1)
      if (error) throw error
    },
    onSuccess: () => {
      setOpen(false)
      queryClient.invalidateQueries({ queryKey: ['paciente', 'responsible'] })
    },
  })

  const rows = data?.data ?? []
  const responsible = rows[0] as { full_name: string; email: string; phone: string } | undefined

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#095742" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-28 py-4">
          <View className="rounded-xl border border-border bg-card p-5 gap-3">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User size={22} color="#095742" />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="font-display text-lg font-bold text-foreground" numberOfLines={1}>
                  {responsible?.full_name ?? profile?.full_name ?? 'Responsável'}
                </Text>
                <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                  {responsible?.email ?? profile?.email ?? '—'}
                </Text>
              </View>
            </View>
            {responsible?.phone ? (
              <Text className="text-sm text-muted-foreground">{responsible.phone}</Text>
            ) : null}
            {responsible ? (
              <Button
                variant="outline"
                onPress={() => {
                  setFullName(responsible.full_name)
                  setEmail(responsible.email)
                  setPhone(responsible.phone)
                  setOpen(true)
                }}
              >
                Editar responsável
              </Button>
            ) : (
              <Text className="text-sm text-muted-foreground">Nenhum responsável cadastrado.</Text>
            )}
          </View>

          <View className="rounded-xl border border-border bg-card overflow-hidden">
            {MENU_ITEMS.map((item, index) => {
              const ItemIcon = item.Icon
              return (
                <Pressable
                  key={item.href}
                  onPress={() => router.push(item.href as never)}
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
      <Modal visible={open} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="rounded-t-2xl bg-card p-5 gap-3">
            <Text className="text-lg font-semibold">Editar responsável</Text>
            <TextInput value={fullName} onChangeText={setFullName} placeholder="Nome" className="h-12 rounded-xl bg-muted px-4" />
            <TextInput value={email} onChangeText={setEmail} placeholder="E-mail" className="h-12 rounded-xl bg-muted px-4" />
            <TextInput value={phone} onChangeText={setPhone} placeholder="Telefone" className="h-12 rounded-xl bg-muted px-4" />
            <Button onPress={() => update.mutate()} loading={update.isPending}>
              Salvar
            </Button>
            <Button variant="outline" onPress={() => setOpen(false)}>
              Cancelar
            </Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
