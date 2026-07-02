import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  getPpPointsSettings,
  listPpPointsRules,
  updatePpPointsRule,
  updatePpPointsSettings,
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
            <h2 className="font-semibold text-sm">Patentes (thresholds)</h2>
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
