import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { CrudModal } from '@/components/crud/CrudModal'
import { PricingVersionDrawer } from '@/components/pricing/PricingVersionDrawer'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FormActions } from '@/components/crud/FormActions'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { requiredString } from '@/schemas/common'
import { formatDate } from '@/lib/formatters'
import {
  activatePricingVersion,
  clonePricingVersion,
  listPricingVersions,
  pricingQueryKeys,
} from '@/services/pricing'

const createSchema = z.object({
  version_code: requiredString('Código da versão'),
  effective_from: requiredString('Data de vigência'),
  source_version_id: requiredString('Versão base'),
  notes: z.string().optional(),
})

type CreateFormValues = z.infer<typeof createSchema>

export function PricingConfigPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [versions, setVersions] = useState<Awaited<ReturnType<typeof listPricingVersions>>>([])

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      version_code: '',
      effective_from: new Date().toISOString().slice(0, 10),
      source_version_id: '',
      notes: '',
    },
  })

  const openDrawer = (versionId: string) => {
    setSelectedVersionId(versionId)
    setDrawerOpen(true)
  }

  const createVersion = useCrudMutation({
    mutationFn: (values: CreateFormValues) =>
      clonePricingVersion({
        sourceVersionId: values.source_version_id,
        versionCode: values.version_code,
        effectiveFrom: values.effective_from,
        notes: values.notes || null,
      }),
    queryKey: pricingQueryKeys.versions,
    successMessage: 'Versão criada com sucesso',
    onSuccess: (version) => {
      form.reset()
      setCreateOpen(false)
      openDrawer(version.id)
    },
  })

  const activateVersion = useCrudMutation({
    mutationFn: activatePricingVersion,
    queryKey: pricingQueryKeys.versions,
    successMessage: 'Versão ativada',
  })

  const handleOpenCreate = (loadedVersions: Awaited<ReturnType<typeof listPricingVersions>>) => {
    setVersions(loadedVersions)
    const active = loadedVersions.find((v) => v.is_active) ?? loadedVersions[0]
    form.reset({
      version_code: '',
      effective_from: new Date().toISOString().slice(0, 10),
      source_version_id: active?.id ?? '',
      notes: '',
    })
    setCreateOpen(true)
  }

  return (
    <>
      <EntityListPage
        title="Tabela de preços"
        description="Versões de precificação regional, repasses e taxa do primeiro mês"
        queryKey={pricingQueryKeys.versions}
        queryFn={async () => {
          const data = await listPricingVersions()
          setVersions(data)
          return { data, count: data.length }
        }}
        createLabel="Nova versão"
        onCreate={() => {
          void listPricingVersions().then(handleOpenCreate)
        }}
        onRowClick={(row) => openDrawer(String(row.id))}
        emptyMessage="Nenhuma versão cadastrada"
        columns={[
          {
            key: 'version_code',
            header: 'Versão',
            cell: (row) => (
              <div className="flex items-center gap-2">
                <span className="font-medium">{String(row.version_code)}</span>
                {row.is_active ? (
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Ativa</Badge>
                ) : null}
              </div>
            ),
          },
          {
            key: 'effective_from',
            header: 'Vigência',
            cell: (row) => formatDate(String(row.effective_from)),
          },
          {
            key: 'notes',
            header: 'Observações',
            cell: (row) => String(row.notes ?? '—'),
          },
          {
            key: 'actions',
            header: '',
            cell: (row) =>
              !row.is_active ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(event) => {
                    event.stopPropagation()
                    if (window.confirm(`Ativar a versão ${row.version_code}?`)) {
                      activateVersion.mutate(String(row.id))
                    }
                  }}
                  disabled={activateVersion.isPending}
                >
                  <CheckCircle2 className="mr-1.5 size-3.5" />
                  Ativar
                </Button>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                  <CheckCircle2 className="size-3.5" />
                  Em vigor
                </span>
              ),
          },
        ]}
      />

      <PricingVersionDrawer
        versionId={selectedVersionId}
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) setSelectedVersionId(null)
        }}
      />

      <CrudModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Nova versão de preços"
        description="Clone uma versão existente para editar com segurança"
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => createVersion.mutate(values))} className="space-y-4">
            <FormField
              control={form.control}
              name="version_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código da versão</FormLabel>
                  <FormControl>
                    <Input placeholder="V2-2026" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="effective_from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Início da vigência</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="source_version_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clonar de</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a versão base" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {versions.map((version) => (
                        <SelectItem key={version.id} value={version.id}>
                          {version.version_code}
                          {version.is_active ? ' (ativa)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormActions onCancel={() => setCreateOpen(false)} isSubmitting={createVersion.isPending} submitLabel="Criar versão" />
          </form>
        </Form>
      </CrudModal>
    </>
  )
}
