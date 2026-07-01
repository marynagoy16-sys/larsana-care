import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ChevronRight, ClipboardList, Clock, Search, CheckCircle2 } from 'lucide-react-native'
import { PageHeader } from '@/components/layout/PageHeader'
import { supabase } from '@/lib/supabase'
import {
  buildAssessmentWorkflowStats,
  formatAssessmentProposalSummary,
  formatFamilyDeadline,
  formatFamilyResponse,
  formatDate,
} from '@/lib/formatters'

function KpiCard({ label, value, icon: Icon, description }: {
  label: string
  value: string
  icon: any
  description?: string
}) {
  return (
    <View className="flex-1 rounded-xl border border-border bg-card p-3 gap-2 min-w-[100px]">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-medium text-muted-foreground">{label}</Text>
        <Icon size={14} color="#5A7920" />
      </View>
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
      {description ? (
        <Text className="text-[10px] text-muted-foreground leading-tight" numberOfLines={2}>
          {description}
        </Text>
      ) : null}
    </View>
  )
}

export default function AvaliacoesScreen() {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ['pp', 'assessments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return { data: [], count: 0 }
      const { data: professional } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!professional) return { data: [], count: 0 }
      const { data, error } = await supabase
        .from('initial_assessments')
        .select(
          `id, status, created_at, patient_id,
          proposed_session_count, proposed_patient_level, proposed_weekly_frequency,
          proposal_sent_at, response_deadline_at, family_response,
          patients ( full_name, patient_level )`
        )
        .eq('evaluator_professional_id', professional.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      const rows = (data ?? []).map((a: any) => ({
        id: a.id,
        status: a.status,
        created_at: a.created_at,
        patient_id: a.patient_id,
        patient_name: a.patients?.full_name ?? 'Paciente',
        patient_level: a.patients?.patient_level ?? '',
        proposed_session_count: a.proposed_session_count ?? null,
        proposed_patient_level: a.proposed_patient_level ?? null,
        proposed_weekly_frequency: a.proposed_weekly_frequency ?? null,
        proposal_sent_at: a.proposal_sent_at ?? null,
        response_deadline_at: a.response_deadline_at ?? null,
        family_response: a.family_response ?? null,
      }))
      return { data: rows, count: rows.length }
    },
  })

  const assessments = data?.data ?? []
  const count = data?.count ?? 0

  const stats = buildAssessmentWorkflowStats(assessments)

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <PageHeader title="Avaliações" subtitle="Avaliações domiciliares atribuídas" />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#17310A" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4" contentContainerClassName="gap-3 pb-8">
          <View className="flex-row flex-wrap gap-2">
            <KpiCard
              label="Total"
              value={String(stats.total)}
              icon={ClipboardList}
              description="Avaliações registradas"
            />
            <KpiCard
              label="Aguardando envio"
              value={String(stats.awaitingSend)}
              icon={Clock}
              description="Proposta ainda não enviada"
            />
            <KpiCard
              label="Em análise"
              value={String(stats.inReview)}
              icon={Search}
              description="Família analisando a proposta"
            />
            <KpiCard
              label="Respondidas"
              value={String(stats.answered)}
              icon={CheckCircle2}
              description="SIM ou NÃO da família"
            />
          </View>

          {assessments.length === 0 ? (
            <View className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-8">
              <Text className="text-center text-sm text-muted-foreground">
                Nenhuma avaliação atribuída.
              </Text>
            </View>
          ) : (
            assessments.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => router.push(`/(app)/avaliacoes/${a.id}`)}
                className="flex-col gap-2 rounded-xl border border-border bg-card px-4 py-4 active:bg-muted/30"
              >
                <View className="flex-row items-center justify-between">
                  <View className="min-w-0 flex-1">
                    <Text className="font-medium text-foreground">{a.patient_name}</Text>
                  </View>
                  <ChevronRight size={18} color="#5A7920" />
                </View>

                <View className="flex-row items-center gap-2 flex-wrap">
                  <Text className="text-xs text-muted-foreground">
                    {formatAssessmentProposalSummary(a)}
                  </Text>
                  <Text className="text-xs text-muted-foreground">·</Text>
                  <Text className="text-xs text-muted-foreground">
                    {formatDate(a.created_at)}
                  </Text>
                </View>

                <View className="flex-row items-center gap-2 flex-wrap mt-0.5">
                  <View className="rounded-full bg-primary/10 px-2 py-0.5">
                    <Text className="text-[10px] font-medium text-primary">
                      {a.status}
                    </Text>
                  </View>
                  <Text className="text-[10px] text-muted-foreground">
                    Prazo: {formatFamilyDeadline(a)}
                  </Text>
                  <Text className="text-[10px] text-muted-foreground">
                    Resposta: {formatFamilyResponse(a.family_response)}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
