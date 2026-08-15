import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ZodError } from 'zod'
import { BirthDatePicker } from '@/components/forms/BirthDatePicker'
import { MaskedInput } from '@/components/forms/MaskedInput'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { attendancePeriodLabels } from '@/constants/labels'
import { softFieldButtonClass, softFieldInputClass, softFieldLabelClass } from '@/lib/formFieldStyles'
import { formatCpf } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import {
  patientReferralSourceLabels,
  patientServiceRequestSchema,
  requiresResponsibleByBirthDate,
  type PatientServiceRequestValues,
} from '@/schemas/patientServiceRequest'
import {
  getPatientRequestPrefill,
  getPatientServiceLegalTerms,
  patientServiceQueryKeys,
} from '@/services/patientServiceRequest'

const TERMS_DECLARATION =
  'Declaro que li integralmente e concordo com o Contrato de Intermediação, Termo de Consentimento e Políticas de Privacidade, compreendendo a natureza da atuação da plataforma, a autonomia dos profissionais e as limitações de responsabilidade envolvidas.'

interface ServiceRequestFormProps {
  onSubmit: (values: PatientServiceRequestValues) => Promise<void>
  submitting?: boolean
}

function fieldError(errors: Record<string, string>, key: string) {
  const message = errors[key]
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

export function ServiceRequestForm({ onSubmit, submitting }: ServiceRequestFormProps) {
  const [patientFullName, setPatientFullName] = useState('')
  const [patientCpf, setPatientCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [responsibleFullName, setResponsibleFullName] = useState('')
  const [responsibleCpf, setResponsibleCpf] = useState('')
  const [attendancePeriod, setAttendancePeriod] = useState<PatientServiceRequestValues['attendancePeriod'] | ''>('')
  const [diagnosticHypothesis, setDiagnosticHypothesis] = useState('')
  const [referralSource, setReferralSource] = useState<PatientServiceRequestValues['referralSource'] | ''>('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: prefill } = useQuery({
    queryKey: patientServiceQueryKeys.prefill,
    queryFn: getPatientRequestPrefill,
  })

  const { data: legalTerms = [] } = useQuery({
    queryKey: patientServiceQueryKeys.legalTerms,
    queryFn: getPatientServiceLegalTerms,
  })

  useEffect(() => {
    if (!prefill) return
    setPatientFullName(prefill.patientFullName)
    setPatientCpf(prefill.patientCpf ? formatCpf(prefill.patientCpf) : '')
    setBirthDate(prefill.birthDate)
    setResponsibleFullName(prefill.responsibleFullName)
    setResponsibleCpf(prefill.responsibleCpf ? formatCpf(prefill.responsibleCpf) : '')
    if (prefill.attendancePeriod) setAttendancePeriod(prefill.attendancePeriod)
    setDiagnosticHypothesis(prefill.diagnosticHypothesis)
    if (prefill.referralSource) setReferralSource(prefill.referralSource)
  }, [prefill])

  const responsibleRequired = useMemo(
    () => (birthDate ? requiresResponsibleByBirthDate(birthDate) : false),
    [birthDate],
  )

  const termsByType = useMemo(
    () => new Map(legalTerms.map((term) => [term.term_type, term])),
    [legalTerms],
  )

  const contractTerm = termsByType.get('CONTRATO_INTERMEDIACAO')
  const consentTerm = termsByType.get('TERMO_CONSENTIMENTO')
  const privacyTerm = termsByType.get('LGPD')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrors({})

    try {
      const parsed = patientServiceRequestSchema.parse({
        patientFullName,
        patientCpf,
        birthDate,
        responsibleFullName,
        responsibleCpf: responsibleCpf || undefined,
        attendancePeriod,
        diagnosticHypothesis,
        referralSource,
        termsAccepted,
      })
      await onSubmit(parsed)
    } catch (err) {
      if (err instanceof ZodError) {
        const next: Record<string, string> = {}
        for (const issue of err.issues) {
          const key = issue.path[0]
          if (typeof key === 'string' && !next[key]) {
            next[key] = issue.message
          }
        }
        setErrors(next)
        return
      }
      throw err
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Dados do paciente</h2>

        <div className="space-y-2">
          <Label htmlFor="patientFullName" className={softFieldLabelClass}>
            Nome do paciente
          </Label>
          <Input
            id="patientFullName"
            value={patientFullName}
            onChange={(e) => setPatientFullName(e.target.value)}
            disabled={submitting}
            className={softFieldInputClass}
          />
          {fieldError(errors, 'patientFullName')}
        </div>

        <div className="space-y-2">
          <Label htmlFor="patientCpf" className={softFieldLabelClass}>
            CPF do paciente
          </Label>
          <MaskedInput
            id="patientCpf"
            mask="cpf"
            value={patientCpf}
            onChange={setPatientCpf}
            disabled={submitting}
            className={softFieldInputClass}
          />
          {fieldError(errors, 'patientCpf')}
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate" className={softFieldLabelClass}>
            Data de nascimento
          </Label>
          <BirthDatePicker
            id="birthDate"
            value={birthDate}
            onChange={setBirthDate}
            disabled={submitting}
            className={cn(softFieldInputClass, 'border-0 bg-muted shadow-none')}
          />
          {fieldError(errors, 'birthDate')}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">Responsável</h2>
          <p className="text-xs text-muted-foreground">
            Se aplicável (idosos acima de 60 anos e menores de 18 anos)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsibleFullName" className={softFieldLabelClass}>
            Nome do responsável{responsibleRequired ? ' *' : ''}
          </Label>
          <Input
            id="responsibleFullName"
            value={responsibleFullName}
            onChange={(e) => setResponsibleFullName(e.target.value)}
            disabled={submitting}
            className={softFieldInputClass}
          />
          {fieldError(errors, 'responsibleFullName')}
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsibleCpf" className={softFieldLabelClass}>
            CPF do responsável{responsibleRequired ? ' *' : ''}
          </Label>
          <MaskedInput
            id="responsibleCpf"
            mask="cpf"
            value={responsibleCpf}
            onChange={setResponsibleCpf}
            disabled={submitting}
            className={softFieldInputClass}
          />
          {fieldError(errors, 'responsibleCpf')}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">Atendimento</h2>

        <div className="space-y-2">
          <Label className={softFieldLabelClass}>Melhor período para o atendimento</Label>
          <Select
            value={attendancePeriod}
            onValueChange={(value) =>
              setAttendancePeriod(value as PatientServiceRequestValues['attendancePeriod'])
            }
            disabled={submitting}
          >
            <SelectTrigger className={softFieldInputClass}>
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(attendancePeriodLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldError(errors, 'attendancePeriod')}
        </div>

        <div className="space-y-2">
          <Label htmlFor="diagnosticHypothesis" className={softFieldLabelClass}>
            Hipótese diagnóstica
          </Label>
          <Textarea
            id="diagnosticHypothesis"
            value={diagnosticHypothesis}
            onChange={(e) => setDiagnosticHypothesis(e.target.value)}
            disabled={submitting}
            rows={3}
            className="min-h-24 rounded-xl border-0 bg-muted px-4 py-3 text-base shadow-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:text-sm"
          />
          {fieldError(errors, 'diagnosticHypothesis')}
        </div>

        <div className="space-y-2">
          <Label className={softFieldLabelClass}>Como nos conheceu</Label>
          <Select
            value={referralSource}
            onValueChange={(value) =>
              setReferralSource(value as PatientServiceRequestValues['referralSource'])
            }
            disabled={submitting}
          >
            <SelectTrigger className={softFieldInputClass}>
              <SelectValue placeholder="Selecione uma opção" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(patientReferralSourceLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldError(errors, 'referralSource')}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">
          Para continuar, confirme que leu e concorda com os termos apresentados.
        </p>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
            disabled={submitting}
            className="mt-0.5"
          />
          <span className="text-sm leading-relaxed text-muted-foreground">{TERMS_DECLARATION}</span>
        </label>
        {fieldError(errors, 'termsAccepted')}

        <div className="flex flex-col gap-1 pl-7 text-sm">
          {contractTerm ? (
            <Link to={`/paciente/termos/${contractTerm.id}`} className="font-medium text-primary hover:underline">
              Contrato de Intermediação
            </Link>
          ) : null}
          {consentTerm ? (
            <Link to={`/paciente/termos/${consentTerm.id}`} className="text-primary hover:underline">
              Termo de Consentimento
            </Link>
          ) : null}
          {privacyTerm ? (
            <Link to={`/paciente/termos/${privacyTerm.id}`} className="text-primary hover:underline">
              Políticas de Privacidade
            </Link>
          ) : null}
        </div>
      </section>

      <Button type="submit" className={softFieldButtonClass} disabled={submitting || !termsAccepted}>
        {submitting ? 'Enviando solicitação...' : 'Solicitar profissional parceiro'}
      </Button>
    </form>
  )
}
