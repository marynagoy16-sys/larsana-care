import { useRef, type ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload, Check, Trash2 } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  CARDIO_HABILITATION_DOCUMENTS,
  CARDIORRESPIRATORY_CATEGORY,
  inferRequestsCardioHabilitation,
  type CredentialingSnapshot,
} from '@/lib/credentialingModel'
import {
  cardiorrespiratoryRequestBasisLabels,
  ppTechnicalCategoryLabels,
  PP_TECHNICAL_CATEGORY_VALUES,
  type PpTechnicalCategory,
} from '@/lib/ppTechnicalCategories'
import { cardioHabilitationDocumentTypeLabels } from '@/constants/labels'
import { categoriasStepSchema, type CategoriasStepValues } from '@/schemas/credentialing'
import type { Tables } from '@/types/database'

type Props = {
  snapshot: CredentialingSnapshot
  onSubmit: (values: CategoriasStepValues) => Promise<void>
  onUpload: (file: File, type: Tables<'professional_documents'>['document_type']) => Promise<void>
  onRemove: (documentId: string) => Promise<void>
  uploadingType?: string | null
  disabled?: boolean
}

function toDefaultValues(pro: CredentialingSnapshot['professional']): CategoriasStepValues {
  const categories = (pro.technical_categories ?? []) as PpTechnicalCategory[]
  return {
    technical_categories: categories,
    patient_preferences: (pro.patient_preferences ?? []) as PpTechnicalCategory[],
    requests_cardio_habilitation: inferRequestsCardioHabilitation(pro),
    cardiorrespiratory_request_basis: pro.cardiorrespiratory_request_basis ?? undefined,
    cardiorrespiratory_experience_description: pro.cardiorrespiratory_experience_description ?? undefined,
  }
}

export function CategoriasTecnicasStepForm({
  snapshot,
  onSubmit,
  onUpload,
  onRemove,
  uploadingType,
  disabled,
}: Props) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const form = useForm<CategoriasStepValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(categoriasStepSchema) as any,
    defaultValues: toDefaultValues(snapshot.professional),
    mode: 'onBlur',
  })

  const selectedCategories = form.watch('technical_categories') ?? []
  const wantsCardio = selectedCategories.includes(CARDIORRESPIRATORY_CATEGORY)
  const requestsHabilitation = form.watch('requests_cardio_habilitation')
  const docByType = new Map(snapshot.documents.map((d) => [d.document_type, d]))

  const handleFile = async (
    type: Tables<'professional_documents'>['document_type'],
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    await onUpload(file, type)
  }

  return (
    <Form {...form}>
      <form id="credentialing-step-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <h3 className="font-display text-base font-semibold">Categorias técnicas</h3>
          <p className="text-sm text-muted-foreground">
            Selecione os tipos de atendimento que você se sente apto(a) a realizar pela Larsana Care:
          </p>
        </div>

        <FormField
          control={form.control}
          name="technical_categories"
          render={() => (
            <FormItem>
              <div className="grid gap-3 sm:grid-cols-2">
                {PP_TECHNICAL_CATEGORY_VALUES.map((category) => (
                  <FormField
                    key={category}
                    control={form.control}
                    name="technical_categories"
                    render={({ field }) => {
                      const checked = field.value?.includes(category)
                      return (
                        <FormItem className="flex items-start gap-3 rounded-lg border border-border p-3">
                          <FormControl>
                            <Checkbox
                              checked={checked}
                              disabled={disabled}
                              onCheckedChange={(value) => {
                                const current = field.value ?? []
                                if (value) {
                                  field.onChange([...current, category])
                                } else {
                                  field.onChange(current.filter((c) => c !== category))
                                  if (category === CARDIORRESPIRATORY_CATEGORY) {
                                    form.setValue('requests_cardio_habilitation', false)
                                    form.setValue('cardiorrespiratory_request_basis', undefined)
                                    form.setValue('cardiorrespiratory_experience_description', undefined)
                                  }
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal leading-snug cursor-pointer">
                            {ppTechnicalCategoryLabels[category]}
                          </FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3 pt-2 border-t border-border">
          <div>
            <h4 className="font-medium text-sm">Preferências de atendimento (opcional)</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Indique os tipos de paciente que você prefere ou aceita atender. Isso ajuda na distribuição de demandas,
              mas não impede outros atendimentos.
            </p>
          </div>
          <FormField
            control={form.control}
            name="patient_preferences"
            render={() => (
              <FormItem>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PP_TECHNICAL_CATEGORY_VALUES.filter((c) => c !== CARDIORRESPIRATORY_CATEGORY).map((category) => (
                    <FormField
                      key={`pref-${category}`}
                      control={form.control}
                      name="patient_preferences"
                      render={({ field }) => {
                        const checked = field.value?.includes(category)
                        return (
                          <FormItem className="flex items-start gap-3 rounded-lg border border-dashed border-border p-3">
                            <FormControl>
                              <Checkbox
                                checked={checked}
                                disabled={disabled}
                                onCheckedChange={(value) => {
                                  const current = field.value ?? []
                                  if (value) field.onChange([...current, category])
                                  else field.onChange(current.filter((c) => c !== category))
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal leading-snug cursor-pointer">
                              {ppTechnicalCategoryLabels[category]}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
              </FormItem>
            )}
          />
        </div>

        <p className="text-sm text-muted-foreground">
          As categorias gerais são compatíveis com a formação base em Fisioterapia e poderão ser
          selecionadas por Profissionais Parceiros regulares, desde que estejam com cadastro aprovado,
          CREFITO ativo, documentação validada, contrato assinado, trilha obrigatória concluída e sem
          bloqueios internos na plataforma.
        </p>
        <p className="text-sm text-muted-foreground">
          A categoria Cardiorrespiratória exige habilitação específica pela Larsana Care. Envie especialização,
          curso reconhecido pelo MEC ou comprovação de experiência na área.
        </p>

        {wantsCardio && (
          <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
            <div className="space-y-1">
              <h4 className="font-medium">Solicitação de habilitação Cardiorrespiratória</h4>
              <p className="text-sm text-muted-foreground">
                Você deseja solicitar habilitação para atendimentos Cardiorrespiratórios pela Larsana Care?
              </p>
            </div>

            <FormField
              control={form.control}
              name="requests_cardio_habilitation"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex gap-6" role="radiogroup" aria-label="Solicitar habilitação cardiorrespiratória">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="requests_cardio_habilitation"
                          checked={field.value === true}
                          disabled={disabled}
                          onChange={() => field.onChange(true)}
                          className="h-4 w-4"
                        />
                        <span>Sim</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="requests_cardio_habilitation"
                          checked={field.value === false}
                          disabled={disabled}
                          onChange={() => field.onChange(false)}
                          className="h-4 w-4"
                        />
                        <span>Não</span>
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {requestsHabilitation && (
              <>
                <FormField
                  control={form.control}
                  name="cardiorrespiratory_request_basis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caso tenha respondido sim, informe a base da sua solicitação:</FormLabel>
                      <FormControl>
                        <div className="grid gap-2" role="radiogroup" aria-label="Base da solicitação cardiorrespiratória">
                          {Object.entries(cardiorrespiratoryRequestBasisLabels).map(([value, label]) => (
                            <label key={value} className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="cardiorrespiratory_request_basis"
                                value={value}
                                checked={field.value === value}
                                disabled={disabled}
                                onChange={() => field.onChange(value)}
                                className="mt-1 h-4 w-4"
                              />
                              <span className="text-sm leading-snug">{label}</span>
                            </label>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cardiorrespiratory_experience_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descreva brevemente sua experiência em Cardiorrespiratória:</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} disabled={disabled} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <p className="text-sm font-medium">Anexe documentos, se houver:</p>
                  <div className="grid gap-3">
                    {CARDIO_HABILITATION_DOCUMENTS.map((type) => {
                      const doc = docByType.get(type)
                      const uploading = uploadingType === type
                      return (
                        <div
                          key={type}
                          className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                              {cardioHabilitationDocumentTypeLabels[type] ?? type}
                            </p>
                            {doc ? (
                              <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                            ) : (
                              <p className="text-xs text-muted-foreground">PDF, JPEG ou PNG · máx. 10 MB</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {doc && <Check className="h-4 w-4 text-primary" aria-hidden />}
                            {doc && !disabled && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onRemove(doc.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            {!disabled && (
                              <>
                                <input
                                  ref={(el) => { inputRefs.current[type] = el }}
                                  type="file"
                                  accept=".pdf,image/jpeg,image/png,image/webp"
                                  className="hidden"
                                  onChange={(e) => handleFile(type, e)}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={uploading}
                                  onClick={() => inputRefs.current[type]?.click()}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  {uploading ? 'Enviando…' : doc ? 'Substituir' : 'Enviar'}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  A solicitação será analisada pela Larsana Care. O envio de certificado, curso ou relato
                  de experiência não garante liberação automática. A habilitação será concedida após
                  análise interna.
                </p>
              </>
            )}
          </div>
        )}
      </form>
    </Form>
  )
}
