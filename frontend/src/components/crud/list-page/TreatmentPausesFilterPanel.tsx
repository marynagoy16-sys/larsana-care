import { useEffect, useState } from 'react'
import { CrudDrawer } from '@/components/crud/CrudDrawer'
import { FormActions } from '@/components/crud/FormActions'
import { PatientSearchField } from '@/components/forms/PatientSearchField'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { careStatusLabels } from '@/constants/labels'
import type { TreatmentPausesListFilters } from '@/lib/treatmentPausesFilters'

interface TreatmentPausesFilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: TreatmentPausesListFilters
  onApply: (filters: TreatmentPausesListFilters) => void
}

export function TreatmentPausesFilterPanel({
  open,
  onOpenChange,
  filters,
  onApply,
}: TreatmentPausesFilterPanelProps) {
  const [draft, setDraft] = useState<TreatmentPausesListFilters>(filters)

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  return (
    <CrudDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Filtros"
      description="Refine a listagem de pausas de tratamento."
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
          <Label>Status da pausa</Label>
          <Select
            value={draft.pause_status ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({
              ...d,
              pause_status: v === 'all' ? undefined : v as TreatmentPausesListFilters['pause_status'],
            }))}
          >
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Em pausa</SelectItem>
              <SelectItem value="resumed">Retomadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Paciente</Label>
          <PatientSearchField
            value={draft.patient_id ?? ''}
            onChange={(v) => setDraft((d) => ({ ...d, patient_id: v || undefined }))}
            showCreate={false}
          />
        </div>

        <div className="space-y-2">
          <Label>Status atual do paciente</Label>
          <Select
            value={draft.patient_care_status ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({
              ...d,
              patient_care_status: v === 'all' ? undefined : v,
            }))}
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
          <Label>Início da pausa</Label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              aria-label="Início da pausa a partir de"
              value={draft.paused_from ?? ''}
              onChange={(e) => setDraft((d) => ({
                ...d,
                paused_from: e.target.value || undefined,
              }))}
            />
            <Input
              type="date"
              aria-label="Início da pausa até"
              value={draft.paused_to ?? ''}
              onChange={(e) => setDraft((d) => ({
                ...d,
                paused_to: e.target.value || undefined,
              }))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Retorno do tratamento</Label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              aria-label="Retorno a partir de"
              value={draft.resumed_from ?? ''}
              onChange={(e) => setDraft((d) => ({
                ...d,
                resumed_from: e.target.value || undefined,
              }))}
            />
            <Input
              type="date"
              aria-label="Retorno até"
              value={draft.resumed_to ?? ''}
              onChange={(e) => setDraft((d) => ({
                ...d,
                resumed_to: e.target.value || undefined,
              }))}
            />
          </div>
        </div>

        <FormActions onCancel={() => onOpenChange(false)} submitLabel="Aplicar filtros" />
      </form>
    </CrudDrawer>
  )
}
