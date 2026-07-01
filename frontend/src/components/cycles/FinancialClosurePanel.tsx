import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Calculator, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/formatters'
import type { PauseType } from '@/lib/financialClosure'
import { closeCycleFinancially, previewFinancialClosure } from '@/services/financialClosure'
import { pauseTypeLabels } from '@/constants/labels'

const PAUSE_TYPE_OPTIONS: { value: PauseType; label: string }[] = [
  { value: 'none', label: 'Ciclo concluído (sem pausa)' },
  { value: 'justified', label: 'Pausa justificada' },
  { value: 'unjustified', label: 'Pausa injustificada' },
  { value: 'professional_or_operation_issue', label: 'Problema PP / operação' },
]

interface FinancialClosurePanelProps {
  cycleId: string
  sessionsCompleted: number
  sessionCount: number
  cycleStatus: string
  onClosed?: () => void
}

export function FinancialClosurePanel({
  cycleId,
  sessionsCompleted,
  sessionCount,
  cycleStatus,
  onClosed,
}: FinancialClosurePanelProps) {
  const queryClient = useQueryClient()
  const [pauseType, setPauseType] = useState<PauseType>('none')
  const [adminDecision, setAdminDecision] = useState('')

  const isClosed = cycleStatus === 'fechado_financeiramente'

  const { data: preview, isLoading, isFetching } = useQuery({
    queryKey: ['financial_closure_preview', cycleId, pauseType],
    queryFn: () => previewFinancialClosure(cycleId, pauseType),
    enabled: !!cycleId && !isClosed,
  })

  const closeMutation = useMutation({
    mutationFn: () => closeCycleFinancially(cycleId, pauseType, adminDecision || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care_cycle_detail', cycleId] })
      queryClient.invalidateQueries({ queryKey: ['financial_closure_preview', cycleId] })
      onClosed?.()
    },
  })

  if (isClosed) {
    return (
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold">Fechamento financeiro</h3>
        </div>
        <div className="px-5 py-4">
          <Badge variant="secondary">Ciclo fechado financeiramente</Badge>
        </div>
      </div>
    )
  }

  const rows = preview
    ? [
        { label: 'Valor total do ciclo', value: formatCurrency(preview.gross_cycle_amount_cents) },
        {
          label: 'Atendimentos realizados',
          value: `${preview.sessions_completed} de ${preview.sessions_contracted}`,
        },
        { label: 'Valor realizado', value: formatCurrency(preview.completed_amount_cents) },
        { label: 'Saldo remanescente', value: formatCurrency(preview.remaining_amount_cents) },
        { label: 'Repasse PP calculado', value: formatCurrency(preview.pp_release_amount_cents) },
        { label: 'Comissão Larsana', value: formatCurrency(preview.larsana_commission_amount_cents) },
        { label: 'Taxa operacional', value: formatCurrency(preview.operational_fee_cents) },
        { label: 'Reembolso família', value: formatCurrency(preview.family_refund_amount_cents) },
        {
          label: 'Total Larsana',
          value: formatCurrency(preview.larsana_total_cents),
          highlight: true,
        },
      ]
    : []

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Calculator size={16} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold">Fechamento financeiro</h3>
        </div>
        {(isLoading || isFetching) && <Loader2 size={16} className="animate-spin text-muted-foreground" />}
      </div>

      <div className="px-5 py-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Tipo de pausa / encerramento</Label>
            <Select value={pauseType} onValueChange={(v) => setPauseType(v as PauseType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAUSE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Sessões realizadas</Label>
            <p className="text-sm font-medium pt-2">
              {sessionsCompleted} de {sessionCount}
            </p>
          </div>
        </div>

        {pauseType === 'professional_or_operation_issue' && (
          <div className="space-y-2">
            <Label>Decisão administrativa</Label>
            <Textarea
              value={adminDecision}
              onChange={(e) => setAdminDecision(e.target.value)}
              placeholder="Ex.: substituição do PP, crédito integral, fechamento proporcional..."
              rows={2}
            />
          </div>
        )}

        {preview && (
          <div className="rounded-lg border border-border divide-y divide-border">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex flex-col sm:flex-row sm:justify-between gap-1 px-4 py-2.5 text-sm"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <span className={row.highlight ? 'font-bold text-primary' : 'font-medium tabular-nums'}>
                  {row.value}
                </span>
              </div>
            ))}
            <div className="px-4 py-2.5 text-sm flex justify-between">
              <span className="text-muted-foreground">Tipo de pausa</span>
              <span>{pauseTypeLabels[pauseType] ?? pauseType}</span>
            </div>
          </div>
        )}

        <Button
          onClick={() => closeMutation.mutate()}
          disabled={closeMutation.isPending || !preview}
          className="w-full sm:w-auto"
        >
          {closeMutation.isPending ? 'Fechando...' : 'Confirmar fechamento financeiro'}
        </Button>

        {closeMutation.isError && (
          <p className="text-sm text-destructive">
            {(closeMutation.error as Error).message}
          </p>
        )}
      </div>
    </div>
  )
}
