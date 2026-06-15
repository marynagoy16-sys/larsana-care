import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CrudModal } from '@/components/crud/CrudModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import {
  deletePlanDay,
  larsanapillAdminKeys,
  listAdminContents,
  listPlanDays,
  upsertPlanDay,
} from '@/services/academyAdmin'
import type { LarsanaPillContent, LarsanaPillWeeklyPlan } from '@/types/academy'

interface DayDraft {
  id?: string
  day_index: number
  title: string
  content_id: string
  instructions: string
}

interface WeeklyPlanDaysModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: LarsanaPillWeeklyPlan | null
  categoryId: string
}

function emptyDraft(dayIndex: number): DayDraft {
  return {
    day_index: dayIndex,
    title: `Dia ${dayIndex}`,
    content_id: '',
    instructions: '',
  }
}

export function WeeklyPlanDaysModal({ open, onOpenChange, plan, categoryId }: WeeklyPlanDaysModalProps) {
  const [drafts, setDrafts] = useState<DayDraft[]>([])

  const { data: existingDays = [] } = useQuery({
    queryKey: larsanapillAdminKeys.planDays(plan?.id ?? ''),
    queryFn: () => listPlanDays(plan!.id),
    enabled: open && Boolean(plan?.id),
  })

  const { data: contents = [] } = useQuery({
    queryKey: larsanapillAdminKeys.contents(categoryId),
    queryFn: () => listAdminContents(categoryId),
    enabled: open && Boolean(categoryId),
  })

  useEffect(() => {
    if (!open || !plan) return
    const byIndex = new Map(existingDays.map((day) => [day.day_index, day]))
    setDrafts(
      Array.from({ length: 7 }, (_, i) => {
        const dayIndex = i + 1
        const existing = byIndex.get(dayIndex)
        if (existing) {
          return {
            id: existing.id,
            day_index: existing.day_index,
            title: existing.title,
            content_id: existing.content_id ?? '',
            instructions: existing.instructions ?? '',
          }
        }
        return emptyDraft(dayIndex)
      }),
    )
  }, [open, plan, existingDays])

  const saveAll = useCrudMutation({
    mutationFn: async (draftsToSave: DayDraft[]) => {
      if (!plan) return
      for (const draft of draftsToSave) {
        const hasData = draft.title.trim() || draft.content_id || draft.instructions.trim()
        if (!hasData) {
          if (draft.id) await deletePlanDay(draft.id)
          continue
        }
        await upsertPlanDay({
          id: draft.id,
          plan_id: plan.id,
          day_index: draft.day_index,
          title: draft.title.trim() || `Dia ${draft.day_index}`,
          content_id: draft.content_id || null,
          instructions: draft.instructions.trim() || null,
          sort_order: draft.day_index,
        })
      }
    },
    queryKey: larsanapillAdminKeys.planDays(plan?.id ?? ''),
    successMessage: 'Dias do plano salvos',
    onSuccess: () => onOpenChange(false),
  })

  const updateDraft = (dayIndex: number, patch: Partial<DayDraft>) => {
    setDrafts((prev) => prev.map((d) => (d.day_index === dayIndex ? { ...d, ...patch } : d)))
  }

  if (!plan) return null

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title={`Dias do plano — ${plan.code}`}
      description={plan.title}
      size="full"
      layout="form"
    >
      <div className="flex flex-1 flex-col min-h-0">
        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          {drafts.map((draft) => (
            <div key={draft.day_index} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-sm font-semibold">Dia {draft.day_index}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Título</Label>
                  <Input
                    value={draft.title}
                    onChange={(e) => updateDraft(draft.day_index, { title: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Conteúdo vinculado</Label>
                  <Select
                    value={draft.content_id || '__none__'}
                    onValueChange={(v) => updateDraft(draft.day_index, { content_id: v === '__none__' ? '' : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum (só instruções)</SelectItem>
                      {contents.map((c: LarsanaPillContent) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Instruções (se não houver conteúdo)</Label>
                <Textarea
                  rows={2}
                  value={draft.instructions}
                  onChange={(e) => updateDraft(draft.day_index, { instructions: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="shrink-0 border-t pt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saveAll.isPending}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => saveAll.mutate(drafts)} disabled={saveAll.isPending}>
            {saveAll.isPending ? 'Salvando…' : 'Salvar dias'}
          </Button>
        </div>
      </div>
    </CrudModal>
  )
}
