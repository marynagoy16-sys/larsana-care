import { useEffect, useState } from 'react'
import { CrudDrawer } from '@/components/crud/CrudDrawer'
import { FormActions } from '@/components/crud/FormActions'
import { CycleSearchField } from '@/components/forms/CycleSearchField'
import { PatientSearchField } from '@/components/forms/PatientSearchField'
import { ProfessionalSearchField } from '@/components/forms/ProfessionalSearchField'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useRegions } from '@/hooks/queries/useRegions'
import { medicalRecordTypeLabels } from '@/constants/labels'
import type { MedicalRecordsListFilters } from '@/lib/medicalRecordsFilters'

interface MedicalRecordsFilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: MedicalRecordsListFilters
  onApply: (filters: MedicalRecordsListFilters) => void
}

export function MedicalRecordsFilterPanel({
  open,
  onOpenChange,
  filters,
  onApply,
}: MedicalRecordsFilterPanelProps) {
  const [draft, setDraft] = useState<MedicalRecordsListFilters>(filters)
  const { data: regions = [], isLoading: regionsLoading } = useRegions()

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  return (
    <CrudDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Filtros"
      description="Refine a listagem de prontuários."
      size="md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onApply(draft)
          onOpenChange(false)
        }}
        className="space-y-5"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Registrado a partir de</Label>
            <Input
              type="date"
              value={draft.recorded_from ?? ''}
              onChange={(e) => setDraft((d) => ({
                ...d,
                recorded_from: e.target.value || undefined,
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Registrado até</Label>
            <Input
              type="date"
              value={draft.recorded_to ?? ''}
              onChange={(e) => setDraft((d) => ({
                ...d,
                recorded_to: e.target.value || undefined,
              }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Paciente</Label>
          <PatientSearchField
            value={draft.patient_id ?? ''}
            onChange={(v) => setDraft((d) => ({
              ...d,
              patient_id: v || undefined,
              cycle_id: v ? d.cycle_id : undefined,
            }))}
            showCreate={false}
          />
        </div>

        <div className="space-y-2">
          <Label>Profissional</Label>
          <ProfessionalSearchField
            value={draft.professional_id ?? ''}
            onChange={(v) => setDraft((d) => ({ ...d, professional_id: v || undefined }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Tipo de registro</Label>
          <Select
            value={draft.record_type ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({
              ...d,
              record_type: v === 'all' ? undefined : v,
            }))}
          >
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(medicalRecordTypeLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Região do paciente</Label>
          <Select
            value={draft.region_id ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({
              ...d,
              region_id: v === 'all' ? undefined : v,
            }))}
            disabled={regionsLoading}
          >
            <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region.id} value={region.id}>
                  {region.code} — {region.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Ciclo</Label>
          <CycleSearchField
            value={draft.cycle_id ?? ''}
            onChange={(v) => setDraft((d) => ({ ...d, cycle_id: v || undefined }))}
            patientId={draft.patient_id}
          />
        </div>

        <div className="space-y-2">
          <Label>Vínculo com sessão</Label>
          <Select
            value={draft.session_link ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({
              ...d,
              session_link: v as MedicalRecordsListFilters['session_link'],
            }))}
          >
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="with">Com sessão vinculada</SelectItem>
              <SelectItem value="without">Sem sessão (administrativo)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="compliance_only"
            checked={!!draft.compliance_only}
            onCheckedChange={(c) => setDraft((d) => ({ ...d, compliance_only: !!c }))}
          />
          <Label htmlFor="compliance_only" className="font-normal cursor-pointer">
            Só pendências de conformidade (sem conteúdo ou alerta 24h)
          </Label>
        </div>

        <FormActions onCancel={() => onOpenChange(false)} submitLabel="Aplicar filtros" />
      </form>
    </CrudDrawer>
  )
}
