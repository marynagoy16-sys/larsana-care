import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import { CrudModal } from '@/components/crud/CrudModal'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { DashboardPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import {
  applyGatePreset,
  getAcademySettings,
  getDemandsGateRule,
  getGateRules,
  getPublishedCourses,
  previewGateImpact,
  updateAcademySettings,
} from '@/services/academy'
import { GATE_PRESET_LABELS, type AcademyGatePreset } from '@/types/academy'

const PRESETS: AcademyGatePreset[] = [
  'optional',
  'soft_m1m3',
  'full_m1m5',
  'demands_m5_only',
  'credenciamento_m5',
  'phil_onboarding',
]

export function AcademyConfigPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedPreset, setSelectedPreset] = useState<AcademyGatePreset | null>(null)
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewGateImpact>> | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin', 'academy', 'settings'],
    queryFn: getAcademySettings,
  })

  const { data: rules } = useQuery({
    queryKey: ['admin', 'academy', 'gate-rules'],
    queryFn: getGateRules,
  })

  const { data: demandsRule } = useQuery({
    queryKey: ['admin', 'academy', 'demands-rule'],
    queryFn: getDemandsGateRule,
  })

  const { data: courses } = useQuery({
    queryKey: ['admin', 'academy', 'courses-published'],
    queryFn: getPublishedCourses,
  })

  const course = courses?.[0]

  const { data: modules } = useQuery({
    queryKey: ['admin', 'academy', 'modules-by-code', course?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('academy_modules').select('id, code').eq('course_id', course!.id)
      if (error) throw error
      const map: Record<string, string> = {}
      for (const m of data ?? []) map[m.code] = m.id
      return map
    },
    enabled: Boolean(course?.id),
  })

  const masterMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data: { user } } = await supabase.auth.getUser()
      return updateAcademySettings({ gates_master_enabled: enabled, updated_by: user?.id })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'academy'] }),
  })

  const applyMutation = useMutation({
    mutationFn: async (preset: AcademyGatePreset) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !course || !modules) throw new Error('Dados incompletos')
      await applyGatePreset(preset, course.id, modules, user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'academy'] })
      setConfirmOpen(false)
      setSelectedPreset(null)
      setPreview(null)
    },
  })

  const handlePreview = async (preset: AcademyGatePreset) => {
    setSelectedPreset(preset)
    if (!course || !modules) return

    const moduleIdsMap: Record<AcademyGatePreset, string[]> = {
      optional: [],
      soft_m1m3: [modules.M1, modules.M2, modules.M3].filter(Boolean),
      full_m1m5: [modules.M1, modules.M2, modules.M3, modules.M4, modules.M5].filter(Boolean),
      demands_m5_only: [modules.M5].filter(Boolean),
      credenciamento_m5: [modules.M1, modules.M2, modules.M3, modules.M4, modules.M5].filter(Boolean),
      phil_onboarding: [],
      custom: demandsRule?.required_module_ids ?? [],
    }

    const impact = await previewGateImpact(moduleIdsMap[preset], course.id)
    setPreview(impact)
    setConfirmOpen(true)
  }

  if (isLoading) return <DashboardPageSkeleton />

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/academy')} className="shrink-0 rounded-xl" aria-label="Voltar">
            <ArrowLeft size={20} />
          </Button>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl lg:text-2xl leading-tight tracking-tight">
              Configuração Academy
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Gates operacionais — somente Super Admin</p>
          </div>
        </div>
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="mx-auto max-w-4xl space-y-6">
          <CascadeItem>
            <Card>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <Label htmlFor="master-switch" className="font-medium">
                    Gates Academy ativos
                  </Label>
                  <p className="text-xs text-muted-foreground">Desligar torna a Academy 100% opcional</p>
                </div>
                <Switch
                  id="master-switch"
                  checked={settings?.gates_master_enabled ?? false}
                  onCheckedChange={(v) => masterMutation.mutate(v)}
                  disabled={masterMutation.isPending}
                />
              </CardContent>
            </Card>
          </CascadeItem>

          <CascadeItem>
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Presets</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {PRESETS.map((preset) => (
                  <Card
                    key={preset}
                    className={settings?.active_preset === preset ? 'border-primary' : undefined}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{GATE_PRESET_LABELS[preset]}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        size="sm"
                        variant={settings?.active_preset === preset ? 'default' : 'outline'}
                        className="rounded-full"
                        onClick={() => handlePreview(preset)}
                      >
                        {settings?.active_preset === preset ? 'Ativo — reaplicar' : 'Aplicar preset'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </CascadeItem>

          {rules && (
            <CascadeItem>
              <section className="space-y-2">
                <h2 className="text-lg font-semibold">Regras ativas</h2>
                {rules.map((rule) => (
                  <Card key={rule.id}>
                    <CardContent className="p-4 text-sm">
                      <p className="font-medium">{rule.gate_target}</p>
                      <p className="text-muted-foreground">
                        {rule.is_enabled ? 'Ativo' : 'Inativo'} · {rule.requirement_type}
                      </p>
                      {rule.block_message && <p className="mt-1 italic">{rule.block_message}</p>}
                    </CardContent>
                  </Card>
                ))}
              </section>
            </CascadeItem>
          )}

          <CascadeItem>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="rounded-full" onClick={() => navigate('/admin/academy/config/excecoes')}>
                Exceções por PP
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => navigate('/admin/academy/config/historico')}>
                Histórico de alterações
              </Button>
            </div>
          </CascadeItem>
        </CascadeReveal>
      </CrudScrollPageLayout>

      <CrudModal
        open={confirmOpen && Boolean(selectedPreset && preview)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmOpen(false)
            setSelectedPreset(null)
            setPreview(null)
          }
        }}
        title={
          selectedPreset
            ? `Confirmar preset: ${GATE_PRESET_LABELS[selectedPreset]}`
            : 'Confirmar preset'
        }
        size="md"
      >
        {preview && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 text-sm">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p>PP ativos: {preview.totalActivePp}</p>
                <p>Estimativa bloqueados em demandas: {preview.blockedCount}</p>
                {preview.sampleBlocked.length > 0 && (
                  <ul className="mt-2 list-disc pl-4 text-muted-foreground">
                    {preview.sampleBlocked.map((s) => (
                      <li key={s.professionalId}>{s.name}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" className="rounded-full" onClick={() => setConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="rounded-full"
                disabled={applyMutation.isPending || !selectedPreset}
                onClick={() => selectedPreset && applyMutation.mutate(selectedPreset)}
              >
                {applyMutation.isPending ? 'Aplicando…' : 'Confirmar'}
              </Button>
            </div>
          </div>
        )}
      </CrudModal>
    </>
  )
}
