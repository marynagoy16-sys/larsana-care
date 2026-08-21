import { useEffect, useMemo, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { ZodError } from 'zod'
import { Button } from '@/components/ui/Button'
import { formatCpf, formatCurrency } from '@/lib/formatters'
import {
  attendancePeriodLabels,
  attendancePeriodValues,
  patientGenderLabels,
  patientGenderValues,
  patientMaritalStatusLabels,
  patientMaritalStatusValues,
  patientReferralSourceLabels,
  patientReferralSourceValues,
  patientServiceRequestSchema,
  requiresResponsibleByBirthDate,
  type PatientServiceRequestValues,
} from '@/schemas/patientServiceRequest'
import { cpfSchema } from '@/schemas/common'
import {
  getPatientRequestPrefill,
  getPatientServiceLegalTerms,
  patientServiceQueryKeys,
} from '@/services/patientServiceRequest'

const TERMS_DECLARATION =
  'Declaro que li integralmente e concordo com o Contrato de Intermediação, Termo de Consentimento e Políticas de Privacidade, compreendendo a natureza da atuação da plataforma, a autonomia dos profissionais e as limitações de responsabilidade envolvidas.'

function fieldError(errors: Record<string, string>, key: string) {
  const message = errors[key]
  if (!message) return null
  return <Text className="text-xs text-destructive">{message}</Text>
}

function EnumPicker<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
  disabled,
}: {
  label: string
  value: T | ''
  options: readonly T[]
  labels: Record<T, string>
  onChange: (value: T) => void
  disabled?: boolean
}) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-foreground">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option
          return (
            <Pressable
              key={option}
              disabled={disabled}
              onPress={() => onChange(option)}
              className={`rounded-full border px-3 py-2 ${selected ? 'border-primary bg-primary/10' : 'border-border'}`}
            >
              <Text className={selected ? 'text-sm font-semibold text-primary' : 'text-sm text-foreground'}>
                {labels[option]}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
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
    patientId: string
    assessmentFeeCents: number
  }) => Promise<void>
  submitting?: boolean
}

export function ServiceRequestForm({ onPrepare, onCheckout, submitting }: ServiceRequestFormProps) {
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

  const buildValues = (): PatientServiceRequestValues => ({
    patientFullName,
    patientCpf,
    birthDate,
    birthPlace,
    maritalStatus: maritalStatus as PatientServiceRequestValues['maritalStatus'],
    gender: gender as PatientServiceRequestValues['gender'],
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
      } else {
        throw err
      }
    }
  }

  const validateStepOne = (): boolean => {
    setErrors({})
    const next: Record<string, string> = {}
    if (!patientFullName.trim()) next.patientFullName = 'Nome do paciente é obrigatório'
    if (!patientCpf.trim()) next.patientCpf = 'CPF é obrigatório'
    if (!birthDate.trim()) next.birthDate = 'Data é obrigatória'
    if (birthDate && requiresResponsibleByBirthDate(birthDate)) {
      if (!responsibleFullName.trim()) {
        next.responsibleFullName = 'Nome do responsável é obrigatório para menores de 18 anos'
      }
      if (!responsibleCpf.trim()) {
        next.responsibleCpf = 'CPF do responsável é obrigatório para menores de 18 anos'
      }
    }
    try {
      if (patientCpf.trim()) cpfSchema.parse(patientCpf)
    } catch (err) {
      if (err instanceof ZodError) next.patientCpf = err.issues[0]?.message ?? 'CPF inválido'
    }
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return false
    }
    return true
  }

  const progressPercent = step === 1 ? 33 : step === 2 ? 66 : 100

  return (
    <View className="gap-6">
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-muted-foreground">Passo {step} de 3</Text>
          <Text className="text-xs text-muted-foreground">{progressPercent}%</Text>
        </View>
        <View className="h-1.5 rounded-full bg-muted overflow-hidden">
          <View className="h-full rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
        </View>
      </View>

      {step === 1 ? (
        <View className="gap-4">
          <View className="gap-4 rounded-xl border border-border bg-card p-4">
            <Text className="text-sm font-semibold text-foreground">Dados do paciente</Text>
            <View className="gap-2">
              <Text className="text-sm font-medium">Nome do paciente</Text>
              <TextInput
                value={patientFullName}
                onChangeText={setPatientFullName}
                editable={!submitting}
                className="h-12 rounded-xl bg-muted px-4 text-base"
              />
              {fieldError(errors, 'patientFullName')}
            </View>
            <View className="gap-2">
              <Text className="text-sm font-medium">CPF do paciente</Text>
              <TextInput
                value={patientCpf}
                onChangeText={(v) => setPatientCpf(formatCpf(v))}
                editable={!submitting}
                keyboardType="numeric"
                className="h-12 rounded-xl bg-muted px-4 text-base"
              />
              {fieldError(errors, 'patientCpf')}
            </View>
            <View className="gap-2">
              <Text className="text-sm font-medium">Data de nascimento</Text>
              <TextInput
                value={birthDate}
                onChangeText={setBirthDate}
                editable={!submitting}
                placeholder="AAAA-MM-DD"
                className="h-12 rounded-xl bg-muted px-4 text-base"
              />
              {fieldError(errors, 'birthDate')}
            </View>
            <View className="gap-2">
              <Text className="text-sm font-medium">Naturalidade</Text>
              <TextInput
                value={birthPlace}
                onChangeText={setBirthPlace}
                editable={!submitting}
                placeholder="Cidade/UF de nascimento"
                className="h-12 rounded-xl bg-muted px-4 text-base"
              />
              {fieldError(errors, 'birthPlace')}
            </View>
            <EnumPicker
              label="Estado civil"
              value={maritalStatus}
              options={patientMaritalStatusValues}
              labels={patientMaritalStatusLabels}
              onChange={setMaritalStatus}
              disabled={submitting}
            />
            {fieldError(errors, 'maritalStatus')}
            <EnumPicker
              label="Gênero"
              value={gender}
              options={patientGenderValues}
              labels={patientGenderLabels}
              onChange={setGender}
              disabled={submitting}
            />
            {fieldError(errors, 'gender')}
          </View>

          <View className="gap-4 rounded-xl border border-border bg-card p-4">
            <View className="gap-1">
              <Text className="text-sm font-semibold text-foreground">Responsável</Text>
              <Text className="text-xs text-muted-foreground">
                Obrigatório apenas para menores de 18 anos. Demais casos, preenchimento opcional.
              </Text>
            </View>
            <View className="gap-2">
              <Text className="text-sm font-medium">
                Nome do responsável{responsibleRequired ? ' *' : ' (opcional)'}
              </Text>
              <TextInput
                value={responsibleFullName}
                onChangeText={setResponsibleFullName}
                editable={!submitting}
                className="h-12 rounded-xl bg-muted px-4 text-base"
              />
              {fieldError(errors, 'responsibleFullName')}
            </View>
            <View className="gap-2">
              <Text className="text-sm font-medium">
                CPF do responsável{responsibleRequired ? ' *' : ' (opcional)'}
              </Text>
              <TextInput
                value={responsibleCpf}
                onChangeText={(v) => setResponsibleCpf(formatCpf(v))}
                editable={!submitting}
                keyboardType="numeric"
                className="h-12 rounded-xl bg-muted px-4 text-base"
              />
              {fieldError(errors, 'responsibleCpf')}
            </View>
          </View>

          <Button
            onPress={() => {
              if (validateStepOne()) setStep(2)
            }}
            disabled={submitting}
          >
            Continuar
          </Button>
        </View>
      ) : step === 2 ? (
        <View className="gap-4">
          <View className="gap-4 rounded-xl border border-border bg-card p-4">
            <Text className="text-sm font-semibold text-foreground">Atendimento</Text>
            <EnumPicker
              label="Melhor período para o atendimento"
              value={attendancePeriod}
              options={attendancePeriodValues}
              labels={attendancePeriodLabels}
              onChange={setAttendancePeriod}
              disabled={submitting}
            />
            {fieldError(errors, 'attendancePeriod')}
            <View className="gap-2">
              <Text className="text-sm font-medium">Hipótese diagnóstica</Text>
              <TextInput
                value={diagnosticHypothesis}
                onChangeText={setDiagnosticHypothesis}
                editable={!submitting}
                multiline
                numberOfLines={3}
                placeholder="Ex.: dor no ombro após queda…"
                className="min-h-24 rounded-xl bg-muted px-4 py-3 text-base"
                textAlignVertical="top"
              />
              {fieldError(errors, 'diagnosticHypothesis')}
            </View>
            <EnumPicker
              label="Como nos conheceu"
              value={referralSource}
              options={patientReferralSourceValues}
              labels={patientReferralSourceLabels}
              onChange={setReferralSource}
              disabled={submitting}
            />
            {fieldError(errors, 'referralSource')}
          </View>

          <View className="gap-3 rounded-xl border border-border bg-card p-4">
            <Text className="text-sm font-medium text-foreground">
              Para continuar, confirme que leu e concorda com os termos apresentados.
            </Text>
            <Pressable
              onPress={() => setTermsAccepted((v) => !v)}
              disabled={submitting}
              className="flex-row items-start gap-3"
            >
              <View
                className={`mt-0.5 h-5 w-5 rounded border ${termsAccepted ? 'border-primary bg-primary' : 'border-border'}`}
              />
              <Text className="flex-1 text-sm leading-5 text-muted-foreground">{TERMS_DECLARATION}</Text>
            </Pressable>
            {fieldError(errors, 'termsAccepted')}
            {legalTerms.length > 0 ? (
              <View className="gap-1 pl-8">
                {legalTerms.map((term) => (
                  <Text key={term.id} className="text-sm text-primary">
                    {term.title}
                  </Text>
                ))}
              </View>
            ) : null}
          </View>

          <View className="gap-2">
            <Button variant="outline" onPress={() => setStep(1)} disabled={submitting}>
              Voltar
            </Button>
            <Button onPress={() => void handlePrepareStep()} disabled={submitting || !termsAccepted} loading={submitting}>
              Ir para pagamento
            </Button>
          </View>
        </View>
      ) : (
        <View className="gap-4">
          <View className="gap-4 rounded-xl border border-border bg-card p-4">
            <Text className="text-sm font-semibold text-foreground">Pagamento da avaliação</Text>
            <Text className="text-sm text-muted-foreground">
              {checkoutMeta?.assessmentFeeMessage ??
                'Valor da avaliação domiciliar. Se você fechar o pacote de tratamento, este valor será descontado no primeiro ciclo.'}
            </Text>
            <View className="rounded-lg bg-muted/40 px-4 py-3">
              <Text className="text-xs text-muted-foreground">Total a pagar agora</Text>
              <Text className="text-2xl font-bold text-foreground">
                {formatCurrency(checkoutMeta?.assessmentFeeCents ?? 15000)}
              </Text>
            </View>
          </View>
          <View className="gap-2">
            <Button variant="outline" onPress={() => setStep(2)} disabled={submitting}>
              Voltar
            </Button>
            <Button
              onPress={() =>
                checkoutMeta &&
                void onCheckout({
                  patientId: checkoutMeta.patientId,
                  assessmentFeeCents: checkoutMeta.assessmentFeeCents,
                })
              }
              disabled={submitting || !checkoutMeta}
              loading={submitting}
            >
              Pagar avaliação (PIX)
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}
