import { useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import {
  getEvolutionSessionContext,
  ppEvolutionsQueryKeys,
} from '@/services/ppEvolutions'
import {
  createMedicalRecord,
  getPPProfessionalCrefito,
} from '@/services/medicalRecords'
import { supabase } from '@/lib/supabase'

export default function EvolucaoNovaScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { session } = useLocalSearchParams<{ session?: string }>()
  const sessionId = session ?? undefined

  const [contentRichtext, setContentRichtext] = useState('')
  const [error, setError] = useState('')

  const { data: sessionContext } = useQuery({
    queryKey: [...ppEvolutionsQueryKeys.pending, 'session', sessionId],
    queryFn: () => getEvolutionSessionContext(sessionId!),
    enabled: !!sessionId,
  })

  const { data: defaultCrefito } = useQuery({
    queryKey: ['pp', 'crefito'],
    queryFn: getPPProfessionalCrefito,
  })

  const { data: professional } = useQuery({
    queryKey: ['pp', 'current_professional'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data, error } = await supabase
        .from('professionals')
        .select('id, full_name')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!contentRichtext.trim()) throw new Error('Evolução clínica é obrigatória')
      const crefito = defaultCrefito?.trim()
      if (!crefito) throw new Error('CREFITO não cadastrado no perfil')
      if (!professional?.id) throw new Error('Profissional não encontrado')

      const patientId = sessionContext?.patientId ?? ''
      if (!patientId) throw new Error('Paciente não encontrado')

      return createMedicalRecord({
        patient_id: patientId,
        professional_id: professional.id,
        content_richtext: contentRichtext.trim(),
        crefito_number: crefito,
        record_type: 'evolucao',
        session_id: sessionContext?.sessionId ?? null,
        cycle_id: sessionContext?.cycleId ?? null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ppEvolutionsQueryKeys.pending })
      router.back()
    },
  })

  const loading = !sessionContext && !!sessionId

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-2">
            <ArrowLeft size={22} color="#095742" />
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">Nova evolução</Text>
        </View>
      </PageHeader>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#095742" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-8">
          <View className="rounded-xl border border-border bg-card p-4">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Paciente
            </Text>
            {sessionContext ? (
              <View className="mt-2 rounded-lg border border-border bg-muted/40 px-4 py-3">
                <Text className="text-sm font-medium text-foreground">
                  {sessionContext.patientName}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Ciclo {sessionContext.cycleNumber} · Terapia #{sessionContext.sessionNumber}
                </Text>
              </View>
            ) : (
              <Text className="mt-2 text-sm text-muted-foreground">—</Text>
            )}
          </View>

          <View className="rounded-xl border border-border bg-card p-4">
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Evolução clínica
            </Text>
            <TextInput
              value={contentRichtext}
              onChangeText={setContentRichtext}
              placeholder="Descreva a evolução clínica do paciente"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="mt-2 rounded-lg border border-border bg-background p-3 text-sm text-foreground"
              style={{ minHeight: 120 }}
            />
          </View>

          {(professional?.full_name || defaultCrefito) ? (
            <View>
              <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Profissional
              </Text>
              <View className="mt-2 rounded-xl border border-border bg-card p-4">
                <Text className="text-sm font-medium text-foreground">
                  {professional?.full_name ?? '—'}
                </Text>
                {defaultCrefito ? (
                  <Text className="mt-0.5 text-sm text-muted-foreground">CREFITO {defaultCrefito}</Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {error ? (
            <Text className="text-center text-sm text-red-600">{error}</Text>
          ) : null}
          {createMutation.error ? (
            <Text className="text-center text-sm text-red-600">
              {createMutation.error instanceof Error ? createMutation.error.message : 'Erro ao salvar'}
            </Text>
          ) : null}

          <Button
            variant="default"
            onPress={() => {
              setError('')
              createMutation.mutate()
            }}
            loading={createMutation.isPending}
            className="w-full"
          >
            Salvar evolução
          </Button>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
