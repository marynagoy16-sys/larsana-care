import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, ChevronDown, ChevronUp, MapPin, PenLine } from 'lucide-react-native'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { getPPPatientDetail, getPPPatientProntuario, prontuarioContentPreview } from '@/services/ppPatients'
import { formatDate } from '@/lib/formatters'

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <View className="rounded-xl border border-border bg-muted/40 p-4 flex-1 min-h-[88px]">
      <Text className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</Text>
      <Text className="text-sm font-medium mt-1.5 leading-snug">{value}</Text>
    </View>
  )
}

function CardSection({ title, subtitle, icon: Icon, children }: {
  title: string
  subtitle?: string
  icon?: any
  children: React.ReactNode
}) {
  return (
    <View className="rounded-xl border border-border bg-card overflow-hidden">
      <View className={`px-5 py-4 border-b border-border bg-muted/20 ${Icon ? 'flex-row items-center gap-2' : ''}`}>
        {Icon ? <Icon size={16} color="#49796B" /> : null}
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        {subtitle ? <Text className="text-xs text-muted-foreground mt-0.5">{subtitle}</Text> : null}
      </View>
      <View className="p-5">{children}</View>
    </View>
  )
}

function formatPatientAge(birthDate: string | null): string {
  if (!birthDate) return '—'
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return String(age)
}

function formatPatientSex(sex: string | null): string {
  if (!sex) return '—'
  return sex === 'M' ? 'Masculino' : sex === 'F' ? 'Feminino' : 'Outro'
}

function formatAttendancePeriod(period: string | null): string {
  if (!period) return '—'
  const map: Record<string, string> = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', integral: 'Integral' }
  return map[period.toLowerCase()] ?? period
}

const assessmentStatusLabels: Record<string, string> = {
  avaliacao_feita: 'Avaliação feita',
  proposta_enviada: 'Proposta enviada',
  em_analise: 'Em análise',
  respondida_sim: 'Respondida SIM',
  respondida_nao: 'Respondida NÃO',
  vencida: 'Prazo vencido',
}

const careStatusLabels: Record<string, string> = {
  ATIVO: 'Ativo',
  PAUSA: 'Em pausa',
  ENCERRADO: 'Encerrado',
}

const patientLevelLabels: Record<string, string> = {
  N1: 'Nível 1',
  N2: 'Nível 2',
  N3: 'Nível 3',
  VALOR_SOCIAL: 'Valor social',
}

const recordTypeLabels: Record<string, string> = {
  avaliacao: 'Avaliação inicial',
  evolucao: 'Evolução',
}

function ProntuarioCycleSection({
  cycleNumber,
  status,
  records,
  defaultOpen = false,
}: {
  cycleNumber: number
  status: string | null
  records: Array<{
    id: string
    session_number: number | null
    content_richtext: string | null
    recorded_at: string
    created_at: string
  }>
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <View className="rounded-xl border border-border bg-card overflow-hidden">
      <Pressable
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center justify-between px-4 py-3.5 active:bg-muted/20"
      >
        <View>
          <Text className="text-sm font-semibold text-foreground">Ciclo {cycleNumber}</Text>
          <Text className="text-xs text-muted-foreground">
            {records.length} terapia{records.length === 1 ? '' : 's'} registrada{records.length === 1 ? '' : 's'}
            {status ? ` · ${status}` : ''}
          </Text>
        </View>
        {open ? <ChevronUp size={18} color="#49796B" /> : <ChevronDown size={18} color="#49796B" />}
      </Pressable>
      {open ? (
        <View className="border-t border-border divide-y divide-border">
          {records.length === 0 ? (
            <Text className="px-4 py-3 text-xs text-muted-foreground">Nenhuma evolução neste ciclo.</Text>
          ) : (
            records.map((record) => (
              <View key={record.id} className="px-4 py-3 gap-1">
                <Text className="text-xs font-medium text-foreground">
                  Terapia #{record.session_number ?? '—'}
                </Text>
                <Text className="text-xs text-muted-foreground leading-relaxed">
                  {prontuarioContentPreview(record.content_richtext)}
                </Text>
                <Text className="text-[10px] text-muted-foreground">
                  {formatDate(record.recorded_at ?? record.created_at)}
                </Text>
              </View>
            ))
          )}
        </View>
      ) : null}
    </View>
  )
}

export default function PacienteDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['pp', 'patient', id],
    queryFn: () => getPPPatientDetail(id!),
  })

  const { data: prontuario, isLoading: prontuarioLoading } = useQuery({
    queryKey: ['pp', 'patient', id, 'prontuario'],
    queryFn: () => getPPPatientProntuario(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background" edges={['top']}>
        <ActivityIndicator size="large" color="#095742" />
      </SafeAreaView>
    )
  }

  if (!data) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <PageHeader>
          <View className="flex-row items-center gap-2">
            <Pressable onPress={() => router.back()} className="p-2">
              <ArrowLeft size={22} color="#095742" />
            </Pressable>
            <Text className="text-lg font-semibold text-foreground">Paciente</Text>
          </View>
        </PageHeader>
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-muted-foreground">Paciente não encontrado.</Text>
        </View>
      </SafeAreaView>
    )
  }

  const primaryAddress = data.patient_addresses?.find((a) => a.is_primary) ?? data.patient_addresses?.[0] ?? null
  const latestAssessment = data.initial_assessments?.[0] ?? null
  const statusLabel = careStatusLabels[data.care_status] ?? data.care_status

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <PageHeader>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => router.back()} className="p-2">
            <ArrowLeft size={22} color="#095742" />
          </Pressable>
          <View className="min-w-0 flex-1">
            <Text className="text-lg font-semibold text-foreground" numberOfLines={1}>{data.full_name}</Text>
            <View className="flex-row items-center gap-2 mt-0.5">
              <View className="rounded-full bg-primary px-2 py-0.5">
                <Text className="text-[10px] font-semibold text-primary-foreground">{statusLabel}</Text>
              </View>
              {data.evaluation_pending && (
                <View className="rounded-full bg-amber-100 px-2 py-0.5">
                  <Text className="text-[10px] font-semibold text-amber-800">Avaliação pendente</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </PageHeader>

      <ScrollView className="flex-1" contentContainerClassName="gap-4 px-4 pb-8">
        {data.evaluation_pending && (
          <View className="rounded-xl border border-amber-200 bg-amber-50/80 px-5 py-4">
            <Text className="font-medium text-amber-900">Avaliação inicial pendente</Text>
            <Text className="text-sm text-amber-800/90 mt-1">
              Realize a visita domiciliar e registre a avaliação clínica para que a gestão envie a proposta à família.
            </Text>
          </View>
        )}

        <CardSection title="Resumo clínico">
          <View className="flex-row flex-wrap gap-3">
            <InfoTile label="Idade" value={formatPatientAge(data.birth_date)} />
            <InfoTile label="Sexo" value={formatPatientSex(data.sex)} />
            <InfoTile label="Nível" value={patientLevelLabels[data.patient_level ?? ''] ?? data.patient_level ?? '—'} />
            <InfoTile label="Período" value={formatAttendancePeriod(data.attendance_period)} />
          </View>
          <View className="mt-4 gap-2">
            <View>
              <Text className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Hipótese diagnóstica</Text>
              <Text className="text-sm font-medium mt-1">{data.diagnostic_hypothesis ?? '—'}</Text>
            </View>
            {data.clinical_summary && (
              <View>
                <Text className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Resumo clínico</Text>
                <Text className="text-sm text-muted-foreground mt-1 leading-relaxed">{data.clinical_summary}</Text>
              </View>
            )}
          </View>
        </CardSection>

        {primaryAddress && (
          <CardSection title="Endereço de atendimento" icon={MapPin}>
            <Text className="text-sm font-medium text-foreground">{primaryAddress.full_address}</Text>
            {primaryAddress.neighborhood && (
              <Text className="text-xs text-muted-foreground mt-1">{primaryAddress.neighborhood}</Text>
            )}
          </CardSection>
        )}

        {latestAssessment && (
          <View className="rounded-xl border border-border bg-card px-5 py-4 flex-row items-center justify-between gap-4">
            <View>
              <Text className="text-sm font-medium text-foreground">Avaliação registrada</Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                Status: {assessmentStatusLabels[latestAssessment.status] ?? latestAssessment.status}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push(`/(app)/avaliacoes/${latestAssessment.id}`)}
              className="rounded-full border border-border bg-background px-3 py-1.5"
            >
              <Text className="text-xs font-medium text-foreground">Ver rastreio</Text>
            </Pressable>
          </View>
        )}

        <CardSection title="Prontuário" subtitle="Avaliação e evoluções por ciclo" icon={PenLine}>
          {prontuarioLoading ? (
            <ActivityIndicator color="#095742" />
          ) : !prontuario ? (
            <Text className="text-sm text-muted-foreground">Prontuário indisponível.</Text>
          ) : (
            <View className="gap-3">
              {prontuario.assessmentRecords.length > 0 ? (
                <View className="rounded-xl border border-primary/20 bg-primary/5 p-4 gap-2">
                  <Text className="text-xs font-semibold uppercase tracking-wider text-primary">
                    Avaliação inicial
                  </Text>
                  {prontuario.assessmentRecords.map((record) => (
                    <View key={record.id} className="gap-1">
                      <Text className="text-sm font-medium text-foreground">
                        {recordTypeLabels[record.record_type] ?? record.record_type}
                      </Text>
                      <Text className="text-xs text-muted-foreground leading-relaxed">
                        {prontuarioContentPreview(record.content_richtext)}
                      </Text>
                      <Text className="text-[10px] text-muted-foreground">
                        {formatDate(record.recorded_at ?? record.created_at)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : data.evaluation_pending ? (
                <Text className="text-sm text-muted-foreground">
                  Avaliação inicial ainda não registrada no prontuário.
                </Text>
              ) : null}

              {prontuario.cycles.length === 0 ? (
                <Text className="text-sm text-muted-foreground">Nenhum ciclo de tratamento registrado.</Text>
              ) : (
                prontuario.cycles.map((cycle, index) => (
                  <ProntuarioCycleSection
                    key={cycle.cycleId}
                    cycleNumber={cycle.cycleNumber}
                    status={cycle.status}
                    defaultOpen={index === 0}
                    records={cycle.records.map((r) => ({
                      id: r.id,
                      session_number: r.session_number,
                      content_richtext: r.content_richtext,
                      recorded_at: r.recorded_at,
                      created_at: r.created_at,
                    }))}
                  />
                ))
              )}
            </View>
          )}
        </CardSection>
      </ScrollView>
    </SafeAreaView>
  )
}
