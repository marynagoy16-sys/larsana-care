import { Text, View } from 'react-native'
import { CalendarCheck, UserRound } from 'lucide-react-native'
import { formatDateTime } from '@/lib/formatters'
import type { UpcomingAssessmentAppointment } from '@/services/patientPortal'

type PatientHomeUpcomingAssessmentCardProps = {
  appointment: UpcomingAssessmentAppointment
}

export function PatientHomeUpcomingAssessmentCard({
  appointment,
}: PatientHomeUpcomingAssessmentCardProps) {
  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card">
      <View className="flex-row items-start gap-3 p-4">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <CalendarCheck size={20} color="#095742" />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-sm font-semibold text-foreground">Avaliação domiciliar agendada</Text>
          <Text className="text-sm text-muted-foreground">{formatDateTime(appointment.scheduledAt)}</Text>
          {appointment.professionalName ? (
            <View className="mt-0.5 flex-row items-center gap-1.5">
              <UserRound size={14} color="#49796B" />
              <Text className="text-xs text-muted-foreground">
                Profissional:{' '}
                <Text className="font-medium text-foreground">{appointment.professionalName}</Text>
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  )
}
