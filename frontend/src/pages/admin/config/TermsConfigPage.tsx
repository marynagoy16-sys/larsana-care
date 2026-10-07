import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormActions } from '@/components/crud/FormActions'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { requiredString } from '@/schemas/common'
import { LEGAL_TERM_LABELS, LEGAL_TERM_PUBLIC_PATHS, LEGAL_TERM_TYPES } from '@/constants/legalTerms'
import { legalTermsService } from '@/services/index'
import { supabase } from '@/lib/supabase'

const qk = ['legal_terms'] as const

type LegalTermRow = {
  id: string
  term_type: string
  version: string
  title: string
  content: string | null
  is_current: boolean
  profile?: string | null
  acceptance_mode?: string | null
  requires_reaccept?: boolean
}

const termSchema = z.object({
  term_type: z.enum(LEGAL_TERM_TYPES),
  version: requiredString('Versão'),
  title: requiredString('Título'),
  content: requiredString('Conteúdo', 500_000),
  is_current: z.boolean(),
  profile: z.enum(['pp', 'paciente', 'publico']).optional(),
  acceptance_mode: z.enum(['express', 'awareness', 'contextual']).optional(),
  requires_reaccept: z.boolean().optional(),
})

type TermFormValues = z.infer<typeof termSchema>

async function saveLegalTerm(id: string | null, values: TermFormValues) {
  if (values.is_current) {
    let deactivateQuery = supabase
      .from('legal_terms')
      .update({ is_current: false })
      .eq('term_type', values.term_type as never)
    if (id) {
      deactivateQuery = deactivateQuery.neq('id', id)
    }
    const { error: deactivateError } = await deactivateQuery
    if (deactivateError) throw deactivateError
  }

  const payload = {
    term_type: values.term_type,
    version: values.version,
    title: values.title,
    content: values.content,
    is_current: values.is_current,
    profile: values.profile ?? null,
    acceptance_mode: values.acceptance_mode ?? 'express',
    requires_reaccept: values.requires_reaccept ?? true,
  }

  if (id) {
    return legalTermsService.update(id, payload)
  }
  return legalTermsService.create(payload)
}

export function TermsConfigPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'todos' | 'vigor' | 'historico'>('todos')
  const [profileFilter, setProfileFilter] = useState<'todos' | 'paciente' | 'pp'>('todos')

  const form = useForm<TermFormValues>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      term_type: 'TERMO_ADESAO',
      version: '1.0',
      title: LEGAL_TERM_LABELS.TERMO_ADESAO,
      content: '',
      is_current: true,
    },
  })

  const openCreate = () => {
    setEditingId(null)
    form.reset({
      term_type: 'TERMO_ADESAO',
      version: '1.0',
      title: LEGAL_TERM_LABELS.TERMO_ADESAO,
      content: '',
      is_current: false,
    })
    setModalOpen(true)
  }

  const openEdit = (row: LegalTermRow) => {
    setEditingId(row.id)
    form.reset({
      term_type: row.term_type as TermFormValues['term_type'],
      version: row.version,
      title: row.title,
      content: row.content ?? '',
      is_current: row.is_current,
    })
    setModalOpen(true)
  }

  const saveMutation = useCrudMutation({
    mutationFn: (values: TermFormValues) => saveLegalTerm(editingId, values),
    queryKey: qk,
    successMessage: editingId ? 'Termo atualizado' : 'Termo criado',
    onSuccess: () => {
      setModalOpen(false)
      setEditingId(null)
      form.reset()
    },
  })

  return (
    <>
      <EntityListPage
        title="Termos e contratos"
        description="Clique em um termo para editar o conteúdo. Termos de Uso (TERMO_ADESAO) e Políticas de Privacidade (LGPD) aparecem no login."
        queryKey={qk}
        queryFn={() =>
          legalTermsService.list('id, term_type, version, title, content, is_current, profile', {
            column: 'term_type',
            ascending: true,
          })
        }
        filterResetKey={`${statusFilter}-${profileFilter}`}
        rowFilter={(row) => {
          const term = row as LegalTermRow
          if (statusFilter === 'vigor' && !term.is_current) return false
          if (statusFilter === 'historico' && term.is_current) return false
          if (profileFilter !== 'todos' && term.profile !== profileFilter) return false
          return true
        }}
        toolbar={
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="vigor">Em vigor</SelectItem>
                <SelectItem value="historico">Histórico</SelectItem>
              </SelectContent>
            </Select>
            <Select value={profileFilter} onValueChange={(value) => setProfileFilter(value as typeof profileFilter)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os públicos</SelectItem>
                <SelectItem value="paciente">Paciente</SelectItem>
                <SelectItem value="pp">Fisioterapeuta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        createLabel="Novo termo"
        onCreate={openCreate}
        onRowClick={(row) => openEdit(row as LegalTermRow)}
        columns={[
          {
            key: 'name',
            header: 'Documento',
            cell: (row) => {
              const term = row as LegalTermRow
              const publicPath = LEGAL_TERM_PUBLIC_PATHS[term.term_type as keyof typeof LEGAL_TERM_PUBLIC_PATHS]
              return (
                <div>
                  <p className="font-medium">{LEGAL_TERM_LABELS[term.term_type as keyof typeof LEGAL_TERM_LABELS] ?? term.title}</p>
                  <p className="text-xs text-muted-foreground">{term.term_type}</p>
                  {publicPath ? (
                    <p className="text-xs text-primary/80">Login: {publicPath}</p>
                  ) : null}
                </div>
              )
            },
          },
          {
            key: 'title',
            header: 'Título cadastrado',
            cell: (row) => String((row as LegalTermRow).title),
          },
          {
            key: 'ver',
            header: 'Versão',
            cell: (row) => String((row as LegalTermRow).version),
          },
          {
            key: 'current',
            header: 'Status',
            cell: (row) =>
              (row as LegalTermRow).is_current ? (
                <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Em vigor</Badge>
              ) : (
                <Badge variant="outline">Histórico</Badge>
              ),
          },
        ]}
      />

      <CrudModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setEditingId(null)
        }}
        title={editingId ? 'Editar termo' : 'Novo termo'}
        description={editingId ? 'Alterações no conteúdo refletem nas páginas públicas quando o termo está em vigor.' : undefined}
        size="lg"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} className="space-y-4">
            <FormField
              control={form.control}
              name="term_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select
                    disabled={!!editingId}
                    onValueChange={(value) => {
                      field.onChange(value)
                      const label = LEGAL_TERM_LABELS[value as keyof typeof LEGAL_TERM_LABELS]
                      if (label && !editingId) form.setValue('title', label)
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LEGAL_TERM_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {LEGAL_TERM_LABELS[type]} ({type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versão</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!!editingId} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Textarea rows={12} className="font-mono text-sm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_current"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border border-border p-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                  </FormControl>
                  <div>
                    <FormLabel className="font-normal">Marcar como versão em vigor</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Substitui a versão ativa deste tipo na plataforma e nas páginas públicas.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormActions
              onCancel={() => setModalOpen(false)}
              isSubmitting={saveMutation.isPending}
              submitLabel={editingId ? 'Salvar alterações' : 'Criar termo'}
            />
          </form>
        </Form>
      </CrudModal>
    </>
  )
}
