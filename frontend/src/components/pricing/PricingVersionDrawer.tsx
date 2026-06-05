import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Lock, Receipt, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FormActions } from '@/components/crud/FormActions'
import { patientLevelLabels, ppClassLabels } from '@/constants/labels'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { mapSupabaseError } from '@/lib/supabase-errors'
import { cn } from '@/lib/utils'
import { listRegions } from '@/services/regions'
import {
  PP_CLASSES,
  PRICING_PATIENT_LEVELS,
  activatePricingVersion,
  centsToReaisInput,
  getPricingBundle,
  pricingQueryKeys,
  reaisInputToCents,
  saveCommissionRules,
  saveRetentionRule,
  upsertPricingEntries,
  type CommissionRule,
  type PricingEntry,
} from '@/services/pricing'
import { PRICING_DRAWER_SHEET_CLASS, PRICING_DRAWER_TABS } from '@/components/pricing/pricingDrawerShared'
import type { Database } from '@/types/database'

type PatientLevel = Database['public']['Enums']['patient_level']
type Region = Database['public']['Tables']['regions']['Row']

type PriceGrid = Record<string, Record<PatientLevel, string>>

interface PricingVersionDrawerProps {
  versionId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function buildPriceGrid(regions: Region[], entries: PricingEntry[]): PriceGrid {
  const grid: PriceGrid = {}
  for (const region of regions) {
    grid[region.id] = {} as Record<PatientLevel, string>
    for (const level of PRICING_PATIENT_LEVELS) {
      const entry = entries.find((item) => item.region_id === region.id && item.patient_level === level)
      grid[region.id][level] = entry ? centsToReaisInput(entry.session_price_cents) : ''
    }
  }
  return grid
}

function buildCommissionState(rules: CommissionRule[]) {
  return PP_CLASSES.map((ppClass) => {
    const rule = rules.find((item) => item.pp_class === ppClass)
    return {
      id: rule?.id,
      pp_class: ppClass,
      pp_percent: rule ? String(rule.pp_percent) : '',
    }
  })
}

function DrawerSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border bg-primary/[0.04] px-5 py-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-4 w-64" />
      </div>
      <div className="space-y-4 p-5">
        <Skeleton className="h-10 w-full max-w-md rounded-full" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function PricingVersionDrawer({ versionId, open, onOpenChange }: PricingVersionDrawerProps) {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<string>('prices')
  const [priceGrid, setPriceGrid] = useState<PriceGrid>({})
  const [commissionInputs, setCommissionInputs] = useState<Array<{ id?: string; pp_class: typeof PP_CLASSES[number]; pp_percent: string }>>([])
  const [retentionPercent, setRetentionPercent] = useState('40')
  const [savingTab, setSavingTab] = useState<'prices' | 'commissions' | 'retention' | null>(null)

  const { data: regions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: listRegions,
    enabled: open,
  })

  const { data: bundle, isLoading } = useQuery({
    queryKey: pricingQueryKeys.bundle(versionId ?? ''),
    queryFn: () => getPricingBundle(versionId!),
    enabled: open && !!versionId,
  })

  useEffect(() => {
    if (!open) {
      setActiveTab('prices')
      return
    }
    if (!bundle || regions.length === 0) return
    setPriceGrid(buildPriceGrid(regions, bundle.entries))
    setCommissionInputs(buildCommissionState(bundle.commissions))
    setRetentionPercent(bundle.retention ? String(bundle.retention.larsana_percent) : '40')
  }, [bundle, regions, open])

  const isReadOnly = bundle?.version.is_active ?? false

  const invalidate = async () => {
    if (!versionId) return
    await queryClient.invalidateQueries({ queryKey: pricingQueryKeys.bundle(versionId) })
    await queryClient.invalidateQueries({ queryKey: pricingQueryKeys.versions })
  }

  const handleSavePrices = async () => {
    if (!versionId || isReadOnly) return
    setSavingTab('prices')
    try {
      const payload = regions.flatMap((region) =>
        PRICING_PATIENT_LEVELS.flatMap((level) => {
          const raw = priceGrid[region.id]?.[level] ?? ''
          const cents = reaisInputToCents(raw)
          if (cents == null) return []
          if (level !== 'VALOR_SOCIAL' && cents <= 0) {
            throw new Error(`Informe um valor válido para ${region.code} / ${patientLevelLabels[level]}`)
          }
          return [{
            version_id: versionId,
            region_id: region.id,
            patient_level: level,
            session_price_cents: cents,
          }]
        }),
      )

      if (payload.length === 0) {
        toast.error('Preencha ao menos um preço')
        return
      }

      await upsertPricingEntries(payload)
      toast.success('Preços salvos')
      await invalidate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : mapSupabaseError(error as Error))
    } finally {
      setSavingTab(null)
    }
  }

  const handleSaveCommissions = async () => {
    if (!versionId || isReadOnly) return
    setSavingTab('commissions')
    try {
      const rules = commissionInputs.map((rule) => {
        const ppPercent = Number(rule.pp_percent.replace(',', '.'))
        if (!Number.isFinite(ppPercent) || ppPercent <= 0 || ppPercent >= 100) {
          throw new Error(`Percentual inválido para ${ppClassLabels[rule.pp_class]}`)
        }
        return { id: rule.id, pp_class: rule.pp_class, pp_percent: ppPercent }
      })

      await saveCommissionRules(versionId, rules)
      toast.success('Repasses salvos')
      await invalidate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : mapSupabaseError(error as Error))
    } finally {
      setSavingTab(null)
    }
  }

  const handleSaveRetention = async () => {
    if (!versionId || isReadOnly) return
    setSavingTab('retention')
    try {
      const larsanaPercent = Number(retentionPercent.replace(',', '.'))
      if (!Number.isFinite(larsanaPercent) || larsanaPercent <= 0 || larsanaPercent >= 100) {
        throw new Error('Informe uma retenção entre 1% e 99%')
      }

      await saveRetentionRule(versionId, larsanaPercent, bundle?.retention?.id)
      toast.success('Taxa do 1º mês salva')
      await invalidate()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : mapSupabaseError(error as Error))
    } finally {
      setSavingTab(null)
    }
  }

  const handleActivate = async () => {
    if (!versionId || !bundle) return
    if (!window.confirm(`Ativar a versão ${bundle.version.version_code}?`)) return
    try {
      await activatePricingVersion(versionId)
      toast.success('Versão ativada')
      await invalidate()
    } catch (error) {
      toast.error(mapSupabaseError(error as Error))
    }
  }

  const previewTotal = useMemo(() => {
    if (!regions.length) return null
    const region = regions[0]
    const n2 = reaisInputToCents(priceGrid[region.id]?.N2 ?? '')
    return n2 != null ? formatCurrency(n2 * 4) : null
  }, [priceGrid, regions])

  const footer = !isReadOnly && bundle ? (
    <div className="shrink-0 border-t border-border bg-card/95 px-5 py-4 backdrop-blur-sm">
      {activeTab === 'prices' ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSavePrices()
          }}
        >
          <FormActions
            onCancel={() => setPriceGrid(buildPriceGrid(regions, bundle.entries))}
            isSubmitting={savingTab === 'prices'}
            cancelLabel="Desfazer"
            submitLabel="Salvar preços"
          />
        </form>
      ) : null}
      {activeTab === 'commissions' ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSaveCommissions()
          }}
        >
          <FormActions
            onCancel={() => setCommissionInputs(buildCommissionState(bundle.commissions))}
            isSubmitting={savingTab === 'commissions'}
            cancelLabel="Desfazer"
            submitLabel="Salvar repasses"
          />
        </form>
      ) : null}
      {activeTab === 'retention' ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleSaveRetention()
          }}
        >
          <FormActions
            onCancel={() => setRetentionPercent(bundle.retention ? String(bundle.retention.larsana_percent) : '40')}
            isSubmitting={savingTab === 'retention'}
            cancelLabel="Desfazer"
            submitLabel="Salvar taxa"
          />
        </form>
      ) : null}
    </div>
  ) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={PRICING_DRAWER_SHEET_CLASS}>
        {isLoading || !bundle || !versionId ? (
          <DrawerSkeleton />
        ) : (
          <div className="flex h-full min-h-0 flex-col">
            <div className="shrink-0 border-b border-border bg-gradient-to-br from-primary/[0.07] via-primary/[0.03] to-transparent">
              <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
                <div className="flex min-w-0 items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="mt-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Fechar"
                  >
                    <X size={18} />
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                        <Receipt size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate font-display text-xl font-bold text-foreground">
                            {bundle.version.version_code}
                          </h2>
                          {bundle.version.is_active ? (
                            <Badge className="border-emerald-300/60 bg-emerald-100 text-emerald-800">Ativa</Badge>
                          ) : (
                            <Badge variant="outline" className="border-dashed bg-background/80">
                              Rascunho
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays size={12} />
                            Vigência a partir de {formatDate(bundle.version.effective_from)}
                          </span>
                          {bundle.version.notes ? (
                            <span className="truncate">{bundle.version.notes}</span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                {!bundle.version.is_active ? (
                  <Button size="sm" className="shrink-0 shadow-sm" onClick={() => void handleActivate()}>
                    <Sparkles className="mr-1.5 size-3.5" />
                    Ativar versão
                  </Button>
                ) : null}
              </div>

              {isReadOnly ? (
                <div className="mx-5 mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3.5 py-2.5 text-xs text-amber-950">
                  <Lock className="mt-0.5 size-3.5 shrink-0" />
                  <p>
                    <span className="font-semibold">Versão em vigor — somente leitura.</span>{' '}
                    Crie uma nova versão clonando esta tabela para alterar valores.
                  </p>
                </div>
              ) : null}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 border-b border-border px-5 py-3">
                <TabsList className="h-auto w-full justify-start gap-1 bg-muted/70 p-1">
                  {PRICING_DRAWER_TABS.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="rounded-full px-3 py-1.5 text-xs sm:text-sm"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <TabsContent value="prices" className="mt-0 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Valores por sessão conforme região e nível do paciente.
                    {previewTotal ? (
                      <span className="text-foreground/80">
                        {' '}
                        Ex.: ciclo de 4 sessões (N2, {regions[0]?.code}) ≈ {previewTotal}.
                      </span>
                    ) : null}
                  </p>
                  <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="w-[120px]">Região</TableHead>
                          {PRICING_PATIENT_LEVELS.map((level) => (
                            <TableHead key={level} className="min-w-[108px]">
                              {patientLevelLabels[level]}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {regions.map((region) => (
                          <TableRow key={region.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                                  {region.code}
                                </span>
                                <span className="hidden text-xs text-muted-foreground sm:inline">{region.name}</span>
                              </div>
                            </TableCell>
                            {PRICING_PATIENT_LEVELS.map((level) => (
                              <TableCell key={level}>
                                <div className="relative max-w-[112px]">
                                  <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground">
                                    R$
                                  </span>
                                  <Input
                                    className={cn(
                                      'h-9 rounded-xl border-muted bg-muted/30 pl-8 text-sm',
                                      isReadOnly && 'opacity-80',
                                    )}
                                    inputMode="decimal"
                                    placeholder="0,00"
                                    disabled={isReadOnly}
                                    value={priceGrid[region.id]?.[level] ?? ''}
                                    onChange={(event) => {
                                      const value = event.target.value
                                      setPriceGrid((current) => ({
                                        ...current,
                                        [region.id]: {
                                          ...current[region.id],
                                          [level]: value,
                                        },
                                      }))
                                    }}
                                  />
                                </div>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="commissions" className="mt-0 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Percentual repassado ao profissional parceiro por classe (Bronze, Prata, Ouro).
                  </p>
                  <div className="divide-y overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                    {commissionInputs.map((rule, index) => {
                      const ppPercent = Number(rule.pp_percent.replace(',', '.'))
                      const larsanaPercent = Number.isFinite(ppPercent) ? 100 - ppPercent : null
                      return (
                        <div
                          key={rule.pp_class}
                          className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-semibold">{ppClassLabels[rule.pp_class]}</p>
                            <p className="text-xs text-muted-foreground">
                              Larsana retém {larsanaPercent != null ? `${larsanaPercent.toFixed(0)}%` : '—'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              className="h-9 w-24 rounded-xl border-muted bg-muted/30"
                              inputMode="decimal"
                              disabled={isReadOnly}
                              value={rule.pp_percent}
                              onChange={(event) => {
                                const value = event.target.value
                                setCommissionInputs((current) =>
                                  current.map((item, itemIndex) =>
                                    itemIndex === index ? { ...item, pp_percent: value } : item,
                                  ),
                                )
                              }}
                            />
                            <span className="text-sm text-muted-foreground">% PP</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="retention" className="mt-0 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Retenção da Larsana no primeiro mês de cada novo paciente captado pela plataforma.
                  </p>
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">Retenção Larsana (1º mês)</p>
                        <p className="text-xs text-muted-foreground">
                          PP recebe{' '}
                          {Number.isFinite(Number(retentionPercent))
                            ? `${(100 - Number(retentionPercent)).toFixed(0)}%`
                            : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          className="h-9 w-24 rounded-xl border-muted bg-muted/30"
                          inputMode="decimal"
                          disabled={isReadOnly}
                          value={retentionPercent}
                          onChange={(event) => setRetentionPercent(event.target.value)}
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
