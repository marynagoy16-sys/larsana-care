import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  getPpPointsSettings,
  listPpPatenteTiers,
  listPpPointsRules,
  updatePpPatenteTierPercent,
  updatePpPointsRule,
  updatePpPointsSettings,
  type PpPatente,
} from '@/services/ppPoints'

export function PpPointsConfigPage() {
  const queryClient = useQueryClient()

  const { data: settings } = useQuery({
    queryKey: ['pp_points_settings'],
    queryFn: getPpPointsSettings,
  })

  const { data: rules = [] } = useQuery({
    queryKey: ['pp_points_rules'],
    queryFn: listPpPointsRules,
  })

  const { data: tiers = [] } = useQuery({
    queryKey: ['pp_patente_tiers'],
    queryFn: listPpPatenteTiers,
  })

  const saveTier = useMutation({
    mutationFn: ({ patente, base_pp_percent }: { patente: PpPatente; base_pp_percent: number }) =>
      updatePpPatenteTierPercent(patente, base_pp_percent),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pp_patente_tiers'] }),
  })

  const saveSettings = useMutation({
    mutationFn: updatePpPointsSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pp_points_settings'] }),
  })

  const saveRule = useMutation({
    mutationFn: ({ id, points_delta }: { id: string; points_delta: number }) =>
      updatePpPointsRule(id, { points_delta }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pp_points_rules'] }),
  })

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-3">
          <Trophy className="size-5 text-primary" />
          <h1 className="font-display font-bold text-xl">Pontuação PP</h1>
        </div>
      </PageHeader>

      <CrudScrollPageLayout>
        <div className="space-y-6 pb-8 max-w-2xl">
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold text-sm">Repasse por patente</h2>
            <p className="text-xs text-muted-foreground">
              Percentual base repassado ao PP (ciclos após o 1º mês). Alumínio inicia em 60%.
            </p>
            <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {tiers.map((tier) => (
                <div key={tier.patente} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{tier.label}</p>
                    <p className="text-xs text-muted-foreground">{tier.patente}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-20"
                      defaultValue={tier.base_pp_percent}
                      onBlur={(e) =>
                        saveTier.mutate({
                          patente: tier.patente,
                          base_pp_percent: Number(e.target.value) || tier.base_pp_percent,
                        })
                      }
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="font-semibold text-sm">Patentes (thresholds de pontos)</h2>
            {settings && (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  {(['bronze_threshold', 'prata_threshold', 'ouro_threshold'] as const).map((key) => (
                    <div key={key} className="space-y-1">
                      <Label>{key.replace('_threshold', '').toUpperCase()}</Label>
                      <Input
                        type="number"
                        defaultValue={settings[key]}
                        onBlur={(e) =>
                          saveSettings.mutate({ [key]: Number(e.target.value) || settings[key] })
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={settings.show_next_tier_hint}
                    onCheckedChange={(checked) => saveSettings.mutate({ show_next_tier_hint: checked })}
                  />
                  <Label>Revelar meta da próxima patente no app PP</Label>
                </div>
              </>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Pontos por ação</h2>
            </div>
            <div className="divide-y divide-border">
              {rules.map((rule) => (
                <div key={rule.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                  <div>
                    <p className="font-medium text-sm">{rule.label}</p>
                    <p className="text-xs text-muted-foreground">{rule.rule_code}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-24"
                      defaultValue={rule.points_delta}
                      onBlur={(e) =>
                        saveRule.mutate({ id: rule.id, points_delta: Number(e.target.value) || rule.points_delta })
                      }
                    />
                    <span className="text-sm text-muted-foreground">pts</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </CrudScrollPageLayout>
    </>
  )
}
