import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CrudDrawer } from '@/components/crud/CrudDrawer'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormActions } from '@/components/crud/FormActions'
import { MaskedInput } from '@/components/forms/MaskedInput'
import { CityRegionFields } from '@/components/forms/CityRegionFields'
import { patientEditSchema, type PatientEditValues } from '@/schemas/patient'
import { usePatient } from '@/hooks/queries/usePatients'
import { useUpdatePatient } from '@/hooks/mutations/usePatientMutations'
import { patientLevelLabels, attendancePeriodLabels } from '@/constants/labels'
import { PatientCareStatusSelect } from '@/components/forms/PatientCareStatusSelect'
import { PatientTechnicalCategorySelect } from '@/components/forms/PatientTechnicalCategorySelect'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'

export function PatientEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: patient, isLoading } = usePatient(id)
  const updatePatient = useUpdatePatient()
  const { data: professionals = [] } = useQuery({
    queryKey: ['admin', 'professionals', 'options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professionals')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name')
      if (error) throw error
      return data ?? []
    },
  })

  const form = useForm<PatientEditValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(patientEditSchema) as any,
    defaultValues: {
      full_name: '',
      cpf: '',
      birth_date: '',
      patient_level: 'N1',
      care_status: 'ATIVO',
      region_id: '',
      city_id: '',
      attendance_period: null,
      technical_category: null,
      clinical_summary: '',
      is_valor_social: false,
    },
  })

  const regionId = form.watch('region_id')
  const cityId = form.watch('city_id')
  const isDirty = form.formState.isDirty
  const loadedStamp = patient ? `${patient.id}:${patient.updated_at}` : null

  useEffect(() => {
    if (!patient || !loadedStamp || isDirty) return
    form.reset({
      full_name: patient.full_name,
      cpf: patient.cpf ?? '',
      birth_date: patient.birth_date ?? '',
      patient_level: patient.patient_level,
      care_status: patient.care_status,
      region_id: patient.region_id ?? '',
      city_id: patient.city_id ?? '',
      allocated_professional_id: patient.allocated_professional_id,
      suggested_weekly_frequency: patient.suggested_weekly_frequency,
      attendance_period: patient.attendance_period ?? null,
      technical_category: patient.technical_category ?? null,
      clinical_summary: patient.clinical_summary ?? '',
      is_valor_social: patient.is_valor_social,
    })
    // `form` muda de identidade a cada render; depender dele apagava a edição.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedStamp, isDirty])

  if (isLoading) {
    return (
      <CrudDrawer
        open
        onOpenChange={(open) => !open && id && navigate(`/admin/pacientes/${id}`)}
        title="Editar paciente"
        size="lg"
      >
        <DetailPageSkeleton fields={8} />
      </CrudDrawer>
    )
  }

  if (!patient || !id) {
    return <div className="p-6 text-muted-foreground">Paciente não encontrado.</div>
  }

  return (
    <CrudDrawer
      open
      onOpenChange={(open) => !open && navigate(`/admin/pacientes/${id}`)}
      title="Editar paciente"
      description={patient.full_name}
      size="lg"
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(async (values) => {
            await updatePatient.mutateAsync({
              id,
              values: {
                full_name: values.full_name,
                cpf: values.cpf,
                birth_date: values.birth_date,
                patient_level: values.patient_level,
                care_status: values.care_status,
                region_id: values.region_id,
                city_id: values.city_id,
                allocated_professional_id: values.allocated_professional_id,
                suggested_weekly_frequency: values.suggested_weekly_frequency,
                attendance_period: values.attendance_period,
                technical_category: values.technical_category,
                clinical_summary: values.clinical_summary,
                is_valor_social: values.is_valor_social,
              },
            })
            navigate(`/admin/pacientes/${id}`)
          }, () => {
            toast.error('Não foi possível salvar. Revise os campos destacados.')
          })}
          className="space-y-4"
        >
          <FormField control={form.control} name="full_name" render={({ field }) => (
            <FormItem><FormLabel>Nome completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="cpf" render={({ field }) => (
            <FormItem><FormLabel>CPF</FormLabel><FormControl><MaskedInput mask="cpf" value={field.value ?? ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="birth_date" render={({ field }) => (
            <FormItem><FormLabel>Data de nascimento</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="allocated_professional_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Profissional responsável</FormLabel>
              <Select
                value={field.value ?? 'none'}
                onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
              >
                <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {professionals.map((professional) => (
                    <SelectItem key={professional.id} value={professional.id}>{professional.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="patient_level" render={({ field }) => (
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
            <FormField control={form.control} name="care_status" render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <PatientCareStatusSelect value={field.value} onValueChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="technical_category" render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria técnica de atendimento</FormLabel>
                <FormControl>
                  <PatientTechnicalCategorySelect
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <FormField control={form.control} name="city_id" render={() => (
            <FormItem>
              <CityRegionFields
                cityId={cityId ?? ''}
                regionId={regionId ?? ''}
                onCityChange={(nextCityId, nextRegionId) => {
                  form.setValue('city_id', nextCityId, { shouldValidate: true, shouldDirty: true })
                  form.setValue('region_id', nextRegionId, { shouldValidate: true, shouldDirty: true })
                }}
              />
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="region_id" render={() => (
            <FormItem className="hidden">
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="attendance_period" render={({ field }) => (
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
          <FormField control={form.control} name="clinical_summary" render={({ field }) => (
            <FormItem><FormLabel>Resumo clínico</FormLabel><FormControl><Textarea {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormActions
            onCancel={() => navigate(`/admin/pacientes/${id}`)}
            isSubmitting={updatePatient.isPending}
            submitLabel="Salvar"
          />
        </form>
      </Form>
    </CrudDrawer>
  )
}
