import { Text, View } from 'react-native'
import { CheckCircle2, Circle, CircleDot } from 'lucide-react-native'
import { cn } from '@/lib/cn'
import type { PatientServiceDemand } from '@/services/patientServiceRequest'

const STEPS = [
  { key: 'enviada', label: 'Solicitação enviada' },
  { key: 'buscando', label: 'Procurando profissional parceiro' },
  { key: 'atribuido', label: 'Profissional parceiro atribuído' },
] as const

function resolveStepIndex(demand: PatientServiceDemand | null | undefined, hasWaitlist: boolean): number {
  if (hasWaitlist) return -1
  if (!demand) return -1
  if (demand.status === 'alocada' || demand.assigned_professional_id) return 2
  if (demand.status === 'aberta') return 1
  return 0
}

type Props = {
  demand?: PatientServiceDemand | null
  hasWaitlist?: boolean
  createdAt?: string
}

function formatWhen(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function ServiceRequestTimeline({ demand, hasWaitlist, createdAt }: Props) {
  if (hasWaitlist) {
    return (
      <View className="rounded-xl border border-border bg-card p-4 gap-2">
        <Text className="text-sm font-semibold text-foreground">Lista de espera</Text>
        <Text className="text-sm text-muted-foreground">
          Registramos seu interesse. Em breve nossa equipe entrará em contato com mais informações.
        </Text>
      </View>
    )
  }

  const activeIndex = resolveStepIndex(demand, false)
  if (activeIndex < 0) return null

  return (
    <View className="rounded-xl border border-border bg-card p-4 gap-4">
      <Text className="text-sm font-semibold text-foreground">Acompanhe sua solicitação</Text>
      {STEPS.map((step, index) => {
        const done = index < activeIndex
        const current = index === activeIndex
        const Icon = done ? CheckCircle2 : current ? CircleDot : Circle
        const iconColor = done || current ? '#095742' : '#94A8A0'

        return (
          <View key={step.key} className="flex-row gap-3">
            <Icon size={20} color={iconColor} />
            <View className="flex-1 gap-0.5">
              <Text
                className={cn(
                  'text-sm',
                  current ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  done && 'text-foreground',
                )}
              >
                {step.label}
              </Text>
              {index === 0 && createdAt ? (
                <Text className="text-xs text-muted-foreground">{formatWhen(createdAt)}</Text>
              ) : null}
              {current && step.key === 'buscando' ? (
                <Text className="text-xs text-muted-foreground">
                  Estamos buscando um profissional parceiro disponível na sua região.
                </Text>
              ) : null}
            </View>
          </View>
        )
      })}
    </View>
  )
}
