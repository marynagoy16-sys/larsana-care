import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { FileStack } from 'lucide-react-native'
import { supabase } from '@/lib/supabase'

export default function DocumentosScreen() {
  const { data: hubItems = [], isLoading: hubLoading } = useQuery({
    queryKey: ['paciente', 'legal-hub'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('get_legal_documents_hub', { p_profile: 'paciente' })
      if (error) throw error
      return (data ?? []) as Array<{ term_id: string; title: string; version: string; term_type: string; accepted_at: string | null }>
    },
  })

  const { data: patientDocs, isLoading: docsLoading } = useQuery({
    queryKey: ['paciente', 'documents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('patient_documents').select('*')
      if (error) throw error
      return data ?? []
    },
  })

  const isLoading = hubLoading || docsLoading

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#095742" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-3 pb-28">
          <Text className="text-base font-semibold text-foreground pt-2">Termos e políticas</Text>
          {hubItems.length === 0 ? (
            <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-6">
              <Text className="text-center text-sm text-muted-foreground">Nenhum termo publicado.</Text>
            </View>
          ) : (
            hubItems.map((item) => (
              <View key={item.term_id} className="rounded-xl border border-border bg-card px-4 py-4">
                <Text className="font-medium text-foreground">{item.title}</Text>
                <Text className="mt-0.5 text-xs text-muted-foreground">Versão {item.version}</Text>
                <Text className="mt-1 text-xs text-muted-foreground">
                  {item.accepted_at ? `Aceito em ${new Date(item.accepted_at).toLocaleString('pt-BR')}` : 'Sem aceite registrado'}
                </Text>
              </View>
            ))
          )}

          <Text className="text-base font-semibold text-foreground pt-4">Seus arquivos</Text>
          {(patientDocs ?? []).length === 0 ? (
            <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-6 flex-row items-center gap-2 justify-center">
              <FileStack size={18} color="#64748b" />
              <Text className="text-sm text-muted-foreground">Nenhum documento enviado.</Text>
            </View>
          ) : (
            (patientDocs ?? []).map((doc: any) => (
              <View key={doc.id} className="rounded-xl border border-border bg-card px-4 py-4">
                <Text className="font-medium text-foreground">{doc.file_name ?? doc.document_type}</Text>
                <Text className="mt-0.5 text-xs text-muted-foreground">{doc.document_type}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
