import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { cycleStatusLabels, sessionStatusLabels } from '@/constants/labels'
import { formatDate, formatDateTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import {
  prontuarioContentPreview,
  type PPPatientProntuario,
  type PPPatientProntuarioSession,
} from '@/services/ppPatients'

const recordTypeLabels: Record<string, string> = {
  avaliacao: 'Avaliação inicial',
  evolucao: 'Evolução',
}

const extraSessionStatusLabels: Record<string, string> = {
  a_agendar: 'A agendar',
}

function sessionStatusLabel(status: string) {
  return extraSessionStatusLabels[status] ?? sessionStatusLabels[status] ?? status
}

function sessionStatusBadgeClass(status: string) {
  if (status === 'realizada') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
  }
  if (status === 'prevista') {
    return 'bg-sky-100 text-sky-900 dark:bg-sky-950/40 dark:text-sky-300'
  }
  if (status === 'falta' || status === 'cancelada_sem_justificativa') {
    return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300'
  }
  if (status === 'remarcada' || status === 'intercorrencia') {
    return 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
  }
  if (status === 'a_agendar') {
    return 'bg-muted text-muted-foreground'
  }
  return 'bg-muted text-muted-foreground'
}

function ProntuarioSessionRow({ session }: { session: PPPatientProntuarioSession }) {
  const evolution = session.evolution

  return (
    <div className="space-y-1.5 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground">Terapia #{session.session_number}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {session.scheduled_at ? formatDateTime(session.scheduled_at) : 'Data a definir'}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
            sessionStatusBadgeClass(session.status),
          )}
        >
          {sessionStatusLabel(session.status)}
        </span>
      </div>
      {evolution ? (
        <>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {prontuarioContentPreview(evolution.content_richtext)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Evolução em {formatDate(evolution.recorded_at ?? evolution.created_at)}
          </p>
        </>
      ) : session.status === 'realizada' ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">Evolução pendente de registro.</p>
      ) : null}
    </div>
  )
}

const collapseTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const }

function ProntuarioCycleSection({
  cycleNumber,
  status,
  sessionCount,
  sessions,
  defaultOpen = false,
}: {
  cycleNumber: number
  status: string | null
  sessionCount: number
  sessions: PPPatientProntuarioSession[]
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const statusLabel = status ? (cycleStatusLabels[status] ?? status) : null
  const completedCount = sessions.filter((session) => session.status === 'realizada').length
  const evolutionCount = sessions.filter((session) => session.evolution).length

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-muted/20 active:bg-muted/30"
      >
        <div>
          <p className="text-sm font-semibold text-foreground">Ciclo {cycleNumber}</p>
          <p className="text-xs text-muted-foreground">
            {sessionCount} terapia{sessionCount === 1 ? '' : 's'}
            {completedCount > 0 ? ` · ${completedCount} concluída${completedCount === 1 ? '' : 's'}` : ''}
            {evolutionCount > 0 ? ` · ${evolutionCount} evolução${evolutionCount === 1 ? '' : 'ões'}` : ''}
            {statusLabel ? ` · ${statusLabel}` : ''}
          </p>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={collapseTransition}
          className="inline-flex shrink-0"
        >
          <ChevronDown className="size-4 text-muted-foreground" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={collapseTransition}
            className="overflow-hidden"
          >
            <div className="border-t border-border divide-y divide-border">
              {sessions.length === 0 ? (
                <p className="px-4 py-3 text-xs text-muted-foreground">Nenhuma terapia neste ciclo.</p>
              ) : (
                sessions.map((session) => <ProntuarioSessionRow key={session.id} session={session} />)
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

interface PPPatientProntuarioSectionProps {
  prontuario: PPPatientProntuario | null | undefined
  isLoading: boolean
}

export function PPPatientProntuarioSection({
  prontuario,
  isLoading,
}: PPPatientProntuarioSectionProps) {
  return (
    <section className={cn('space-y-3', isLoading && 'animate-pulse')}>
      {isLoading ? (
        <p className="text-sm text-muted-foreground px-0.5">Carregando prontuário…</p>
      ) : !prontuario ? (
        <p className="text-sm text-muted-foreground px-0.5">Prontuário indisponível.</p>
      ) : (
        <>
          {prontuario.assessmentRecords.length > 0 ? (
            <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
              {prontuario.assessmentRecords.map((record) => (
                <div key={record.id} className="space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      {recordTypeLabels[record.record_type] ?? record.record_type}
                    </p>
                    <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatDate(record.recorded_at ?? record.created_at)}
                    </p>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {prontuarioContentPreview(record.content_richtext)}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {prontuario.cycles.map((cycle, index) => (
              <ProntuarioCycleSection
                key={cycle.cycleId}
                cycleNumber={cycle.cycleNumber}
                status={cycle.status}
                sessionCount={cycle.sessionCount}
                defaultOpen={index === 0}
                sessions={cycle.sessions}
              />
            ))}
        </>
      )}
    </section>
  )
}
