import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { getCurrentProfessionalId, getCertificates } from '@/services/academy'
import { formatDateTime } from '@/lib/formatters'

export default function AcademyCertificatesScreen() {
  const profQuery = useQuery({
    queryKey: ['pp', 'professionalId'],
    queryFn: getCurrentProfessionalId,
  })

  const certificatesQuery = useQuery({
    queryKey: ['academy', 'certificates'],
    queryFn: async () => {
      const id = profQuery.data
      if (!id) return []
      return getCertificates(id)
    },
    enabled: !!profQuery.data,
  })

  const loading = profQuery.isLoading || certificatesQuery.isLoading
  const certificates = certificatesQuery.data ?? []

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <PageHeader title="Certificados" subtitle="Conquistas na Academy" />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#095742" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-3 pb-8">
          {certificates.length === 0 ? (
            <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
              <Text className="text-center text-sm text-muted-foreground">
                Você ainda não concluiu nenhum curso. Continue estudando!
              </Text>
            </View>
          ) : (
            certificates.map((cert) => (
              <View key={cert.id} className="rounded-xl border border-border bg-card p-4">
                <Text className="font-medium text-foreground">{cert.course_title}</Text>
                <Text className="mt-1 text-xs text-muted-foreground">
                  Concluído em {formatDateTime(cert.issued_at)}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
