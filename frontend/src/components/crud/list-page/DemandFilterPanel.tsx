import { useEffect, useState } from 'react'
import { CrudDrawer } from '@/components/crud/CrudDrawer'
import { FormActions } from '@/components/crud/FormActions'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  attendancePeriodLabels,
  demandStatusLabels,
  demandTypeLabels,
  patientLevelLabels,
  professionTypeLabels,
} from '@/constants/labels'
import { ProfessionalSearchField } from '@/components/forms/ProfessionalSearchField'
import { useRegions } from '@/hooks/queries/useRegions'
import type { DemandListFilters } from '@/lib/demandFilters'

interface DemandFilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: DemandListFilters
  onApply: (filters: DemandListFilters) => void
}

export function DemandFilterPanel({ open, onOpenChange, filters, onApply }: DemandFilterPanelProps) {
  const { data: regions = [] } = useRegions()
  const [draft, setDraft] = useState<DemandListFilters>(filters)

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  return (
    <CrudDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Filtros"
      description="Refine a listagem de demandas."
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
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={draft.status ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({ ...d, status: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(demandStatusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={draft.demand_type ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({ ...d, demand_type: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(demandTypeLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Profissão requerida</Label>
          <Select
            value={draft.required_profession ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({ ...d, required_profession: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(professionTypeLabels).map(([k, v]) => (
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

        <div className="space-y-2">
          <Label>Nível do paciente</Label>
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
          <Label>Período de atendimento</Label>
          <Select
            value={draft.attendance_period ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({ ...d, attendance_period: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(attendancePeriodLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Profissional atribuído</Label>
          <ProfessionalSearchField
            value={draft.assigned_professional_id ?? ''}
            onChange={(id) => setDraft((d) => ({
              ...d,
              assigned_professional_id: id || undefined,
              sem_pp: id ? false : d.sem_pp,
            }))}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="sem_pp"
            checked={!!draft.sem_pp}
            onCheckedChange={(c) => setDraft((d) => ({
              ...d,
              sem_pp: !!c,
              assigned_professional_id: c ? undefined : d.assigned_professional_id,
            }))}
          />
          <Label htmlFor="sem_pp" className="font-normal cursor-pointer">Sem PP atribuído</Label>
        </div>

        <div className="space-y-2">
          <Label>Bairro</Label>
          <Input
            placeholder="Ex.: Centro, Vila…"
            value={draft.neighborhood ?? ''}
            onChange={(e) => setDraft((d) => ({
              ...d,
              neighborhood: e.target.value || undefined,
            }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Criada a partir de</Label>
            <Input
              type="date"
              value={draft.created_from ?? ''}
              onChange={(e) => setDraft((d) => ({
                ...d,
                created_from: e.target.value || undefined,
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Criada até</Label>
            <Input
              type="date"
              value={draft.created_to ?? ''}
              onChange={(e) => setDraft((d) => ({
                ...d,
                created_to: e.target.value || undefined,
              }))}
            />
          </div>
        </div>

        <FormActions onCancel={() => onOpenChange(false)} submitLabel="Aplicar filtros" />
      </form>
    </CrudDrawer>
  )
}
