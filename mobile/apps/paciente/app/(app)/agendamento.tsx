import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabaseClient'
import { listPendingSchedulingProposalsForPatient } from '@/services/scheduling'
import { patientPortalQueryKeys } from '@/services/patientPortal'

export default function AgendamentoScreen() {
  const queryClient = useQueryClient()

  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['paciente', 'scheduling_proposals'],
    queryFn: listPendingSchedulingProposalsForPatient,
  })

  const initialProposals = proposals.filter((p) => p.proposal_type !== 'remarcacao')

  const confirmMutation = useMutation({
    mutationFn: async ({ proposalId, slotId }: { proposalId: string; slotId: string }) => {
      const { data, error } = await supabase.rpc('patient_confirm_slot', {
        p_proposal_id: proposalId,
        p_slot_id: slotId,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paciente', 'scheduling_proposals'] })
      queryClient.invalidateQueries({ queryKey: patientPortalQueryKeys.home })
      Alert.alert('Horário confirmado', 'Seu profissional parceiro foi avisado.')
    },
    onError: (err: Error) => Alert.alert('Erro', err.message),
  })

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background" edges={['bottom']}>
        <ActivityIndicator size="large" color="#095742" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader title="Confirmar horário" subtitle="Escolha um dos horários enviados pelo profissional" />
      <ScrollView className="flex-1 px-4" contentContainerClassName="gap-4 py-4 pb-28">
        {initialProposals.length === 0 ? (
          <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
            <Text className="text-center text-sm text-muted-foreground">
              Nenhum horário pendente no momento.
            </Text>
          </View>
        ) : (
          initialProposals.map((proposal) => (
            <ProposalCard
              key={proposal.id}
              proposalId={proposal.id}
              onConfirm={(slotId) => confirmMutation.mutate({ proposalId: proposal.id, slotId })}
              loading={confirmMutation.isPending}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function ProposalCard({
  proposalId,
  onConfirm,
  loading,
}: {
  proposalId: string
  onConfirm: (slotId: string) => void
  loading: boolean
}) {
  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['paciente', 'proposal-slots', proposalId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scheduling_proposal_slots')
        .select('id, starts_at, ends_at')
        .eq('proposal_id', proposalId)
        .order('sort_order')
      if (error) throw error
      return data ?? []
    },
  })

  if (isLoading) {
    return (
      <View className="rounded-xl border border-border bg-card p-4">
        <ActivityIndicator color="#095742" />
      </View>
    )
  }

  return (
    <View className="rounded-xl border border-border bg-card p-4 gap-3">
      <Text className="font-semibold text-foreground">Horários disponíveis</Text>
      {slots.map((slot) => (
        <View key={slot.id} className="flex-row items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
          <Text className="text-sm text-foreground">
            {format(new Date(slot.starts_at), "EEE dd/MM 'às' HH:mm", { locale: ptBR })}
          </Text>
          <Button size="sm" onPress={() => onConfirm(slot.id)} loading={loading}>
            Escolher
          </Button>
        </View>
      ))}
    </View>
  )
}
