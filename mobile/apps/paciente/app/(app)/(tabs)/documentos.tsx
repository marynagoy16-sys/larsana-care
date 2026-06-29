import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { FileStack, Layers, List, SquareStack } from 'lucide-react-native'
import { KpiCard } from '@/components/ui/KpiCard'
import { supabase } from '@/lib/supabase'

export default function DocumentosScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['paciente', 'documents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('patient_documents').select('*')
      if (error) throw error
      const rows = data ?? []
      return { data: rows, count: rows.length }
    },
  })

  const docs = data?.data ?? []
  const count = data?.count ?? 0

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#17310A" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-3 pb-28">
          <View className="flex-row flex-wrap gap-2">
            <KpiCard label="Total" value={String(count)} icon={SquareStack} description="Documentos" />
            <KpiCard label="Registros" value={String(count)} icon={FileStack} description="Sem filtro aplicado" />
            <KpiCard label="Nesta página" value={String(count)} icon={List} description={count === 0 ? 'Nenhum registro' : `1–${count} de ${count}`} />
            <KpiCard label="Páginas" value="1" icon={Layers} description="—" />
          </View>
          {docs.length === 0 ? (
            <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
              <Text className="text-center text-sm text-muted-foreground">Nenhum documento encontrado.</Text>
            </View>
          ) : (
            docs.map((doc: any) => (
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
