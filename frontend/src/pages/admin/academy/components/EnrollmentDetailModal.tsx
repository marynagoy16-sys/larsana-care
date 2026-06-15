import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Circle } from 'lucide-react'
import { CrudModal } from '@/components/crud/CrudModal'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { academyAdminKeys, getEnrollmentDetail } from '@/services/academyAdmin'
import { formatDateTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface EnrollmentDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  enrollmentId: string | null
}

export function EnrollmentDetailModal({ open, onOpenChange, enrollmentId }: EnrollmentDetailModalProps) {
  const { data, isLoading } = useQuery({
    queryKey: academyAdminKeys.enrollmentDetail(enrollmentId ?? ''),
    queryFn: () => getEnrollmentDetail(enrollmentId!),
    enabled: open && Boolean(enrollmentId),
  })

  const enrollment = data?.enrollment as {
    status?: string
    enrolled_at?: string
    professionals?: { full_name?: string } | null
    academy_courses?: { title?: string } | null
  } | undefined
  const modules = data?.modules ?? []

  const ppName = String(enrollment?.professionals?.full_name ?? '—')
  const courseTitle = String(enrollment?.academy_courses?.title ?? '—')
  const status = String(enrollment?.status ?? '')
  const enrolledAt = enrollment?.enrolled_at

  const totalLessons = modules.reduce((sum, m) => sum + m.totalCount, 0)
  const completedLessons = modules.reduce((sum, m) => sum + m.completedCount, 0)
  const pct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <CrudModal
      open={open}
      onOpenChange={onOpenChange}
      title="Detalhe da matrícula"
      description={`${ppName} · ${courseTitle}`}
      size="lg"
    >
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={status === 'completed' ? 'default' : 'muted'}>{status}</Badge>
            {enrolledAt && (
              <span className="text-xs text-muted-foreground">
                Matriculado em {formatDateTime(enrolledAt)}
              </span>
            )}
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progresso geral</span>
              <span className="text-muted-foreground">{completedLessons}/{totalLessons} aulas ({pct}%)</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {modules.map((mod) => (
            <div key={mod.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{mod.code} — {mod.title}</p>
                <span className="text-xs text-muted-foreground">{mod.completedCount}/{mod.totalCount}</span>
              </div>
              <ul className="space-y-1">
                {mod.lessons.map((lesson) => (
                  <li key={lesson.id} className="flex items-center gap-2 text-sm">
                    {lesson.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={cn(lesson.completed && 'text-muted-foreground')}>{lesson.title}</span>
                    <Badge variant="muted" className="ml-auto text-[10px]">{lesson.content_type}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </CrudModal>
  )
}
