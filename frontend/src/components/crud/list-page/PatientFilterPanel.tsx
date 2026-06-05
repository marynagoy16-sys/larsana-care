import { useEffect, useState } from 'react'
import { CrudDrawer } from '@/components/crud/CrudDrawer'
import { FormActions } from '@/components/crud/FormActions'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { careStatusLabels, patientLevelLabels } from '@/constants/labels'
import { useRegions } from '@/hooks/queries/useRegions'

export interface PatientListFilters {
  care_status?: string
  patient_level?: string
  region_id?: string
  is_data_complete?: boolean
  sem_pp?: boolean
}

interface PatientFilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: PatientListFilters
  onApply: (filters: PatientListFilters) => void
}

export const emptyPatientFilters: PatientListFilters = {}

export function countActiveFilters(filters: PatientListFilters): number {
  let n = 0
  if (filters.care_status) n++
  if (filters.patient_level) n++
  if (filters.region_id) n++
  if (filters.is_data_complete === false) n++
  if (filters.sem_pp) n++
  return n
}

export function PatientFilterPanel({ open, onOpenChange, filters, onApply }: PatientFilterPanelProps) {
  const { data: regions = [] } = useRegions()
  const [draft, setDraft] = useState<PatientListFilters>(filters)

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  return (
    <CrudDrawer open={open} onOpenChange={onOpenChange} title="Filtros" description="Refine a listagem de pacientes." size="md">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onApply(draft)
          onOpenChange(false)
        }}
        className="space-y-5"
      >
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={draft.care_status ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({ ...d, care_status: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(careStatusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Nível</Label>
          <Select
            value={draft.patient_level ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({ ...d, patient_level: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(patientLevelLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Região</Label>
          <Select
            value={draft.region_id ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({ ...d, region_id: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.code} — {r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="incomplete"
            checked={draft.is_data_complete === false}
            onCheckedChange={(c) => setDraft((d) => ({ ...d, is_data_complete: c ? false : undefined }))}
          />
          <Label htmlFor="incomplete" className="font-normal cursor-pointer">Cadastro incompleto</Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="sem_pp"
            checked={!!draft.sem_pp}
            onCheckedChange={(c) => setDraft((d) => ({ ...d, sem_pp: !!c }))}
          />
          <Label htmlFor="sem_pp" className="font-normal cursor-pointer">Sem PP alocado</Label>
        </div>

        <FormActions onCancel={() => onOpenChange(false)} submitLabel="Aplicar filtros" />
      </form>
    </CrudDrawer>
  )
}
