import { format, parseISO, isValid } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { PatientChatMessage } from '@/services/patientChat'

function formatConfirmedSlotLabel(value: string): string {
  const date = parseISO(value)
  if (!isValid(date)) return value
  return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

type PatientChatMessageBodyProps = {
  message: PatientChatMessage
  className?: string
}

function renderBodyWithBoldSlot(body: string, slotLabel: string, className?: string) {
  if (!body.includes(slotLabel)) {
    return <p className={className}>{body}</p>
  }

  const [before, after] = body.split(slotLabel)
  return (
    <p className={className}>
      {before}
      <span className="font-semibold">{slotLabel}</span>
      {after}
    </p>
  )
}

export function PatientChatMessageBody({ message, className }: PatientChatMessageBodyProps) {
  const slotStartsAt =
    typeof message.payload?.slot_starts_at === 'string' ? message.payload.slot_starts_at : null

  if (message.template_code === 'patient_confirmed_slot' && slotStartsAt) {
    return renderBodyWithBoldSlot(message.body, formatConfirmedSlotLabel(slotStartsAt), className)
  }

  const confirmedSlotMatch = message.body.match(
    /^(Confirmamos sua .+? para )(.+?)(\. O profissional parceiro já foi avisado e o atendimento entrou na agenda dele\.)$/,
  )

  if (confirmedSlotMatch) {
    return (
      <p className={className}>
        {confirmedSlotMatch[1]}
        <span className="font-semibold">{confirmedSlotMatch[2]}</span>
        {confirmedSlotMatch[3]}
      </p>
    )
  }

  const legacyConfirmedSlotMatch = message.body.match(
    /^(?:Perfeito! )?(Confirmamos sua .+? para )(.+?)(\. (?:Seu|O) profissional parceiro já foi avisado e o atendimento entrou na agenda dele\.)$/,
  )

  if (legacyConfirmedSlotMatch) {
    return (
      <p className={className}>
        {legacyConfirmedSlotMatch[1]}
        <span className="font-semibold">{legacyConfirmedSlotMatch[2]}</span>
        {legacyConfirmedSlotMatch[3]}
      </p>
    )
  }

  return <p className={className}>{message.body}</p>
}
