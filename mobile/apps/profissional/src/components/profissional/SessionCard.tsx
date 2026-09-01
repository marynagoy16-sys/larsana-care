import { format, isSameDay, parseISO } from 'date-fns'
import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Badge } from '@/components/ui/Card'
import { getAgendaStatusConfig } from '@/lib/sessionStatus'
import { cn } from '@/lib/cn'
import type { AgendaSessionItem } from '@/services/ppAgenda'

interface SessionCardProps {
  session: AgendaSessionItem
  className?: string
}

export function SessionCard({ session, className }: SessionCardProps) {
  const router = useRouter()
  const cfg = getAgendaStatusConfig(session.displayStatus)
  const scheduledStart = session.scheduledAt ? parseISO(session.scheduledAt) : session.start
  const isToday = isSameDay(scheduledStart, new Date())
  const timeLabel = isToday
    ? format(scheduledStart, 'HH:mm')
    : format(scheduledStart, 'dd/MM · HH:mm')

  return (
    <Pressable
      onPress={() => router.push(`/(app)/agenda/${session.id}`)}
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card active:bg-muted/30',
        className,
      )}
    >
      <View className="flex-row items-center gap-3 px-4 py-3">
        <Text className={cn('text-sm font-semibold text-muted-foreground', !isToday && 'w-20')}>
          {timeLabel}
        </Text>
        <View className="min-w-0 flex-1">
          <Text className="font-medium text-foreground" numberOfLines={1}>
            {session.patientName}
          </Text>
          <Text className="text-xs text-muted-foreground">
            Ciclo {session.cycleNumber} · Terapia #{session.sessionNumber}
          </Text>
          {session.address ? (
            <Text className="mt-0.5 text-xs text-muted-foreground" numberOfLines={1}>
              {session.address}
            </Text>
          ) : null}
        </View>
        <Badge label={cfg.label} className={cfg.badge} />
      </View>
    </Pressable>
  )
}
