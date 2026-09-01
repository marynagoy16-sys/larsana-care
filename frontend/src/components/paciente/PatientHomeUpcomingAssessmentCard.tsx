import { CalendarCheck, UserRound } from 'lucide-react'
import { formatDateTime } from '@/lib/formatters'
import type { UpcomingAssessmentAppointment } from '@/services/patientPortal'

type PatientHomeUpcomingAssessmentCardProps = {
  appointment: UpcomingAssessmentAppointment
}

export function PatientHomeUpcomingAssessmentCard({
  appointment,
}: PatientHomeUpcomingAssessmentCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CalendarCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold text-foreground">Avaliação domiciliar agendada</p>
          <p className="text-sm text-muted-foreground">
            {formatDateTime(appointment.scheduledAt)}
          </p>
          {appointment.professionalName ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserRound className="h-3.5 w-3.5 shrink-0" />
              Profissional:{' '}
              <span className="font-medium text-foreground">{appointment.professionalName}</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
