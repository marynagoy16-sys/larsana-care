import { useEffect, useState } from 'react'
import { CrudDrawer } from '@/components/crud/CrudDrawer'
import { FormActions } from '@/components/crud/FormActions'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  councilTypeLabels,
  credentialingStatusLabels,
  ppClassLabels,
  professionTypeLabels,
} from '@/constants/labels'
import type { CredentialingListFilters } from '@/lib/credentialingFilters'

interface CredentialingFilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: CredentialingListFilters
  onApply: (filters: CredentialingListFilters) => void
}

export function CredentialingFilterPanel({
  open,
  onOpenChange,
  filters,
  onApply,
}: CredentialingFilterPanelProps) {
  const [draft, setDraft] = useState<CredentialingListFilters>(filters)

  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  return (
    <CrudDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Filtros"
      description="Refine a fila de credenciamento."
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
            onValueChange={(v) => setDraft((d) => ({
              ...d,
              status: v === 'all' ? undefined : v,
              pending_review_only: v === 'aguardando_aprovacao' ? false : d.pending_review_only,
            }))}
          >
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(credentialingStatusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="pending_review_only"
            checked={!!draft.pending_review_only}
            onCheckedChange={(c) => setDraft((d) => ({
              ...d,
              pending_review_only: !!c,
              status: c ? undefined : d.status,
            }))}
          />
          <Label htmlFor="pending_review_only" className="font-normal cursor-pointer">
            Só aguardando aprovação
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="cardio_review_only"
            checked={!!draft.cardio_review_only}
            onCheckedChange={(c) => setDraft((d) => ({
              ...d,
              cardio_review_only: !!c,
            }))}
          />
          <Label htmlFor="cardio_review_only" className="font-normal cursor-pointer">
            Cardiorrespiratória em análise
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="hide_active"
            checked={!!draft.hide_active}
            onCheckedChange={(c) => setDraft((d) => ({ ...d, hide_active: !!c }))}
          />
          <Label htmlFor="hide_active" className="font-normal cursor-pointer">
            Ocultar ativos
          </Label>
        </div>

        <div className="space-y-2">
          <Label>Profissão</Label>
          <Select
            value={draft.profession ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({ ...d, profession: v === 'all' ? undefined : v }))}
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
          <Label>Classe PP</Label>
          <Select
            value={draft.pp_class ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({ ...d, pp_class: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(ppClassLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Conselho</Label>
          <Select
            value={draft.council_type ?? 'all'}
            onValueChange={(v) => setDraft((d) => ({ ...d, council_type: v === 'all' ? undefined : v }))}
          >
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(councilTypeLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Documentação obrigatória</Label>
          <Select
            value={
              draft.documents_complete == null
                ? 'all'
                : draft.documents_complete
                  ? 'complete'
                  : 'incomplete'
            }
            onValueChange={(v) => setDraft((d) => ({
              ...d,
              documents_complete: v === 'all' ? undefined : v === 'complete',
            }))}
          >
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="complete">Completa</SelectItem>
              <SelectItem value="incomplete">Incompleta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Contrato assinado</Label>
          <Select
            value={
              draft.contract_signed == null
                ? 'all'
                : draft.contract_signed
                  ? 'yes'
                  : 'no'
            }
            onValueChange={(v) => setDraft((d) => ({
              ...d,
              contract_signed: v === 'all' ? undefined : v === 'yes',
            }))}
          >
            <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="yes">Sim</SelectItem>
              <SelectItem value="no">Não</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Atualizado a partir de</Label>
            <Input
              type="date"
              value={draft.updated_from ?? ''}
              onChange={(e) => setDraft((d) => ({
                ...d,
                updated_from: e.target.value || undefined,
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Atualizado até</Label>
            <Input
              type="date"
              value={draft.updated_to ?? ''}
              onChange={(e) => setDraft((d) => ({
                ...d,
                updated_to: e.target.value || undefined,
              }))}
            />
          </div>
        </div>

        <FormActions onCancel={() => onOpenChange(false)} submitLabel="Aplicar filtros" />
      </form>
    </CrudDrawer>
  )
}
