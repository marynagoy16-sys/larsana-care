import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { SubScreenHeader } from '@/components/layout/SubScreenHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { listDelumaExports } from '@/services/deluma'
import { edgeFunctions } from '@/services/edgeFunctions'
import { formatDate, formatReferenceMonth, getCurrentMonthKey } from '@/lib/formatters'

export default function DelumaExportScreen() {
  const queryClient = useQueryClient()

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['deluma-exports'],
    queryFn: listDelumaExports,
  })

  const generateMutation = useMutation({
    mutationFn: () =>
      edgeFunctions.generateDelumaExport({ reference_month: getCurrentMonthKey() }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['deluma-exports'] })
      void queryClient.invalidateQueries({ queryKey: ['finance-dashboard'] })
      Alert.alert('Sucesso', 'Exportação DELUMA gerada.')
    },
    onError: (e: Error) => Alert.alert('Erro', e.message ?? 'Falha ao gerar exportação.'),
  })

  return (
    <View className="flex-1 bg-background">
      <SubScreenHeader title="Exportação DELUMA" />
      <ScrollView
        className="flex-1 px-4"
        contentContainerClassName="gap-4 pb-8"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
      >
        <Button loading={generateMutation.isPending} onPress={() => generateMutation.mutate()}>
          Gerar exportação do mês atual
        </Button>

        {isLoading ? (
          <ActivityIndicator color="#17310A" />
        ) : data?.length ? (
          data.map((item) => (
            <Card key={item.id} className="p-4">
              <Text className="text-base font-semibold text-foreground">
                {formatReferenceMonth(item.reference_month)}
              </Text>
              <Text className="text-sm text-muted-foreground">
                Gerado em {formatDate(item.generated_at)}
              </Text>
              {item.file_name ? (
                <Text className="mt-1 text-xs text-muted-foreground">{item.file_name}</Text>
              ) : null}
            </Card>
          ))
        ) : (
          <EmptyState title="Nenhuma exportação gerada" description="Gere a exportação do mês atual para começar." />
        )}
      </ScrollView>
    </View>
  )
}
