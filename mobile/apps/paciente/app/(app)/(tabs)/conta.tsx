import { useState } from 'react'
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { FileStack, Layers, List, LogOut, SquareStack } from 'lucide-react-native'
import { KpiCard } from '@/components/ui/KpiCard'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'

export default function ContaScreen() {
  const router = useRouter()
  const { signOut } = useAuth()
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
  const count = data?.count ?? 0
  const responsible = rows[0] as { full_name: string; email: string; phone: string } | undefined

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#17310A" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-3 pb-28">
          <View className="flex-row flex-wrap gap-2">
            <KpiCard label="Total" value={String(count)} icon={SquareStack} description="Responsável" />
            <KpiCard label="Registros" value={String(count)} icon={FileStack} description="Sem filtro aplicado" />
            <KpiCard label="Nesta página" value={String(count)} icon={List} description={count === 0 ? 'Nenhum registro' : `1–${count} de ${count}`} />
            <KpiCard label="Páginas" value="1" icon={Layers} description="—" />
          </View>
          {responsible ? (
            <View className="rounded-xl border border-border bg-card p-5 gap-3">
              <Text className="font-medium text-foreground">{responsible.full_name}</Text>
              <Text className="text-sm text-muted-foreground">{responsible.email}</Text>
              <Text className="text-sm text-muted-foreground">{responsible.phone}</Text>
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
            </View>
          ) : (
            <Text className="text-muted-foreground">Nenhum responsável cadastrado.</Text>
          )}
          <Button
            variant="outline"
            onPress={async () => {
              await signOut()
              router.replace('/(auth)/login')
            }}
          >
            <View className="flex-row items-center gap-2">
              <LogOut size={16} color="#17310A" />
              <Text className="font-semibold text-foreground">Sair</Text>
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
            <Button onPress={() => update.mutate()} loading={update.isPending}>Salvar</Button>
            <Button variant="outline" onPress={() => setOpen(false)}>Cancelar</Button>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
