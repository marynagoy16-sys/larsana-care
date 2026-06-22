import { useEffect, useState } from 'react'
import { CrudDrawer } from '@/components/crud/CrudDrawer'
import { FormActions } from '@/components/crud/FormActions'
import { PatientSearchField } from '@/components/forms/PatientSearchField'
import { ProfessionalSearchField } from '@/components/forms/ProfessionalSearchField'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRegions } from '@/hooks/queries/useRegions'
import { cycleStatusLabels, patientLevelLabels, paymentStatusLabels } from '@/constants/labels'
import type { CareCyclesListFilters } from '@/lib/careCyclesFilters'

interface CareCyclesFilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: CareCyclesListFilters
  onApply: (filters: CareCyclesListFilters) => void
}

export function CareCyclesFilterPanel({
  open,
  onOpenChange,
  filters,
  onApply,
}: CareCyclesFilterPanelProps) {
  const [draft, setDraft] = useState<CareCyclesListFilters>(filters)
  const { data: regions = [], isLoading: regionsLoading } = useRegions()

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  return (
    <CrudDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Filtros"
      description="Refine a listagem de ciclos de tratamento."
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
          <Label>Status do ciclo</Label>
          <Select
            value={draft.status ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({ ...d, status: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(cycleStatusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Pagamento</Label>
          <Select
            value={draft.payment_status ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({ ...d, payment_status: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(paymentStatusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
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
          <Label>Profissional</Label>
          <ProfessionalSearchField
            value={draft.assigned_professional_id ?? ''}
            onChange={(v) => setDraft((d) => ({ ...d, assigned_professional_id: v || undefined }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Região</Label>
          <Select
            value={draft.region_id ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({ ...d, region_id: v === 'all' ? undefined : v }))}
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

        <div className="grid grid-cols-2 gap-3">
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
            <Label>Sessões no ciclo</Label>
            <Select
              value={draft.session_count ? String(draft.session_count) : 'all'}
              onValueChange={(v) => setDraft((d) => ({
                ...d,
                session_count: v === 'all' ? undefined : Number(v),
              }))}
            >
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="4">4 sessões</SelectItem>
                <SelectItem value="8">8 sessões</SelectItem>
                <SelectItem value="12">12 sessões</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Início do ciclo</Label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              aria-label="Início a partir de"
              value={draft.started_from ?? ''}
              onChange={(e) => setDraft((d) => ({
                ...d,
                started_from: e.target.value || undefined,
              }))}
            />
            <Input
              type="date"
              aria-label="Início até"
              value={draft.started_to ?? ''}
              onChange={(e) => setDraft((d) => ({
                ...d,
                started_to: e.target.value || undefined,
              }))}
            />
          </div>
        </div>

        <FormActions onCancel={() => onOpenChange(false)} submitLabel="Aplicar filtros" />
      </form>
    </CrudDrawer>
  )
}
