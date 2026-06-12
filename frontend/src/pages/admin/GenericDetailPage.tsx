import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/formatters'
import { cn } from '@/lib/utils'

interface GenericDetailPageProps {
  title: string
  backPath: string
  queryKey: readonly unknown[]
  queryFn: (id: string) => Promise<Record<string, unknown> | object>
  fields: { key: string; label: string; format?: 'date' | 'datetime' | 'currency'; enumLabels?: Record<string, string> }[]
}

export function GenericDetailPage({ title, backPath, queryKey, queryFn, fields }: GenericDetailPageProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...queryKey, id],
    queryFn: () => queryFn(id!),
    enabled: !!id,
    placeholderData: (previous) => previous,
  })

  if (isLoading) {
    return (
      <CrudScrollPageLayout>
        <DetailPageSkeleton fields={fields.length} />
      </CrudScrollPageLayout>
    )
  }

  if (!data) {
    return (
      <CrudScrollPageLayout>
        <p className="text-muted-foreground">Registro não encontrado.</p>
      </CrudScrollPageLayout>
    )
  }

  const record = data as Record<string, unknown>
  const formatValue = (key: string, format?: string, enumLabels?: Record<string, string>) => {
    const val = record[key]
    if (val == null) return '—'
    if (enumLabels) return enumLabels[String(val)] ?? String(val)
    if (format === 'date') return formatDate(String(val))
    if (format === 'datetime') return formatDateTime(String(val))
    if (format === 'currency') return formatCurrency(Number(val))
    return String(val)
  }

  return (
    <CrudScrollPageLayout>
      <CascadeReveal className="space-y-6">
        <CascadeItem>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(backPath)}>
              <ArrowLeft size={20} />
            </Button>
            <h2 className="font-display text-2xl font-bold">{title}</h2>
          </div>
        </CascadeItem>
        <CascadeItem>
          <div
            className={cn(
              'rounded-xl border border-border bg-card p-5 space-y-3 text-sm transition-opacity duration-300',
              isFetching && !isLoading && 'opacity-50',
            )}
          >
            {fields.map((f) => (
              <div key={f.key} className="flex flex-col sm:flex-row sm:gap-4 py-1 border-b border-border/50 last:border-0">
                <span className="text-muted-foreground sm:w-40 shrink-0">{f.label}</span>
                <span className="font-medium">{formatValue(f.key, f.format, f.enumLabels)}</span>
              </div>
            ))}
          </div>
        </CascadeItem>
      </CascadeReveal>
    </CrudScrollPageLayout>
  )
}
