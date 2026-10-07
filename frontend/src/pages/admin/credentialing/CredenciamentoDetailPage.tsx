import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, ExternalLink, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DeleteConfirmDialog } from '@/components/crud/DeleteConfirmDialog'
import { PageHeader } from '@/components/layout/PageHeader'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { CascadeItem, CascadeReveal } from '@/components/motion/CascadeReveal'
import { CredentialingStatusBanner } from '@/components/credentialing/CredentialingStatusBanner'
import { CredentialingStepper } from '@/components/credentialing/CredentialingStepper'
import { useCrudMutation } from '@/hooks/useCrudMutation'
import { useImmersiveLayout } from '@/contexts/ImmersiveLayoutContext'
import {
  computeStepCompletion,
  isCredentialingActive,
  isCredentialingPendingReview,
  resolveCurrentStep,
} from '@/lib/credentialingModel'
import { ASAAS_SIGNUP_URL, ASAAS_WALLET_HELP, isAsaasWalletId } from '@/constants/asaas'
import { formatCpfCnpj, formatDate, formatDateTime } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import {
  councilTypeLabels,
  credentialingStatusLabels,
  cardiorrespiratoryHabilitationStatusLabels,
  cardiorrespiratoryRequestBasisLabels,
  personTypeLabels,
  ppClassLabels,
  professionTypeLabels,
  professionalDocumentTypeLabels,
} from '@/constants/labels'
import {
  CARDIO_HABILITATION_DOCUMENTS,
} from '@/lib/credentialingModel'
import {
  getPpTechnicalCategoryLabel,
  ppHasCardiorrespiratoryCategory,
} from '@/lib/ppTechnicalCategories'
import {
  adminCredentialingQueryKeys,
  approveCredentialing,
  deleteCredentialingProfessional,
  getProfessionalDocumentViewUrl,
  loadAdminCredentialingSnapshot,
  professionalDeleteMessage,
  saveProfessionalWallet,
  requestCredentialingRevision,
  reviewCardiorrespiratoryHabilitation,
  type CardiorrespiratoryReviewStatus,
} from '@/services/adminCredentialing'
import type { Tables } from '@/types/database'
import { cn } from '@/lib/utils'

function DetailSection({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 space-y-3', className)}>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      {children}
    </div>
  )
}

function WalletEditor({
  professionalId,
  initialValue,
}: {
  professionalId: string
  initialValue: string
}) {
  const [value, setValue] = useState(initialValue)
  const save = useCrudMutation({
    mutationFn: () => {
      const trimmed = value.trim()
      if (trimmed && !isAsaasWalletId(trimmed)) {
        throw new Error('Wallet ID inválido. Cole o UUID da conta Asaas.')
      }
      return saveProfessionalWallet(professionalId, trimmed)
    },
    queryKey: adminCredentialingQueryKeys.detail(professionalId),
    successMessage: 'Wallet Asaas salvo',
  })

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={initialValue ? 'secondary' : 'outline'}>
          {initialValue ? 'Vinculado' : 'Pendente'}
        </Badge>
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="wallet ID"
          className="max-w-xs font-mono text-xs"
        />
        <Button type="button" size="sm" variant="outline" disabled={save.isPending} onClick={() => save.mutate(undefined)}>
          Salvar wallet
        </Button>
      </div>
      <p className="text-xs font-normal text-muted-foreground">{ASAAS_WALLET_HELP}</p>
      <a href={ASAAS_SIGNUP_URL} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
        Criar conta no Asaas
      </a>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-1.5 border-b border-border/50 last:border-0 text-sm">
      <span className="text-muted-foreground sm:w-44 shrink-0">{label}</span>
      <span className="font-medium break-words">{value ?? '—'}</span>
    </div>
  )
}

type ProfessionalDocumentRow = Pick<
  Tables<'professional_documents'>,
  'id' | 'file_name' | 'storage_path' | 'source_url'
>

function DocumentFileLink({ doc }: { doc: ProfessionalDocumentRow }) {
  const [loading, setLoading] = useState(false)
  const label = doc.file_name ?? 'Enviado'
  const canOpen = Boolean(doc.storage_path || doc.source_url)

  const handleOpen = async () => {
    setLoading(true)
    try {
      const url = await getProfessionalDocumentViewUrl(doc)
      if (!url) {
        toast.error('Arquivo não disponível para visualização')
        return
      }
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      toast.error('Não foi possível abrir o documento')
    } finally {
      setLoading(false)
    }
  }

  if (!canOpen) {
    return (
      <span className="text-muted-foreground truncate max-w-[220px]" title={label}>
        {label}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={() => void handleOpen()}
      disabled={loading}
      className="inline-flex items-center gap-1 text-primary font-medium truncate max-w-[220px] hover:underline disabled:opacity-60"
      title={`Visualizar ${label}`}
    >
      <span className="truncate">{loading ? 'Abrindo…' : label}</span>
      {!loading && <ExternalLink size={14} className="shrink-0" aria-hidden />}
    </button>
  )
}

function CredentialingDetailPageHeader({
  name,
  statusLabel,
  onBack,
  loading,
}: {
  name?: string
  statusLabel?: string
  onBack: () => void
  loading?: boolean
}) {
  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBack}
        className="shrink-0 rounded-xl"
        aria-label="Voltar"
      >
        <ArrowLeft size={20} />
      </Button>
      {loading ? (
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Skeleton className="h-7 w-48 max-w-full" />
          <Skeleton className="h-5 w-32" />
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <h1 className="font-display font-bold text-xl lg:text-2xl leading-tight tracking-tight truncate">
            {name ?? 'Credenciamento'}
          </h1>
          {statusLabel && (
            <Badge variant="outline" className="font-normal shrink-0">
              {statusLabel}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

export function CredenciamentoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const goBack = () => navigate('/admin/profissionais')
  const { setFixedMain } = useImmersiveLayout()

  useEffect(() => {
    setFixedMain(true)
    return () => setFixedMain(false)
  }, [setFixedMain])

  const { data: snapshot, isLoading, isFetching } = useQuery({
    queryKey: adminCredentialingQueryKeys.detail(id ?? ''),
    queryFn: () => loadAdminCredentialingSnapshot(id!),
    enabled: !!id,
  })

  const approve = useCrudMutation({
    mutationFn: () => approveCredentialing(id!),
    queryKey: adminCredentialingQueryKeys.list,
    successMessage: 'Profissional aprovado e ativado',
    onSuccess: () => {
      navigate('/admin/profissionais')
    },
  })

  const revision = useCrudMutation({
    mutationFn: () => requestCredentialingRevision(id!),
    queryKey: adminCredentialingQueryKeys.list,
    successMessage: 'Devolvido ao profissional para correção',
    onSuccess: () => {
      navigate('/admin/profissionais')
    },
  })

  const [deleteOpen, setDeleteOpen] = useState(false)
  const removeProfessional = useCrudMutation({
    mutationFn: () => deleteCredentialingProfessional(id!),
    queryKey: adminCredentialingQueryKeys.list,
    successMessage: '',
    onSuccess: (outcome) => {
      setDeleteOpen(false)
      toast.success(professionalDeleteMessage(outcome))
      navigate('/admin/profissionais')
    },
  })

  const cardioReview = useCrudMutation({
    mutationFn: ({ status, notes }: { status: CardiorrespiratoryReviewStatus; notes?: string }) =>
      reviewCardiorrespiratoryHabilitation(id!, status, notes),
    queryKey: adminCredentialingQueryKeys.detail(id ?? ''),
    successMessage: 'Status de habilitação Cardiorrespiratória atualizado',
  })

  if (isLoading) {
    return (
      <>
        <PageHeader loading>
          <CredentialingDetailPageHeader onBack={goBack} loading />
        </PageHeader>
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden w-full min-w-0">
          <div className="flex-1 min-h-0 overflow-y-auto shell-content-x pb-[var(--shell-gap)]">
            <DetailPageSkeleton fields={10} />
          </div>
        </div>
      </>
    )
  }

  if (!snapshot) {
    return (
      <>
        <PageHeader>
          <CredentialingDetailPageHeader onBack={goBack} />
        </PageHeader>
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden w-full min-w-0">
          <div className="flex-1 min-h-0 overflow-y-auto shell-content-x pb-[var(--shell-gap)]">
            <p className="text-muted-foreground py-6">Credenciamento não encontrado.</p>
          </div>
        </div>
      </>
    )
  }

  const pro = snapshot.professional
  const status = pro.credentialing_status
  const completion = computeStepCompletion(snapshot)
  const currentStep = resolveCurrentStep(completion)
  const pendingReview = isCredentialingPendingReview(status)
  const isActive = isCredentialingActive(status)
  const proExtended = pro as typeof pro & {
    pp_class?: string
    created_at?: string
    updated_at?: string
    asaas_wallet_id?: string | null
    technical_categories?: string[] | null
    cardiorrespiratory_habilitation_status?: string
    cardiorrespiratory_request_basis?: string | null
    cardiorrespiratory_experience_description?: string | null
  }

  const technicalCategories = proExtended.technical_categories ?? []
  const cardioStatus = proExtended.cardiorrespiratory_habilitation_status ?? 'nao_solicitado'
  const hasCardioCategory = ppHasCardiorrespiratoryCategory(technicalCategories)
  const cardioDocs = snapshot.documents.filter((d) =>
    (CARDIO_HABILITATION_DOCUMENTS as readonly string[]).includes(d.document_type),
  )

  const requiredDocs = ['RG_CNH', 'COUNCIL_CARD', 'CRIMINAL_BACKGROUND'] as const
  const uploadedTypes = new Set(snapshot.documents.map((d) => d.document_type))

  return (
    <>
      <PageHeader>
        <CredentialingDetailPageHeader
          name={pro.full_name}
          statusLabel={credentialingStatusLabels[status] ?? status}
          onBack={goBack}
        />
      </PageHeader>

      <div className="flex flex-1 flex-col min-h-0 overflow-hidden w-full min-w-0 pb-[var(--shell-gap)]">
        <div
          className={cn(
            'flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-sidebar shell-content-x pt-1',
            pendingReview ? 'pb-4' : 'pb-[var(--shell-gap)]',
          )}
        >
          <CascadeReveal
            className={cn(
              'space-y-6 transition-opacity duration-300',
              isFetching && !isLoading && 'opacity-60',
            )}
          >
            {pendingReview && (
              <CascadeItem>
                <CredentialingStatusBanner snapshot={snapshot} />
              </CascadeItem>
            )}

        <CascadeItem>
          {isActive ? (
            <div className="rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <h3 className="font-display text-base font-semibold">Progresso do onboarding</h3>
                  <CredentialingStepper currentStep={currentStep} completion={completion} />
                </div>
                <CredentialingStatusBanner
                  snapshot={snapshot}
                  compact
                  className="shrink-0 lg:max-w-xs"
                />
              </div>
            </div>
          ) : (
            <DetailSection title="Progresso do onboarding" className="px-4 py-3 space-y-1.5">
              <CredentialingStepper currentStep={currentStep} completion={completion} />
            </DetailSection>
          )}
        </CascadeItem>

        <CascadeItem>
          <DetailSection title="Dados pessoais e profissionais">
            <DetailRow label="Nome" value={pro.full_name} />
            <DetailRow label="E-mail" value={pro.email} />
            <DetailRow
              label="CPF/CNPJ"
              value={pro.cpf_cnpj ? formatCpfCnpj(pro.cpf_cnpj) : '—'}
            />
            <DetailRow
              label="Tipo de pessoa"
              value={personTypeLabels[pro.person_type] ?? pro.person_type}
            />
            <DetailRow label="Nascimento" value={pro.birth_date ? formatDate(String(pro.birth_date)) : '—'} />
            <DetailRow label="Telefone" value={pro.phone} />
            <DetailRow label="Endereço" value={pro.address} />
            <DetailRow
              label="Profissão"
              value={professionTypeLabels[pro.profession] ?? pro.profession}
            />
            <DetailRow
              label="Classe PP"
              value={proExtended.pp_class ? (ppClassLabels[proExtended.pp_class] ?? proExtended.pp_class) : '—'}
            />
            <DetailRow
              label="Wallet Asaas"
              value={
                <WalletEditor
                  professionalId={pro.id}
                  initialValue={proExtended.asaas_wallet_id ?? ''}
                />
              }
            />
            <DetailRow
              label="Cadastro em"
              value={proExtended.created_at ? formatDateTime(String(proExtended.created_at)) : '—'}
            />
            <DetailRow
              label="Atualizado em"
              value={proExtended.updated_at ? formatDateTime(String(proExtended.updated_at)) : '—'}
            />
          </DetailSection>
        </CascadeItem>

        <CascadeItem>
          <DetailSection title="Categorias técnicas">
            {technicalCategories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {technicalCategories.map((category) => (
                  <Badge key={category} variant="secondary">
                    {getPpTechnicalCategoryLabel(category)}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma categoria informada.</p>
            )}
          </DetailSection>
        </CascadeItem>

        {(hasCardioCategory || cardioStatus !== 'nao_solicitado') && (
          <CascadeItem>
            <DetailSection title="Habilitação Cardiorrespiratória">
              <DetailRow
                label="Status"
                value={
                  cardiorrespiratoryHabilitationStatusLabels[cardioStatus]
                  ?? cardioStatus
                }
              />
              {proExtended.cardiorrespiratory_request_basis && (
                <DetailRow
                  label="Base da solicitação"
                  value={
                    cardiorrespiratoryRequestBasisLabels[proExtended.cardiorrespiratory_request_basis]
                    ?? proExtended.cardiorrespiratory_request_basis
                  }
                />
              )}
              {proExtended.cardiorrespiratory_experience_description && (
                <DetailRow
                  label="Experiência relatada"
                  value={proExtended.cardiorrespiratory_experience_description}
                />
              )}
              {cardioDocs.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Documentos</p>
                  {cardioDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between gap-3 text-sm">
                      <span>{professionalDocumentTypeLabels[doc.document_type] ?? doc.document_type}</span>
                      <DocumentFileLink doc={doc} />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-3">
                <Button
                  type="button"
                  size="sm"
                  disabled={cardioReview.isPending}
                  onClick={() => cardioReview.mutate({ status: 'habilitado' })}
                >
                  Aprovar habilitação
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={cardioReview.isPending}
                  onClick={() => cardioReview.mutate({ status: 'nao_habilitado' })}
                >
                  Reprovar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={cardioReview.isPending}
                  onClick={() => cardioReview.mutate({ status: 'suspenso' })}
                >
                  Suspender
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={cardioReview.isPending}
                  onClick={() => cardioReview.mutate({ status: 'em_analise' })}
                >
                  Voltar para análise
                </Button>
              </div>
            </DetailSection>
          </CascadeItem>
        )}

        <CascadeItem>
          <DetailSection title="Conselho profissional">
            {snapshot.council ? (
              <>
                <DetailRow
                  label="Conselho"
                  value={councilTypeLabels[snapshot.council.council_type] ?? snapshot.council.council_type}
                />
                <DetailRow label="Registro" value={snapshot.council.registration_number} />
                <CrefitoLookup
                  document={pro.cpf_cnpj}
                  registration={snapshot.council.registration_number}
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Conselho ainda não informado.</p>
            )}
          </DetailSection>
        </CascadeItem>

        <CascadeItem>
          <DetailSection title="Documentos">
            <div className="space-y-2">
              {requiredDocs.map((docType) => {
                const uploaded = snapshot.documents.find((d) => d.document_type === docType)
                return (
                  <div
                    key={docType}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 text-sm"
                  >
                    <span>{professionalDocumentTypeLabels[docType] ?? docType}</span>
                    {uploaded ? (
                      <DocumentFileLink doc={uploaded} />
                    ) : (
                      <span className="text-muted-foreground">Pendente</span>
                    )}
                  </div>
                )
              })}
            </div>
            {snapshot.documents.filter((d) => !requiredDocs.includes(d.document_type as typeof requiredDocs[number])).length > 0 && (
              <div className="pt-3 space-y-2 border-t border-border/50 mt-3">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Opcionais</p>
                {snapshot.documents
                  .filter((d) => !requiredDocs.includes(d.document_type as typeof requiredDocs[number]))
                  .map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between gap-3 text-sm">
                      <span>{professionalDocumentTypeLabels[doc.document_type] ?? doc.document_type}</span>
                      <DocumentFileLink doc={doc} />
                    </div>
                  ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground pt-2">
              {requiredDocs.filter((t) => uploadedTypes.has(t)).length} de {requiredDocs.length} obrigatórios enviados
            </p>
          </DetailSection>
        </CascadeItem>

        <CascadeItem>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailSection title="Dados bancários">
              {snapshot.bank ? (
                <>
                  <DetailRow label="Banco" value={snapshot.bank.bank_name} />
                  <DetailRow label="Agência" value={snapshot.bank.agency} />
                  <DetailRow label="Conta" value={snapshot.bank.account_number} />
                  <DetailRow label="Tipo" value={snapshot.bank.account_type} />
                  <DetailRow label="PIX" value={snapshot.bank.pix_key} />
                  <DetailRow label="Titular" value={snapshot.bank.holder_name} />
                  <DetailRow
                    label="CPF/CNPJ titular"
                    value={snapshot.bank.holder_document ? formatCpfCnpj(snapshot.bank.holder_document) : '—'}
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Dados bancários ainda não informados.</p>
              )}
            </DetailSection>

            <DetailSection title="Contrato e termos">
              <DetailRow
                label="Termos aceitos"
                value={
                  snapshot.acceptedTermTypes.length > 0
                    ? snapshot.acceptedTermTypes.join(', ')
                    : 'Nenhum'
                }
              />
              {snapshot.contract ? (
                <>
                  <DetailRow label="Contrato" value={snapshot.contract.contract_number} />
                  <DetailRow label="Status contrato" value={snapshot.contract.status} />
                  <DetailRow
                    label="Assinado em"
                    value={snapshot.contract.signed_at ? formatDateTime(String(snapshot.contract.signed_at)) : '—'}
                  />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Contrato LRS-PROF ainda não gerado.</p>
              )}
            </DetailSection>
          </div>
        </CascadeItem>
          </CascadeReveal>
        </div>

        <div className="shrink-0 border-t border-border shell-content-x py-3 flex justify-end">
          <Button
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            Excluir profissional
          </Button>
          <DeleteConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            description="Se não houver atendimentos, avaliações ou repasses, o cadastro é apagado. Se houver, a conta é inativada e o histórico clínico permanece."
            isDeleting={removeProfessional.isPending}
            onConfirm={() => removeProfessional.mutate(undefined)}
          />
        </div>
        {pendingReview && (
          <footer className="shrink-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 shell-content-x py-4 flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              disabled={revision.isPending || approve.isPending}
              onClick={() => revision.mutate(undefined)}
            >
              <RotateCcw size={16} className="mr-2" />
              Solicitar correção
            </Button>
            <Button
              disabled={approve.isPending || revision.isPending}
              onClick={() => approve.mutate(undefined)}
            >
              <CheckCircle2 size={16} className="mr-2" />
              Aprovar credenciamento
            </Button>
          </footer>
        )}
      </div>
    </>
  )
}

function CrefitoLookup({ document, registration }: { document?: string | null; registration?: string | null }) {
  const [status, setStatus] = useState<string | null>(null)
  const [detail, setDetail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-2 py-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={async () => {
          setLoading(true)
          try {
            const { data, error } = await supabase.functions.invoke('lookup-crefito', {
              body: { document, registration },
            })
            if (error) throw error
            const result = data as { status?: string; detail?: string | null }
            setStatus(result.status ?? 'indisponivel')
            setDetail(result.detail ?? null)
          } catch (err) {
            setStatus('indisponivel')
            setDetail(err instanceof Error ? err.message : 'Consulta indisponível. A aprovação manual segue.')
          } finally {
            setLoading(false)
          }
        }}
      >
        {loading ? 'Consultando CREFITO…' : 'Consultar CREFITO-3'}
      </Button>
      {status && (
        <p className="text-sm text-muted-foreground">
          Situação: {status}
          {detail ? ` — ${detail}` : ''}
        </p>
      )}
    </div>
  )
}
