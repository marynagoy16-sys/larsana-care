import { useEffect } from 'react'
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
import { patientStepSchema, type PatientStepValues } from '@/schemas/patient'
import { usePatient } from '@/hooks/queries/usePatients'
import { useUpdatePatient } from '@/hooks/mutations/usePatientMutations'
import { useRegions, useCities } from '@/hooks/queries/useRegions'
import { careStatusLabels, patientLevelLabels } from '@/constants/labels'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'

export function PatientEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: patient, isLoading } = usePatient(id)
  const updatePatient = useUpdatePatient()
  const { data: regions = [] } = useRegions()

  const form = useForm<PatientStepValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(patientStepSchema) as any,
    defaultValues: {
      full_name: '',
      cpf: '',
      birth_date: '',
      patient_level: 'N1',
      care_status: 'ATIVO',
      region_id: '',
      city_id: '',
      clinical_summary: '',
      is_valor_social: false,
    },
  })

  const regionId = form.watch('region_id')
  const { data: cities = [] } = useCities(regionId || undefined)

  useEffect(() => {
    if (!patient) return
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
      clinical_summary: patient.clinical_summary ?? '',
      is_valor_social: patient.is_valor_social,
    })
  }, [patient, form])

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
            await updatePatient.mutateAsync({ id, values })
            navigate(`/admin/pacientes/${id}`)
          })}
          className="space-y-4"
        >
          <FormField control={form.control} name="full_name" render={({ field }) => (
            <FormItem><FormLabel>Nome completo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="cpf" render={({ field }) => (
            <FormItem><FormLabel>CPF</FormLabel><FormControl><MaskedInput mask="cpf" value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="birth_date" render={({ field }) => (
            <FormItem><FormLabel>Data de nascimento</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
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
          <FormField control={form.control} name="region_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Região</FormLabel>
              <Select onValueChange={(v) => { field.onChange(v); form.setValue('city_id', '') }} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {regions.map((r) => <SelectItem key={r.id} value={r.id}>{r.code} — {r.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="city_id" render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!regionId}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {cities.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
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
