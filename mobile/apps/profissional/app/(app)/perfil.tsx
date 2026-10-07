import { useEffect, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ChevronRight, Shield } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/providers/AuthProvider'
import { supabase } from '@/lib/supabase'

const ASAAS_SIGNUP_URL = 'https://www.asaas.com/onboarding/createAccount'

export default function PerfilScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { profile, signOut } = useAuth()
  const [walletId, setWalletId] = useState('')

  const { data: professional, isLoading } = useQuery({
    queryKey: ['pp', 'profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data, error } = await supabase
        .from('professionals')
        .select('id, full_name, profession, credentialing_status, pp_class, asaas_wallet_id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  useEffect(() => {
    if (professional?.asaas_wallet_id) setWalletId(professional.asaas_wallet_id)
  }, [professional?.asaas_wallet_id])

  const saveWallet = useMutation({
    mutationFn: async () => {
      if (!professional?.id) throw new Error('Profissional não encontrado')
      const trimmed = walletId.trim()
      const { error } = await supabase
        .from('professionals')
        .update({ asaas_wallet_id: trimmed || null })
        .eq('id', professional.id)
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['pp', 'profile'] })
    },
  })

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <PageHeader title="Perfil" subtitle="Dados do profissional parceiro" />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#095742" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-8">
          <View className="rounded-xl border border-border bg-card p-5 gap-3">
            <View>
              <Text className="text-xs text-muted-foreground">Nome</Text>
              <Text className="font-medium text-foreground">
                {professional?.full_name ?? profile?.full_name ?? '—'}
              </Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">E-mail</Text>
              <Text className="font-medium text-foreground">{profile?.email ?? '—'}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">Profissão</Text>
              <Text className="font-medium text-foreground">{professional?.profession ?? '—'}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">Classe</Text>
              <Text className="font-medium text-foreground">{professional?.pp_class ?? '—'}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">Credenciamento</Text>
              <Text className="font-medium text-foreground">
                {professional?.credentialing_status ?? '—'}
              </Text>
            </View>
          </View>

          <View className="rounded-xl border border-border bg-card p-5 gap-2">
            <Text className="text-xs text-muted-foreground">Wallet ID Asaas</Text>
            <Text className="text-xs text-muted-foreground">
              Crie sua conta Asaas e cole o wallet ID da versão web. Sem ele o repasse não é enviado.
            </Text>
            <TextInput
              value={walletId}
              onChangeText={setWalletId}
              placeholder="wallet ID"
              autoCapitalize="none"
              className="rounded-lg border border-border px-3 py-2 text-foreground"
            />
            <Button
              onPress={() => saveWallet.mutate()}
              disabled={saveWallet.isPending}
            >
              {saveWallet.isPending ? 'Salvando…' : 'Salvar wallet'}
            </Button>
            <Pressable onPress={() => Linking.openURL(ASAAS_SIGNUP_URL)}>
              <Text className="text-xs text-primary underline">Criar conta no Asaas</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push('/(app)/credenciamento')}
            className="flex-row items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 active:bg-muted/30"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Shield size={18} color="#095742" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="font-medium text-foreground">Credenciamento</Text>
              <Text className="text-xs text-muted-foreground">
                Documentos, conselho e dados bancários
              </Text>
            </View>
            <ChevronRight size={18} color="#49796B" />
          </Pressable>

          <Button variant="outline" onPress={signOut} className="w-full">
            Sair
          </Button>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
