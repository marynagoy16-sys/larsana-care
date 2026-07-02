import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Copy, Trophy, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { formatDateTime } from '@/lib/formatters'
import { getCurrentProfessional } from '@/services/professionals'
import {
  ensureReferralCode,
  getPpPointsSettings,
  getProfessionalPointsProfile,
  listPointsLedger,
  patenteLabels,
  PATENTE_REPASSE_PERCENT,
  resolveNextPatenteTarget,
} from '@/services/ppPoints'

export function PPEvolucaoPage() {
  const { data: professional } = useQuery({
    queryKey: ['pp', 'current_professional'],
    queryFn: getCurrentProfessional,
  })

  const { data: settings } = useQuery({
    queryKey: ['pp_points_settings'],
    queryFn: getPpPointsSettings,
  })

  const { data: profile } = useQuery({
    queryKey: ['pp', 'points_profile', professional?.id],
    queryFn: () => getProfessionalPointsProfile(professional!.id),
    enabled: !!professional?.id,
  })

  const { data: referralCode } = useQuery({
    queryKey: ['pp', 'referral_code', professional?.id],
    queryFn: () => ensureReferralCode(professional!.id),
    enabled: !!professional?.id,
  })

  const { data: ledger = [] } = useQuery({
    queryKey: ['pp', 'points_ledger', professional?.id],
    queryFn: () => listPointsLedger(professional!.id),
    enabled: !!professional?.id,
  })

  const patente = profile?.patente ?? 'ALUMINIO'
  const points = profile?.points_total ?? 0
  const nextTarget =
    settings && profile
      ? resolveNextPatenteTarget(points, settings, patente)
      : null

  const copyReferral = async () => {
    if (!referralCode) return
    await navigator.clipboard.writeText(referralCode)
  }

  return (
    <>
      <PageHeader>
        <div className="flex items-center gap-3">
          <Trophy className="size-5 text-primary" />
          <h1 className="font-display font-bold text-xl">Minha evolução</h1>
        </div>
      </PageHeader>

      <CrudScrollPageLayout>
        <CascadeReveal className="space-y-5 pb-8">
          <CascadeItem>
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm text-muted-foreground">Patente atual</p>
                  <p className="text-2xl font-display font-bold">{patenteLabels[patente]}</p>
                </div>
                <Badge variant="secondary">{PATENTE_REPASSE_PERCENT[patente]}% repasse</Badge>
              </div>
              <p className="text-3xl font-bold tabular-nums">{points} <span className="text-base font-normal text-muted-foreground">pontos</span></p>
              {nextTarget && settings?.show_next_tier_hint && (
                <p className="text-sm text-muted-foreground">
                  Faltam {Math.max(0, nextTarget.threshold - points)} pts para {patenteLabels[nextTarget.patente]} (
                  {PATENTE_REPASSE_PERCENT[nextTarget.patente]}% repasse)
                </p>
              )}
            </div>
          </CascadeItem>

          <CascadeItem>
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <h2 className="font-semibold text-sm">Indique um colega</h2>
              </div>
              {patente === 'ALUMINIO' ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Ganhe 50 pontos por indicação (máx. 3) enquanto estiver na patente Alumínio.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Indicações confirmadas: {profile?.referral_count_pre_bronze ?? 0}/3
                  </p>
                  <div className="flex gap-2">
                    <Input readOnly value={referralCode ?? '…'} className="font-mono" />
                    <Button type="button" variant="outline" size="icon" onClick={copyReferral}>
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Indicações com pontuação disponíveis apenas na patente Alumínio. Você já evoluiu de patente.
                </p>
              )}
            </div>
          </CascadeItem>

          <CascadeItem>
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h2 className="font-semibold text-sm">Próximos passos</h2>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>• Complete seu credenciamento para ganhar +300 pts</li>
                <li>• Conclua cursos no Academy para subir de patente</li>
                <li>• Mantenha boa avaliação dos pacientes (NPS)</li>
              </ul>
              <Button asChild variant="outline" size="sm">
                <Link to="/profissional/credenciamento">Continuar cadastro</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="ml-2">
                <Link to="/profissional/academy">Ir ao Academy</Link>
              </Button>
            </div>
          </CascadeItem>

          <CascadeItem>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="font-semibold text-sm">Histórico de pontos</h2>
              </div>
              {ledger.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">Nenhum movimento ainda.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {ledger.map((entry) => (
                    <li key={entry.id} className="px-5 py-3 flex justify-between gap-4 text-sm">
                      <div>
                        <p className="font-medium">{entry.rule_code}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</p>
                      </div>
                      <span className={entry.points_delta >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                        {entry.points_delta >= 0 ? '+' : ''}
                        {entry.points_delta}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CascadeItem>
        </CascadeReveal>
      </CrudScrollPageLayout>
    </>
  )
}
