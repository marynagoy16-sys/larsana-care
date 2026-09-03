import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { loadCredentialingSnapshot } from '@/services/credentialing'
import { supabase } from '@/lib/supabase'

const PP_TERM_TYPES = [
  'TERMO_USO_PP',
  'DIRETRIZES_PP',
  'LGPD_PP',
  'ANEXO_III_CATEGORIAS_PP',
  'ANEXO_IV_SIGILO_PP',
  'ANEXO_I_COMERCIAL_PP',
  'ANEXO_II_OPERACIONAL_PP',
]

export default function CredenciamentoScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['pp', 'credentialing'],
    queryFn: loadCredentialingSnapshot,
  })

  const { data: legalTerms = [] } = useQuery({
    queryKey: ['pp', 'credentialing-legal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('legal_terms')
        .select('term_type, version, title')
        .in('term_type', PP_TERM_TYPES)
        .eq('is_current', true)
      if (error) throw error
      return data ?? []
    },
  })

  const accepted = new Set(data?.acceptedTermTypes ?? [])

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <PageHeader title="Credenciamento" subtitle="Status, documentos e termos" />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#095742" />
        </View>
      ) : !data ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-muted-foreground">Dados não encontrados.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-8">
          <View className="rounded-xl border border-border bg-card p-5 gap-2">
            <Text className="font-medium text-foreground">Status</Text>
            <Text className="text-sm text-foreground">{data.professional.credentialing_status ?? '—'}</Text>
            <Text className="text-xs text-muted-foreground">
              Credenciamento completo no portal web: /profissional/credenciamento
            </Text>
          </View>

          <View className="rounded-xl border border-border bg-card p-5 gap-3">
            <Text className="font-medium text-foreground">Termos e anexos</Text>
            {legalTerms.map((term) => {
              const ok = accepted.has(term.term_type)
                || (term.term_type === 'TERMO_USO_PP' && accepted.has('DIRETRIZES_PP'))
                || (term.term_type === 'DIRETRIZES_PP' && accepted.has('TERMO_USO_PP'))
              return (
                <View key={term.term_type} className="flex-row items-center justify-between">
                  <Text className="text-sm text-foreground flex-1 pr-2">{term.title}</Text>
                  <Text className={`text-xs font-medium ${ok ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {ok ? 'Aceito' : 'Pendente'}
                  </Text>
                </View>
              )
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
