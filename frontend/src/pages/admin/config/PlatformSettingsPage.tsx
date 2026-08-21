import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { formatCurrency } from '@/lib/formatters'
import { getPlatformSettings, updatePlatformSettings } from '@/services/platformSettings'

export function PlatformSettingsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'platform-settings'],
    queryFn: getPlatformSettings,
  })

  const mutation = useMutation({
    mutationFn: updatePlatformSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'platform-settings'] })
      toast.success('Configurações salvas')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  if (isLoading || !data) {
    return (
      <CrudScrollPageLayout>
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </CrudScrollPageLayout>
    )
  }

  return (
      <>
      <PageHeader>
        <h1 className="font-display font-bold text-xl">Configurações da plataforma</h1>
      </PageHeader>
      <CrudScrollPageLayout>
        <form
          className="max-w-lg space-y-6"
          onSubmit={(e) => {
            e.preventDefault()
            const form = new FormData(e.currentTarget)
            mutation.mutate({
              assessment_fee_cents: Math.round(Number(form.get('assessment_fee_cents')) * 100),
              assessment_pp_share_cents: Math.round(Number(form.get('assessment_pp_share_cents')) * 100),
              early_cycle_discount_pct: Number(form.get('early_cycle_discount_pct')),
              late_interest_pct_month: Number(form.get('late_interest_pct_month')),
              late_fine_pct: Number(form.get('late_fine_pct')),
              max_weekly_sessions_pp: Number(form.get('max_weekly_sessions_pp')),
            })
          }}
        >
          <section className="space-y-3 rounded-xl border p-4">
            <h2 className="font-semibold text-sm">Avaliação domiciliar</h2>
            <div className="space-y-2">
              <Label htmlFor="assessment_fee_cents">Taxa de avaliação (R$)</Label>
              <Input
                id="assessment_fee_cents"
                name="assessment_fee_cents"
                type="number"
                step="0.01"
                min="0"
                defaultValue={(data.assessment_fee_cents / 100).toFixed(2)}
              />
              <p className="text-xs text-muted-foreground">
                Cobrada na solicitação. Atual: {formatCurrency(data.assessment_fee_cents)}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assessment_pp_share_cents">Repasse PP se não continuar (R$)</Label>
              <Input
                id="assessment_pp_share_cents"
                name="assessment_pp_share_cents"
                type="number"
                step="0.01"
                min="0"
                defaultValue={(data.assessment_pp_share_cents / 100).toFixed(2)}
              />
            </div>
          </section>

          <section className="space-y-3 rounded-xl border p-4">
            <h2 className="font-semibold text-sm">Pagamento do ciclo</h2>
            <div className="space-y-2">
              <Label htmlFor="early_cycle_discount_pct">Desconto pagamento antecipado (%)</Label>
              <Input
                id="early_cycle_discount_pct"
                name="early_cycle_discount_pct"
                type="number"
                step="0.1"
                min="0"
                max="100"
                defaultValue={data.early_cycle_discount_pct}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="late_interest_pct_month">Juros pós-ciclo (% ao mês)</Label>
              <Input
                id="late_interest_pct_month"
                name="late_interest_pct_month"
                type="number"
                step="0.1"
                min="0"
                defaultValue={data.late_interest_pct_month}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="late_fine_pct">Multa por atraso (%)</Label>
              <Input
                id="late_fine_pct"
                name="late_fine_pct"
                type="number"
                step="0.1"
                min="0"
                defaultValue={data.late_fine_pct}
              />
            </div>
          </section>

          <section className="space-y-3 rounded-xl border p-4">
            <h2 className="font-semibold text-sm">Profissional parceiro</h2>
            <div className="space-y-2">
              <Label htmlFor="max_weekly_sessions_pp">Máx. atendimentos/semana (CREFITO)</Label>
              <Input
                id="max_weekly_sessions_pp"
                name="max_weekly_sessions_pp"
                type="number"
                min="1"
                defaultValue={data.max_weekly_sessions_pp}
              />
            </div>
          </section>

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Salvando…' : 'Salvar configurações'}
          </Button>
        </form>
      </CrudScrollPageLayout>
    </>
  )
}
