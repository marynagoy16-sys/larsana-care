import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ZodError } from 'zod'
import { toast } from 'sonner'
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
import { PatientRepresentationFlow } from '@/components/legal/PatientRepresentationFlow'
import { isPaymentSimulationEnabled } from '@/lib/paymentSimulation'
import { cn } from '@/lib/utils'
import {
  patientGenderLabels,
  patientGenderValues,
  patientMaritalStatusLabels,
  patientMaritalStatusValues,
  patientReferralSourceLabels,
  patientServiceRequestSchema,
  patientServiceRequestStepOneSchema,
  requiresResponsibleByBirthDate,
  type PatientServiceRequestValues,
} from '@/schemas/patientServiceRequest'
import { formatCurrency } from '@/lib/formatters'
import {
  getPatientRequestPrefill,
  getPatientServiceLegalTerms,
  patientServiceQueryKeys,
} from '@/services/patientServiceRequest'

const TERMS_DECLARATION =
  'Declaro que li integralmente e concordo com o Contrato de Intermediação, Termo de Consentimento e Políticas de Privacidade, compreendendo a natureza da atuação da plataforma, a autonomia dos profissionais e as limitações de responsabilidade envolvidas.'

const STEP_ONE_FIELDS = new Set([
  'patientFullName',
  'patientCpf',
  'birthDate',
  'birthPlace',
  'maritalStatus',
  'gender',
  'responsibleFullName',
  'responsibleCpf',
])

function fieldError(errors: Record<string, string>, key: string) {
  const message = errors[key]
  if (!message) return null
  return <p className="text-xs text-destructive">{message}</p>
}

interface ServiceRequestFormProps {
  onPrepare: (values: PatientServiceRequestValues) => Promise<{
    canCheckout: boolean
    noCoverage?: boolean
    assessmentFeeCents?: number
    assessmentFeeMessage?: string
    patientId?: string
  }>
  onCheckout: (input: {
    values: PatientServiceRequestValues
    patientId: string
    assessmentFeeCents: number
  }) => Promise<void>
  onSimulate?: () => Promise<void>
  submitting?: boolean
}

export function ServiceRequestForm({ onPrepare, onCheckout, onSimulate, submitting }: ServiceRequestFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [patientFullName, setPatientFullName] = useState('')
  const [patientCpf, setPatientCpf] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthPlace, setBirthPlace] = useState('')
  const [maritalStatus, setMaritalStatus] = useState<PatientServiceRequestValues['maritalStatus'] | ''>('')
  const [gender, setGender] = useState<PatientServiceRequestValues['gender'] | ''>('')
  const [responsibleFullName, setResponsibleFullName] = useState('')
  const [responsibleCpf, setResponsibleCpf] = useState('')
  const [attendancePeriod, setAttendancePeriod] = useState<PatientServiceRequestValues['attendancePeriod'] | ''>('')
  const [diagnosticHypothesis, setDiagnosticHypothesis] = useState('')
  const [referralSource, setReferralSource] = useState<PatientServiceRequestValues['referralSource'] | ''>('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [checkoutMeta, setCheckoutMeta] = useState<{
    patientId: string
    assessmentFeeCents: number
    assessmentFeeMessage?: string
  } | null>(null)

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

  const buildValues = (): PatientServiceRequestValues => ({
    patientFullName,
    patientCpf,
    birthDate,
    birthPlace,
    maritalStatus: (maritalStatus || 'NAO_INFORMADO') as PatientServiceRequestValues['maritalStatus'],
    gender: (gender || 'NAO_INFORMADO') as PatientServiceRequestValues['gender'],
    responsibleFullName,
    responsibleCpf: responsibleCpf || undefined,
    attendancePeriod: attendancePeriod as PatientServiceRequestValues['attendancePeriod'],
    diagnosticHypothesis,
    referralSource: referralSource as PatientServiceRequestValues['referralSource'],
    termsAccepted: true,
  })

  const handlePrepareStep = async () => {
    setErrors({})
    try {
      const parsed = patientServiceRequestSchema.parse(buildValues())
      const result = await onPrepare(parsed)
      if (result.noCoverage || !result.canCheckout) return
      setCheckoutMeta({
        patientId: result.patientId!,
        assessmentFeeCents: result.assessmentFeeCents ?? 15000,
        assessmentFeeMessage: result.assessmentFeeMessage,
      })
      setStep(3)
    } catch (err) {
      if (err instanceof ZodError) {
        const next: Record<string, string> = {}
        for (const issue of err.issues) {
          const key = issue.path[0]
          if (typeof key === 'string' && !next[key]) next[key] = issue.message
        }
        setErrors(next)
        if (Object.keys(next).some((key) => STEP_ONE_FIELDS.has(key))) {
          setStep(1)
          toast.error('Complete os dados do paciente antes de continuar.')
        }
      } else {
        throw err
      }
    }
  }

  const handleCheckout = async () => {
    if (!checkoutMeta) return
    await onCheckout({
      values: buildValues(),
      patientId: checkoutMeta.patientId,
      assessmentFeeCents: checkoutMeta.assessmentFeeCents,
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (step === 2) await handlePrepareStep()
  }

  const validateStepOne = (): boolean => {
    setErrors({})
    try {
      patientServiceRequestStepOneSchema.parse({
        patientFullName,
        patientCpf,
        birthDate,
        birthPlace,
        maritalStatus: maritalStatus || undefined,
        gender: gender || undefined,
        responsibleFullName,
        responsibleCpf: responsibleCpf || undefined,
      })
      return true
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
      }
      return false
    }
  }

  const goToStepTwo = () => {
    if (validateStepOne()) setStep(2)
  }

  const progressPercent = step === 1 ? 33 : step === 2 ? 66 : 100
  const showSimulatePayment = isPaymentSimulationEnabled() && typeof onSimulate === 'function'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Passo {step} de 3</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {step === 1 ? (
        <>
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

        <div className="space-y-2">
          <Label htmlFor="birthPlace" className={softFieldLabelClass}>Naturalidade</Label>
          <Input
            id="birthPlace"
            value={birthPlace}
            onChange={(e) => setBirthPlace(e.target.value)}
            disabled={submitting}
            className={softFieldInputClass}
            placeholder="Cidade/UF de nascimento"
          />
          {fieldError(errors, 'birthPlace')}
        </div>

        <div className="space-y-2">
          <Label className={softFieldLabelClass}>Estado civil (opcional)</Label>
          <Select
            value={maritalStatus}
            onValueChange={(v) => setMaritalStatus(v as PatientServiceRequestValues['maritalStatus'])}
            disabled={submitting}
          >
            <SelectTrigger className={softFieldInputClass}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {patientMaritalStatusValues.map((key) => (
                <SelectItem key={key} value={key}>{patientMaritalStatusLabels[key]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldError(errors, 'maritalStatus')}
        </div>

        <div className="space-y-2">
          <Label className={softFieldLabelClass}>Gênero (opcional)</Label>
          <Select
            value={gender}
            onValueChange={(v) => setGender(v as PatientServiceRequestValues['gender'])}
            disabled={submitting}
          >
            <SelectTrigger className={softFieldInputClass}>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {patientGenderValues.map((key) => (
                <SelectItem key={key} value={key}>{patientGenderLabels[key]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {fieldError(errors, 'gender')}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">Responsável</h2>
          <p className="text-xs text-muted-foreground">
            Obrigatório apenas para menores de 18 anos. Demais casos, preenchimento opcional.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsibleFullName" className={softFieldLabelClass}>
            Nome do responsável{responsibleRequired ? ' *' : ' (opcional)'}
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
            CPF do responsável{responsibleRequired ? ' *' : ' (opcional)'}
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

        <PatientRepresentationFlow
          showFamilyAuthorization={responsibleRequired}
          showLegalRepresentation={responsibleRequired}
        />
      </section>

      <Button type="button" className={softFieldButtonClass} onClick={goToStepTwo} disabled={submitting}>
        Continuar
      </Button>
        </>
      ) : step === 2 ? (
        <>
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
            placeholder="Ex.: dor no ombro após queda, dificuldade para caminhar após cirurgia…"
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

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" className="sm:flex-1" onClick={() => setStep(1)} disabled={submitting}>
          Voltar
        </Button>
        <Button type="submit" className={cn(softFieldButtonClass, 'sm:flex-1')} disabled={submitting || !termsAccepted}>
          {submitting ? 'Validando…' : 'Ir para pagamento'}
        </Button>
      </div>
        </>
      ) : (
        <>
          <section className="space-y-4 rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold text-foreground">Pagamento da avaliação</h2>
            <p className="text-sm text-muted-foreground">
              {checkoutMeta?.assessmentFeeMessage ??
                'Valor da avaliação domiciliar. Se você fechar o pacote de tratamento, este valor será descontado no primeiro ciclo.'}
            </p>
            <div className="rounded-lg bg-muted/40 px-4 py-3">
              <p className="text-xs text-muted-foreground">Total a pagar agora</p>
              <p className="font-display text-2xl font-bold">
                {formatCurrency(checkoutMeta?.assessmentFeeCents ?? 15000)}
              </p>
            </div>
          </section>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" className="sm:flex-1" onClick={() => setStep(2)} disabled={submitting}>
                Voltar
              </Button>
              <Button
                type="button"
                className={cn(softFieldButtonClass, 'sm:flex-1')}
                disabled={submitting}
                onClick={() => void handleCheckout()}
              >
                {submitting ? 'Gerando pagamento…' : 'Pagar avaliação (PIX)'}
              </Button>
            </div>

            {showSimulatePayment ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={submitting}
                  onClick={() => void onSimulate?.()}
                >
                  {submitting ? 'Confirmando…' : 'Simular pagamento confirmado'}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Ambiente de demonstração — confirma o pagamento e envia a solicitação.
                </p>
              </>
            ) : null}
          </div>
        </>
      )}
    </form>
  )
}
