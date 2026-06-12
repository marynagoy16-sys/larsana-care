import { useState, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Check, Mail, Phone, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MaskedInput } from '@/components/forms/MaskedInput'
import { CityRegionFields } from '@/components/forms/CityRegionFields'
import { patientWizardSchema, type PatientWizardValues } from '@/schemas/patient'
import { useCreatePatient } from '@/hooks/mutations/usePatientMutations'
import { useAllCities, useRegions } from '@/hooks/queries/useRegions'
import { careStatusLabels, patientDocumentTypeLabels, patientLevelLabels, attendancePeriodLabels } from '@/constants/labels'
import {
  CREATE_FORM_STEPS,
  JOURNEY_STAGES,
  getInitials,
  type CreateFormStepId,
} from '@/components/patients/patientDrawerShared'
import type { Tables } from '@/types/database'
import { cn } from '@/lib/utils'

const defaultValues: PatientWizardValues = {
  patient: {
    full_name: '',
    cpf: '',
    birth_date: '',
    patient_level: 'N1',
    care_status: 'ATIVO',
    region_id: '',
    city_id: '',
    allocated_professional_id: null,
    suggested_weekly_frequency: 2,
    attendance_period: null,
    clinical_summary: '',
    is_valor_social: false,
  },
  responsible: {
    full_name: '',
    cpf: '',
    email: '',
    phone: '',
    backup_phone: '',
    is_primary: true,
  },
  address: {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    postal_code: '',
    city_id: '',
    full_address: '',
  },
  documents: [],
}

interface PendingDoc {
  file: File
  document_type: Tables<'patient_documents'>['document_type']
}

interface PatientCreateDrawerContentProps {
  onClose: () => void
  onCreated?: (patientId: string) => void
}

const stepFields: Record<CreateFormStepId, (keyof PatientWizardValues)[]> = {
  patient: ['patient'],
  responsible: ['responsible'],
  address: ['address'],
  documents: [],
}

export function PatientCreateDrawerContent({ onClose, onCreated }: PatientCreateDrawerContentProps) {
  const [step, setStep] = useState<CreateFormStepId>('patient')
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([])
  const [docType, setDocType] = useState<Tables<'patient_documents'>['document_type']>('OUTRO')
  const createPatient = useCreatePatient()
  const { data: regions = [] } = useRegions()
  const { data: allCities = [] } = useAllCities()

  const form = useForm<PatientWizardValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(patientWizardSchema) as any,
    defaultValues,
    mode: 'onBlur',
  })

  const regionId = form.watch('patient.region_id')
  const patientCityId = form.watch('patient.city_id')
  const patientName = form.watch('patient.full_name')
  const responsibleEmail = form.watch('responsible.email')
  const responsiblePhone = form.watch('responsible.phone')

  const syncCitySelection = (cityId: string, nextRegionId: string) => {
    form.setValue('patient.city_id', cityId, { shouldValidate: true, shouldDirty: true })
    form.setValue('patient.region_id', nextRegionId, { shouldValidate: true, shouldDirty: true })
    form.setValue('address.city_id', cityId, { shouldValidate: true, shouldDirty: true })
  }

  const stepIndex = CREATE_FORM_STEPS.findIndex((s) => s.id === step)

  const handleClose = () => {
    if (form.formState.isDirty && !confirm('Descartar alterações?')) return
    form.reset(defaultValues)
    setStep('patient')
    setPendingDocs([])
    onClose()
  }

  const goNext = async () => {
    const fields = stepFields[step]
    if (fields.length > 0) {
      const valid = await form.trigger(fields as never)
      if (!valid) return
    }
    if (stepIndex < CREATE_FORM_STEPS.length - 1) {
      setStep(CREATE_FORM_STEPS[stepIndex + 1].id)
    }
  }

  const goBack = () => {
    if (stepIndex > 0) setStep(CREATE_FORM_STEPS[stepIndex - 1].id)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const created = await createPatient.mutateAsync({ values, pendingFiles: pendingDocs })
    form.reset(defaultValues)
    setStep('patient')
    setPendingDocs([])
    onCreated?.(created.id)
    onClose()
  })

  const handleAddDoc = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingDocs((prev) => [...prev, { file, document_type: docType }])
    e.target.value = ''
  }

  const selectedRegion = regions.find((r) => r.id === regionId)
  const selectedCity = allCities.find((c) => c.id === patientCityId)

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={handleClose} className="text-muted-foreground hover:text-foreground" aria-label="Fechar">
              <X size={18} />
            </button>
            <h2 className="font-semibold text-sm truncate">Novo paciente</h2>
          </div>
          {step === 'documents' ? (
            <Button type="submit" size="sm" className="h-8 shrink-0" disabled={createPatient.isPending}>
              {createPatient.isPending ? 'Salvando...' : 'Cadastrar'}
            </Button>
          ) : (
            <Button type="button" size="sm" className="h-8 shrink-0" onClick={goNext}>
              Próximo
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-5 border-b border-border">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 shrink-0">
                <AvatarFallback className="text-base bg-primary/10 text-primary">
                  {getInitials(patientName || 'NP')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 space-y-2">
                <FormField
                  control={form.control}
                  name="patient.full_name"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormControl>
                        <Input {...field} placeholder="Nome completo do paciente" className="font-semibold text-base h-10" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {responsibleEmail && (
                    <span className="flex items-center gap-1 truncate">
                      <Mail size={13} />
                      {responsibleEmail}
                    </span>
                  )}
                  {responsiblePhone && (
                    <span className="flex items-center gap-1">
                      <Phone size={13} />
                      {responsiblePhone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-5 py-4 border-b border-border text-sm">
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground mb-1">Status</p>
              <p className="font-semibold truncate">{careStatusLabels[form.watch('patient.care_status')]}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground mb-1">Nível</p>
              <p className="font-semibold truncate">{patientLevelLabels[form.watch('patient.patient_level')]}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground mb-1">Região</p>
              <p className="font-semibold truncate">{selectedRegion ? `${selectedRegion.code}` : '—'}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground mb-1">Cidade</p>
              <p className="font-semibold truncate">{selectedCity?.name ?? '—'}</p>
            </div>
            <div className="min-w-0 col-span-2 sm:col-span-1">
              <p className="text-[11px] text-muted-foreground mb-1">CPF</p>
              <p className="font-semibold truncate tabular-nums">{form.watch('patient.cpf') || '—'}</p>
            </div>
          </div>

          <div className="px-5 py-4 border-b border-border space-y-4">
            <div className="grid grid-cols-4 rounded-lg border border-border overflow-hidden text-center text-xs font-medium">
              {JOURNEY_STAGES.map((stage) => (
                <div
                  key={stage.id}
                  className={cn(
                    'py-2 px-1 border-r border-border last:border-r-0',
                    stage.id === 'cadastro' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground',
                  )}
                >
                  {stage.label}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
              {CREATE_FORM_STEPS.map((s, i) => {
                const done = i < stepIndex
                const current = i === stepIndex
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStep(s.id)}
                    className="flex items-center flex-1 min-w-[72px]"
                  >
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                      <div
                        className={cn(
                          'h-6 w-6 rounded-full flex items-center justify-center border-2 shrink-0',
                          done && 'bg-primary border-primary text-primary-foreground',
                          current && !done && 'border-primary bg-background',
                          !done && !current && 'border-muted-foreground/30 bg-background',
                        )}
                      >
                        {done ? <Check size={12} /> : current ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                      </div>
                      <span className="text-[10px] text-center text-muted-foreground leading-tight px-0.5">{s.label}</span>
                    </div>
                    {i < CREATE_FORM_STEPS.length - 1 && (
                      <div className={cn('h-0.5 flex-1 -mt-5', i < stepIndex ? 'bg-primary' : 'bg-border')} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">
            {step === 'patient' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Dados do paciente</h4>
                <FormField control={form.control} name="patient.cpf" render={({ field }) => (
                  <FormItem><FormLabel>CPF</FormLabel><FormControl><MaskedInput mask="cpf" value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="patient.birth_date" render={({ field }) => (
                  <FormItem><FormLabel>Data de nascimento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="patient.patient_level" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Object.entries(patientLevelLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="patient.care_status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {Object.entries(careStatusLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="patient.city_id" render={() => (
                  <FormItem>
                    <CityRegionFields
                      cityId={patientCityId}
                      regionId={regionId}
                      onCityChange={syncCitySelection}
                    />
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="patient.region_id" render={() => (
                  <FormItem className="hidden">
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="patient.attendance_period" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período de atendimento</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                      value={field.value ?? '__none__'}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Não informado</SelectItem>
                        {Object.entries(attendancePeriodLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="patient.clinical_summary" render={({ field }) => (
                  <FormItem><FormLabel>Resumo clínico</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} rows={3} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            )}

            {step === 'responsible' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Responsável</h4>
                <FormField control={form.control} name="responsible.full_name" render={({ field }) => (
                  <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="responsible.cpf" render={({ field }) => (
                  <FormItem><FormLabel>CPF</FormLabel><FormControl><MaskedInput mask="cpf" value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="responsible.email" render={({ field }) => (
                  <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="responsible.phone" render={({ field }) => (
                  <FormItem><FormLabel>Telefone</FormLabel><FormControl><MaskedInput mask="phone" value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            )}

            {step === 'address' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Endereço</h4>
                <FormField control={form.control} name="address.city_id" render={() => (
                  <FormItem>
                    <CityRegionFields
                      cityId={form.watch('address.city_id') || patientCityId}
                      regionId={regionId}
                      onCityChange={syncCitySelection}
                    />
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="address.postal_code" render={({ field }) => (
                  <FormItem><FormLabel>CEP</FormLabel><FormControl><MaskedInput mask="cep" value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="address.street" render={({ field }) => (
                  <FormItem><FormLabel>Rua</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="address.number" render={({ field }) => (
                    <FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="address.complement" render={({ field }) => (
                    <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="address.neighborhood" render={({ field }) => (
                  <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            )}

            {step === 'documents' && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold">Documentos</h4>
                <div className="rounded-xl border border-dashed border-border p-4 space-y-3">
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Tipo</label>
                      <Select value={docType} onValueChange={(v) => setDocType(v as Tables<'patient_documents'>['document_type'])}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(patientDocumentTypeLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Arquivo</label>
                      <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleAddDoc} />
                    </div>
                  </div>
                  {pendingDocs.length > 0 && (
                    <ul className="text-sm space-y-2">
                      {pendingDocs.map((d, i) => (
                        <li key={i} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                          <span className="truncate">{d.file.name}</span>
                          <button type="button" className="text-destructive text-xs shrink-0 ml-2" onClick={() => setPendingDocs((p) => p.filter((_, j) => j !== i))}>
                            Remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Upload size={12} />
                    Opcional. Máx. 10 MB por arquivo.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center justify-between gap-2 px-5 py-3 border-t border-border bg-muted/30">
          <Button type="button" variant="ghost" size="sm" onClick={goBack} disabled={stepIndex === 0}>
            Voltar
          </Button>
          {step !== 'documents' ? (
            <Button type="button" size="sm" onClick={goNext}>
              Continuar
            </Button>
          ) : (
            <Button type="submit" size="sm" disabled={createPatient.isPending}>
              {createPatient.isPending ? 'Salvando...' : 'Cadastrar paciente'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
