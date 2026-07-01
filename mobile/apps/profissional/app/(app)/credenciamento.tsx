import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { loadCredentialingSnapshot } from '@/services/credentialing'

export default function CredenciamentoScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['pp', 'credentialing'],
    queryFn: loadCredentialingSnapshot,
  })

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <PageHeader title="Credenciamento" subtitle="Status e documentos" />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#17310A" />
        </View>
      ) : !data ? (
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-muted-foreground">Dados não encontrados.</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 pb-8">
          <View className="rounded-xl border border-border bg-card p-5 gap-3">
            <Text className="font-medium text-foreground">Dados pessoais</Text>
            <View>
              <Text className="text-xs text-muted-foreground">Nome</Text>
              <Text className="font-medium text-foreground">{data.professional.full_name}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">Profissão</Text>
              <Text className="font-medium text-foreground">{data.professional.profession ?? '—'}</Text>
            </View>
            <View>
              <Text className="text-xs text-muted-foreground">Status</Text>
              <Text className="font-medium text-foreground">{data.professional.credentialing_status ?? '—'}</Text>
            </View>
          </View>

          <View className="rounded-xl border border-border bg-card p-5 gap-3">
            <Text className="font-medium text-foreground">Conselho</Text>
            <Text className="text-sm text-foreground">
              {data.council ? `${data.council.council_type}: ${data.council.registration_number}` : 'Não cadastrado'}
            </Text>
          </View>

          <View className="rounded-xl border border-border bg-card p-5 gap-3">
            <Text className="font-medium text-foreground">Dados bancários</Text>
            <Text className="text-sm text-foreground">
              {data.bank ? `${data.bank.bank_name} · ${data.bank.account_type}` : 'Não cadastrado'}
            </Text>
            {data.bank ? (
              <Text className="text-xs text-muted-foreground">
                Agência {data.bank.agency} · Conta {data.bank.account_number}
              </Text>
            ) : null}
          </View>

          <View className="rounded-xl border border-border bg-card p-5 gap-3">
            <Text className="font-medium text-foreground">Documentos</Text>
            {data.documents.length === 0 ? (
              <Text className="text-sm text-muted-foreground">Nenhum documento enviado.</Text>
            ) : (
              data.documents.map((doc) => (
                <Text key={doc.id} className="text-sm text-foreground">
                  {doc.document_type} · {doc.file_name}
                </Text>
              ))
            )}
          </View>

          {data.contract && (
            <View className="rounded-xl border border-border bg-card p-5 gap-3">
              <Text className="font-medium text-foreground">Contrato</Text>
              <Text className="text-sm text-foreground">
                Nº {data.contract.contract_number ?? '—'} · Status: {data.contract.status}
              </Text>
              {data.contract.signed_at ? (
                <Text className="text-xs text-muted-foreground">
                  Assinado em {data.contract.signed_at}
                </Text>
              ) : null}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
