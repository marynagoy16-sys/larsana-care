import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  RefreshCw,
  User,
  Wallet,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CascadeItem } from '@/components/motion/CascadeReveal'
import { Skeleton } from '@/components/ui/skeleton'
import { demandsService, type DemandDetail } from '@/services/demands'
import { getActivePricingVersion, getPricingBundle } from '@/services/pricing'
import {
  ASSESSMENT_APPROVED_PAYOUT_CENTS,
  ASSESSMENT_DECLINED_PAYOUT_CENTS,
  buildAvaliacaoSimulation,
  buildContinuidadeSimulation,
  findSessionPriceCents,
} from '@/lib/demandSimulation'
import { formatDemandLevelRegion, formatDemandLocation } from '@/lib/demandDisplay'
import { formatAttendancePeriod, resolveDiagnosticHypothesis } from '@/lib/patientDisplay'
import { formatCurrency } from '@/lib/formatters'
import { demandStatusLabels, demandTypeLabels } from '@/constants/labels'
import { cn } from '@/lib/utils'

export function resolveRegionCode(demand: DemandDetail) {
  return demand.regions?.code ?? demand.patients?.regions?.code ?? null
}

export function resolveRegionLabel(demand: DemandDetail) {
  const region = demand.regions ?? demand.patients?.regions
  return region ? `${region.code} — ${region.name}` : '—'
}

export function useDemandPricingContext(
  demand: DemandDetail | undefined,
  ppClass: string | null | undefined,
) {
  const regionId = demand?.region_id ?? demand?.patients?.region_id ?? null
  const patientLevel = demand?.patients?.patient_level ?? null

  return useQuery({
    queryKey: ['demand_pricing_context', demand?.id, regionId, patientLevel, ppClass, demand?.demand_type],
    queryFn: async () => {
      const version = await getActivePricingVersion()
      if (!version) return null
      const bundle = await getPricingBundle(version.id)
      const sessionPriceCents = findSessionPriceCents(bundle.entries, regionId, patientLevel)
      const avaliacao = buildAvaliacaoSimulation({
        sessionPriceCents,
        commissions: bundle.commissions,
        retention: bundle.retention,
        ppClass,
      })
      const continuidade = buildContinuidadeSimulation({
        sessionPriceCents,
        commissions: bundle.commissions,
        retention: bundle.retention,
        weeklyFrequency: demand?.patients?.suggested_weekly_frequency,
        ppClass,
      })
      return { version, sessionPriceCents, avaliacao, continuidade }
    },
    enabled: !!demand,
  })
}

export function DemandBriefCard({
  demand,
  attendancePeriod,
  levelRegion,
  location,
  diagnosticHypothesis,
  repassePerSession,
  loading,
}: {
  demand: DemandDetail
  attendancePeriod: string
  levelRegion: string
  location: string
  diagnosticHypothesis: string
  repassePerSession: number | null
  loading?: boolean
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-muted/20">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {demandTypeLabels[demand.demand_type] ?? demand.demand_type}
        </p>
      </div>
      <div className="px-5 py-4 space-y-3 text-sm">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <>
            <BriefRow label="Melhor período para o atendimento" value={attendancePeriod} />
            <BriefRow label="Nível e região" value={levelRegion} />
            <BriefRow label="Localização" value={location} />
            <BriefRow label="Hipótese diagnóstica" value={diagnosticHypothesis} />
            <BriefRow
              label="Valor de repasse"
              value={
                repassePerSession != null
                  ? `${formatCurrency(repassePerSession)} por atendimento`
                  : '—'
              }
              highlight
            />
          </>
        )}
      </div>
    </div>
  )
}

function BriefRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn('font-medium', highlight && 'text-base font-semibold text-primary')}>{value}</p>
    </div>
  )
}

export function DemandDetailPageHeader({
  demand,
  onBack,
  loading,
  isFetching,
  showPatientName = true,
}: {
  demand?: DemandDetail
  onBack: () => void
  loading?: boolean
  isFetching?: boolean
  showPatientName?: boolean
}) {
  const statusColor =
    demand?.status === 'alocada'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
      : demand?.status === 'cancelada'
        ? 'bg-muted text-muted-foreground'
        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500'

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap min-w-0 flex-1">
      <div className="flex items-center gap-3 min-w-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 rounded-xl" aria-label="Voltar">
          <ArrowLeft size={20} />
        </Button>
        {loading ? (
          <div className="space-y-1.5 min-w-0">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : (
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-bold text-xl lg:text-2xl leading-tight tracking-tight">
                Demanda
              </h1>
              {demand && (
                <>
                  <Badge variant="secondary">{demandTypeLabels[demand.demand_type] ?? demand.demand_type}</Badge>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0', statusColor)}>
                    {demandStatusLabels[demand.status] ?? demand.status}
                  </span>
                </>
              )}
            </div>
            {showPatientName && demand?.patients && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{demand.patients.full_name}</p>
            )}
          </div>
        )}
      </div>
      {isFetching && !loading && (
        <RefreshCw size={16} className="animate-spin text-muted-foreground shrink-0" />
      )}
    </div>
  )
}

export function AvaliacaoSections({
  simulation,
  loading,
}: {
  simulation: ReturnType<typeof buildAvaliacaoSimulation>
  loading?: boolean
}) {
  return (
    <>
      <CascadeItem>
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Wallet size={16} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">Regras de repasse</h3>
          </div>
          <div className="px-5 py-4">
            {loading ? (
              <Skeleton className="h-12 w-full" />
            ) : simulation ? (
              <ul className="space-y-1.5 text-sm list-disc pl-5">
                <li>
                  <strong>1º ciclo:</strong> {simulation.rules.cycle1Percent}% por atendimento (
                  {formatCurrency(simulation.rules.cycle1RepassePerSessionCents)})
                </li>
                <li>
                  <strong>2º ciclo em diante:</strong> {simulation.rules.cycle2Percent}% por atendimento (
                  {formatCurrency(simulation.rules.cycle2RepassePerSessionCents)})
                </li>
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Não foi possível calcular: verifique região e nível do paciente na tabela vigente.
              </p>
            )}
          </div>
        </div>
      </CascadeItem>

      <CascadeItem>
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Calculator size={16} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">Simulações de ganhos</h3>
          </div>
          <div className="p-5 space-y-5">
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : simulation ? (
              simulation.rows.map((row) => (
                <div key={row.weeklyFrequency} className="space-y-2">
                  <p className="text-sm font-semibold">{row.label}</p>
                  <div className="pl-3 space-y-1 text-sm text-muted-foreground">
                    <p>
                      <span className="text-foreground font-medium">1º ciclo:</span>{' '}
                      ({formatCurrency(row.cycle1RepassePerSessionCents)} × {row.sessionsPerCycle}) ={' '}
                      <strong className="text-foreground tabular-nums">
                        {formatCurrency(row.cycle1TotalCents)}
                      </strong>
                    </p>
                    <p>
                      <span className="text-foreground font-medium">2º ciclo:</span>{' '}
                      ({formatCurrency(row.cycle2RepassePerSessionCents)} × {row.sessionsPerCycle}) ={' '}
                      <strong className="text-foreground tabular-nums">
                        {formatCurrency(row.cycle2TotalCents)}
                      </strong>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Não foi possível calcular: verifique região e nível do paciente na tabela vigente.
              </p>
            )}
          </div>
        </div>
      </CascadeItem>

      <CascadeItem>
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm">Remuneração da avaliação</h3>
          </div>
          <div className="p-5 space-y-3 text-sm">
            <div className="flex gap-3 items-start">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <p>
                <strong>Avaliação aprovada:</strong> {formatCurrency(ASSESSMENT_APPROVED_PAYOUT_CENTS)} no PIX em
                7 dias e assume os atendimentos do(a) paciente (valor de adiantamento do primeiro ciclo).
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <XCircle size={18} className="text-muted-foreground shrink-0 mt-0.5" />
              <p>
                <strong>Avaliação recusada:</strong> {formatCurrency(ASSESSMENT_DECLINED_PAYOUT_CENTS)} em 30 dias.
              </p>
            </div>
          </div>
        </div>
      </CascadeItem>
    </>
  )
}

export function ContinuidadeSections({
  simulation,
  loading,
}: {
  simulation: ReturnType<typeof buildContinuidadeSimulation>
  loading?: boolean
}) {
  return (
    <>
      <CascadeItem>
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/20">
            <h3 className="font-semibold text-sm">Continuidade de atendimento — substituição de profissional</h3>
          </div>
          <div className="p-5 space-y-3 text-sm text-muted-foreground">
            <p>
              Este paciente já se encontra em tratamento ativo, não sendo necessária a realização de avaliação
              inicial.
            </p>
            <p>
              Demanda destinada exclusivamente para substituição de profissional parceiro, garantindo a
              continuidade do plano terapêutico já estabelecido.
            </p>
          </div>
        </div>
      </CascadeItem>

      <CascadeItem>
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm">Condições do atendimento</h3>
          </div>
          <ul className="px-5 py-4 space-y-1.5 text-sm list-disc pl-9 text-muted-foreground">
            <li>Manutenção da frequência atual definida com o paciente</li>
            <li>Seguimento do plano terapêutico vigente</li>
            <li>Possibilidade de ajustes técnicos conforme evolução clínica (quando necessário)</li>
          </ul>
        </div>
      </CascadeItem>

      <CascadeItem>
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Wallet size={16} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">Repasse por atendimento</h3>
          </div>
          <div className="px-5 py-4 text-sm space-y-1.5">
            {loading ? (
              <Skeleton className="h-10 w-full" />
            ) : simulation ? (
              <>
                <p>
                  Considerar <strong>{simulation.rules.cycle2Percent}%</strong> do valor base (padrão do 2º ciclo):{' '}
                  <strong className="tabular-nums">
                    {formatCurrency(simulation.rules.cycle2RepassePerSessionCents)} por atendimento
                  </strong>
                </p>
                <p className="text-muted-foreground">Sem desconto de avaliação.</p>
              </>
            ) : (
              <p className="text-muted-foreground">
                Não foi possível calcular: verifique região e nível do paciente na tabela vigente.
              </p>
            )}
          </div>
        </div>
      </CascadeItem>

      <CascadeItem>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/40 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-amber-200/60 dark:border-amber-900/40">
            <AlertTriangle size={16} className="text-amber-700 dark:text-amber-500" />
            <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-200">Atenção</h3>
          </div>
          <ul className="px-5 py-4 space-y-2 text-sm text-amber-900/90 dark:text-amber-100/90 list-disc pl-9">
            <li>Atente-se à localização do paciente.</li>
            <li>
              Ao aceitar o paciente, verifique disponibilidade de horário na sua agenda para evitar remanejo
              desnecessário.
            </li>
          </ul>
        </div>
      </CascadeItem>

      <CascadeItem>
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Calculator size={16} className="text-muted-foreground" />
            <h3 className="font-semibold text-sm">Simulações de ganhos</h3>
          </div>
          <div className="p-5">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : simulation ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold">{simulation.row.label}</p>
                <p className="text-sm text-muted-foreground pl-3">
                  <span className="text-foreground font-medium">Ciclo {simulation.row.sessionsPerCycle}:</span>{' '}
                  ({formatCurrency(simulation.row.cycle2RepassePerSessionCents)} × {simulation.row.sessionsPerCycle}) ={' '}
                  <strong className="text-foreground tabular-nums">
                    {formatCurrency(simulation.row.cycle2TotalCents)}
                  </strong>
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Não foi possível calcular: verifique região e nível do paciente na tabela vigente.
              </p>
            )}
          </div>
        </div>
      </CascadeItem>
    </>
  )
}

export function DemandDetailInfoCard({
  title,
  icon: Icon,
  rows,
}: {
  title: string
  icon: typeof User
  rows: Array<{ label: string; value: string }>
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <Icon size={16} className="text-muted-foreground" />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="px-5 py-4 space-y-2 text-sm">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col sm:flex-row sm:gap-4 py-1 border-b border-border/50 last:border-0"
          >
            <span className="text-muted-foreground sm:w-44 shrink-0">{row.label}</span>
            <span className="font-medium">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function buildDemandBriefProps(demand: DemandDetail, repassePerSession: number | null) {
  const patient = demand.patients
  return {
    attendancePeriod: formatAttendancePeriod(patient?.attendance_period),
    levelRegion: formatDemandLevelRegion(patient?.patient_level, resolveRegionCode(demand)),
    location: formatDemandLocation(demand, demand.demand_type),
    diagnosticHypothesis: resolveDiagnosticHypothesis(
      patient?.diagnostic_hypothesis,
      patient?.clinical_summary,
    ),
    repassePerSession,
  }
}

export { demandsService }
