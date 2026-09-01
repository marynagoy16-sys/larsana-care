import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Download,
  Receipt,
  TrendingUp,
  Wallet,
  PiggyBank,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { FormActions } from '@/components/crud/FormActions'
import { CrudEmptyState } from '@/components/crud/CrudEmptyState'
import { MetricCardRow } from '@/components/dashboard/MetricCardRow'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { requiredString } from '@/schemas/common'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import { internalExpensesService } from '@/services/index'
import { edgeFunctions } from '@/services/edgeFunctions'
import {
  formatDelumaReferenceMonth,
  listDelumaExports,
  matchesDelumaMonth,
} from '@/services/delumaExports'
import {
  fetchCashFlowSummary,
  listInternalExpensesByMonth,
} from '@/services/cashFlow'

function currentMonthKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number)
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  )
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function buildRecentMonthOptions(count = 24): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = []
  const now = new Date()
  for (let offset = 0; offset < count; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    options.push({ value, label: formatMonthLabel(value) })
  }
  return options
}

const MONTH_OPTIONS = buildRecentMonthOptions()

export function CaixaPage() {
  const queryClient = useQueryClient()
  const [monthKey, setMonthKey] = useState(() => currentMonthKey())
  const [open, setOpen] = useState(false)

  const { data: summary, isLoading: summaryLoading, isFetching: summaryFetching, refetch } = useQuery({
    queryKey: ['admin', 'cash-flow', monthKey],
    queryFn: () => fetchCashFlowSummary(monthKey),
  })

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ['admin', 'cash-flow', 'expenses', monthKey],
    queryFn: () => listInternalExpensesByMonth(monthKey),
  })

  const { data: delumaExports = [], isLoading: delumaLoading } = useQuery({
    queryKey: ['admin', 'deluma-exports'],
    queryFn: () => listDelumaExports(),
  })

  const monthDelumaExports = useMemo(
    () => delumaExports.filter((row) => matchesDelumaMonth(row.reference_month, monthKey)),
    [delumaExports, monthKey],
  )

  const generateDeluma = useMutation({
    mutationFn: () => edgeFunctions.generateDelumaExport({ reference_month: monthKey }),
    onSuccess: () => {
      toast.success(`Exportação DELUMA de ${formatMonthLabel(monthKey)} gerada.`)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'deluma-exports'] })
    },
    onError: (error: Error) => toast.error(error.message || 'Não foi possível gerar a exportação.'),
  })

  const schema = z.object({
    expense_type: requiredString('Tipo'),
    amount_cents: z.coerce.number().positive(),
    reference_month: requiredString('Mês'),
  })

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema) as never,
    defaultValues: { expense_type: '', amount_cents: 0, reference_month: monthKey },
  })

  const create = useCrudMutation({
    mutationFn: (values: z.infer<typeof schema>) => internalExpensesService.create(values),
    queryKey: ['internal_expenses'],
    onSuccess: () => {
      form.reset({ expense_type: '', amount_cents: 0, reference_month: monthKey })
      setOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'cash-flow'] })
    },
  })

  const statCards = useMemo(() => {
    if (!summary) return []

    return [
      {
        label: 'Recebido no mês',
        value: formatCurrency(summary.receivedCents),
        icon: TrendingUp,
        href: '/admin/cobrancas',
        footer: `${summary.receivedCount} cobrança${summary.receivedCount === 1 ? '' : 's'} paga${summary.receivedCount === 1 ? '' : 's'}`,
      },
      {
        label: 'A repassar',
        value: formatCurrency(summary.toTransferCents),
        icon: Clock,
        href: '/admin/repasses',
        footer: `${summary.toTransferCount} repasse${summary.toTransferCount === 1 ? '' : 's'} pendente${summary.toTransferCount === 1 ? '' : 's'}`,
      },
      {
        label: 'Repassado no mês',
        value: formatCurrency(summary.transferredCents),
        icon: ArrowUpRight,
        href: '/admin/repasses',
        footer: `${summary.transferredCount} transferência${summary.transferredCount === 1 ? '' : 's'}`,
      },
      {
        label: 'Margem Larsana',
        value: formatCurrency(summary.marginCents),
        icon: PiggyBank,
        footer: 'Repasses de ciclo no mês',
      },
      {
        label: 'A receber',
        value: formatCurrency(summary.receivableCents),
        icon: Receipt,
        href: '/admin/cobrancas',
        footer: `${summary.receivableCount} cobrança${summary.receivableCount === 1 ? '' : 's'} em aberto`,
      },
      {
        label: 'Retido no mês',
        value: formatCurrency(summary.retainedCents),
        icon: Wallet,
        footer: `Recebido − repassado − ${formatCurrency(summary.expensesCents)} despesas`,
      },
    ]
  }, [summary])

  const loading = summaryLoading && !summary

  return (
    <>
      <CrudScrollPageLayout>
        <CascadeReveal className="space-y-5 pb-8">
          <CascadeItem>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Select value={monthKey} onValueChange={setMonthKey}>
                <SelectTrigger className="h-9 w-[196px] shrink-0">
                  <SelectValue placeholder="Mês de referência">
                    {formatMonthLabel(monthKey)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  disabled={summaryFetching}
                  onClick={() => void refetch()}
                >
                  Atualizar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-9"
                  onClick={() => {
                    form.setValue('reference_month', monthKey)
                    setOpen(true)
                  }}
                >
                  Nova despesa
                </Button>
              </div>
            </div>
          </CascadeItem>

          <CascadeItem>
            {loading ? (
              <DetailPageSkeleton fields={4} />
            ) : (
              <MetricCardRow
                cards={statCards}
                columns={3}
                isLoading={summaryFetching && !summary}
                className={cn(summaryFetching && summary && 'opacity-60')}
              />
            )}
          </CascadeItem>

          <CascadeItem>
            <section className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold">Despesas internas</h2>
                  <p className="text-xs text-muted-foreground">
                    Lançamentos do mês de referência
                  </p>
                </div>
                {summary ? (
                  <p className="text-sm font-semibold tabular-nums">
                    {formatCurrency(summary.expensesCents)}
                  </p>
                ) : null}
              </div>

              {expensesLoading ? (
                <p className="p-5 text-sm text-muted-foreground">Carregando despesas…</p>
              ) : expenses.length === 0 ? (
                <CrudEmptyState message="Nenhuma despesa registrada neste mês." muted />
              ) : (
                <div className="divide-y divide-border">
                  {expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{expense.expense_type}</p>
                        {expense.notes ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">{expense.notes}</p>
                        ) : (
                          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                            {formatDateTime(expense.created_at)}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 font-medium tabular-nums">
                        {formatCurrency(expense.amount_cents)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </CascadeItem>

          <CascadeItem>
            <section className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold">Exportação DELUMA</h2>
                  <p className="text-xs text-muted-foreground">
                    Pacote contábil mensal (XLSX) para a contabilidade
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-9 shrink-0"
                  disabled={generateDeluma.isPending}
                  onClick={() => generateDeluma.mutate()}
                >
                  <Download size={14} />
                  {generateDeluma.isPending
                    ? 'Gerando…'
                    : `Gerar exportação · ${formatMonthLabel(monthKey)}`}
                </Button>
              </div>

              {delumaLoading ? (
                <p className="p-5 text-sm text-muted-foreground">Carregando exportações…</p>
              ) : monthDelumaExports.length === 0 ? (
                <CrudEmptyState
                  message={`Nenhuma exportação DELUMA gerada para ${formatMonthLabel(monthKey).toLowerCase()}.`}
                  muted
                />
              ) : (
                <div className="divide-y divide-border">
                  {monthDelumaExports.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">
                          {row.file_name ?? `deluma-${row.reference_month.slice(0, 7)}.xlsx`}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                          {formatDelumaReferenceMonth(row.reference_month)} ·{' '}
                          {formatDateTime(row.generated_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {delumaExports.length > monthDelumaExports.length ? (
                <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
                  {delumaExports.length - monthDelumaExports.length} exportação
                  {delumaExports.length - monthDelumaExports.length === 1 ? '' : 'ões'} de outros meses
                  no histórico.
                </p>
              ) : null}
            </section>
          </CascadeItem>

          <CascadeItem>
            <section className="rounded-xl border border-dashed border-border bg-muted/20 p-5 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Como ler este painel</p>
              <ul className="mt-2 space-y-1.5">
                <li className="flex items-start gap-2">
                  <ArrowDownRight className="mt-0.5 size-4 shrink-0" />
                  <span>
                    <strong className="text-foreground">Recebido</strong> — cobranças pagas no mês (
                    <Link to="/admin/cobrancas" className="text-primary hover:underline">
                      ver cobranças
                    </Link>
                    ).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowDownRight className="mt-0.5 size-4 shrink-0" />
                  <span>
                    <strong className="text-foreground">A repassar</strong> — repasses de ciclo e SUB
                    ainda não transferidos (
                    <Link to="/admin/repasses" className="text-primary hover:underline">
                      ver repasses
                    </Link>
                    ).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ArrowDownRight className="mt-0.5 size-4 shrink-0" />
                  <span>
                    <strong className="text-foreground">Retido</strong> — estimativa do mês: recebido
                    menos repassado e despesas internas.
                  </span>
                </li>
              </ul>
            </section>
          </CascadeItem>
        </CascadeReveal>
      </CrudScrollPageLayout>

      <CrudModal open={open} onOpenChange={setOpen} title="Nova despesa interna">
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => create.mutate(values))} className="space-y-4">
            <FormField
              control={form.control}
              name="expense_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex.: Marketing, infraestrutura" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount_cents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (centavos)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reference_month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mês de referência</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o mês" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MONTH_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormActions onCancel={() => setOpen(false)} isSubmitting={create.isPending} />
          </form>
        </Form>
      </CrudModal>
    </>
  )
}
