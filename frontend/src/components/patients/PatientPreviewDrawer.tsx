import { useState } from 'react'
import {
  X,
  Mail,
  Phone,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Trash2,
  FileText,
  Check,
  ChevronRight,
} from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { usePatient } from '@/hooks/queries/usePatients'
import { formatCpf, formatDateTime, formatPhone } from '@/lib/formatters'
import { careStatusLabels, patientDocumentTypeLabels, patientLevelLabels } from '@/constants/labels'
import { ResponsibleFormModal } from '@/components/patients/ResponsibleFormModal'
import { AddressFormModal } from '@/components/patients/AddressFormModal'
import { DocumentUploadModal } from '@/components/patients/DocumentUploadModal'
import { useDeletePatientDocument } from '@/hooks/mutations/usePatientSubMutations'
import type { Tables } from '@/types/database'
import { PatientCreateDrawerContent } from '@/components/patients/PatientCreateDrawerContent'
import {
  JOURNEY_STAGES,
  PATIENT_DRAWER_SHEET_CLASS,
  getInitials,
} from '@/components/patients/patientDrawerShared'
import { cn } from '@/lib/utils'

export type PatientDrawerMode = 'view' | 'create'

interface PatientPreviewDrawerProps {
  mode?: PatientDrawerMode
  patientId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (patientId: string) => void
  onCreated?: (patientId: string) => void
}

const JOURNEY_STEPS = [
  'Novo cadastro',
  'Dados completos',
  'Avaliação inicial',
  'Ciclo aberto',
  'Em tratamento',
]

function resolveActiveStage(patient: {
  is_data_complete: boolean
  care_status: string
  allocated_professional_id: string | null
}) {
  if (patient.care_status === 'ATIVO' && patient.allocated_professional_id) return 'tratamento'
  if (patient.is_data_complete) return 'avaliacao'
  return 'cadastro'
}

function resolveStepIndex(patient: {
  is_data_complete: boolean
  care_status: string
  allocated_professional_id: string | null
}) {
  if (patient.care_status === 'ATIVO' && patient.allocated_professional_id) return 4
  if (patient.is_data_complete && patient.allocated_professional_id) return 3
  if (patient.is_data_complete) return 2
  return 1
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  )
}

export function PatientPreviewDrawer({
  mode = 'view',
  patientId,
  open,
  onOpenChange,
  onEdit,
  onCreated,
}: PatientPreviewDrawerProps) {
  const isCreate = mode === 'create'
  const { data: patient, isLoading } = usePatient(patientId ?? undefined, open && !isCreate && !!patientId)
  const deleteDoc = useDeletePatientDocument(patientId ?? '')

  const [responsibleOpen, setResponsibleOpen] = useState(false)
  const [addressOpen, setAddressOpen] = useState(false)
  const [documentOpen, setDocumentOpen] = useState(false)

  const primaryResponsible = patient?.patient_responsibles?.find((r) => r.is_primary) ?? patient?.patient_responsibles?.[0]
  const primaryAddress = patient?.patient_addresses?.find((a) => a.is_primary) ?? patient?.patient_addresses?.[0]
  const documents = (patient?.patient_documents ?? []) as Tables<'patient_documents'>[]

  const activeStage = patient ? resolveActiveStage(patient) : 'cadastro'
  const stepIndex = patient ? resolveStepIndex(patient) : 0

  const pendingTasks = patient
    ? [
        !patient.is_data_complete && { id: 'data', title: 'Completar cadastro', desc: 'Preencha todos os dados obrigatórios do paciente.' },
        !patient.allocated_professional_id && { id: 'pp', title: 'Alocar profissional', desc: 'Defina o PP responsável pelo tratamento domiciliar.' },
        documents.length === 0 && { id: 'docs', title: 'Enviar documentos', desc: 'RG, laudos ou exames do paciente.' },
      ].filter(Boolean) as { id: string; title: string; desc: string }[]
    : []

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className={PATIENT_DRAWER_SHEET_CLASS}>
          {isCreate ? (
            <PatientCreateDrawerContent
              onClose={() => onOpenChange(false)}
              onCreated={onCreated}
            />
          ) : isLoading || !patient || !patientId ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Fechar"
                  >
                    <X size={18} />
                  </button>
                  <h2 className="font-semibold text-sm truncate">Visão do paciente</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0"
                  onClick={() => onEdit?.(patientId)}
                >
                  Editar paciente
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Profile */}
                <div className="px-5 py-5 border-b border-border">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="text-base bg-primary/10 text-primary">
                        {getInitials(patient.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold truncate">{patient.full_name}</h3>
                      {primaryResponsible && (
                        <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                          {primaryResponsible.email && (
                            <p className="flex items-center gap-1.5 truncate">
                              <Mail size={13} />
                              {primaryResponsible.email}
                            </p>
                          )}
                          {primaryResponsible.phone && (
                            <p className="flex items-center gap-1.5">
                              <Phone size={13} />
                              {formatPhone(primaryResponsible.phone)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {[MessageCircle, Mail, Phone, MoreHorizontal].map((Icon, i) => (
                        <Button key={i} variant="outline" size="icon" className="h-8 w-8 rounded-full">
                          <Icon size={14} />
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Key info grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 px-5 py-4 border-b border-border">
                  <InfoCell label="Status" value={careStatusLabels[patient.care_status] ?? patient.care_status} />
                  <InfoCell label="Nível" value={patientLevelLabels[patient.patient_level] ?? patient.patient_level} />
                  <InfoCell label="Região" value={patient.regions ? `${patient.regions.code} — ${patient.regions.name}` : '—'} />
                  <InfoCell label="Cidade" value={patient.cities?.name ?? '—'} />
                  <InfoCell label="CPF" value={formatCpf(patient.cpf)} />
                </div>

                {/* Journey segments */}
                <div className="px-5 py-4 border-b border-border space-y-4">
                  <div className="grid grid-cols-4 rounded-lg border border-border overflow-hidden text-center text-xs font-medium">
                    {JOURNEY_STAGES.map((stage) => (
                      <div
                        key={stage.id}
                        className={cn(
                          'py-2 px-1 border-r border-border last:border-r-0',
                          activeStage === stage.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/30 text-muted-foreground',
                        )}
                      >
                        {stage.label}
                      </div>
                    ))}
                  </div>

                  {/* Stepper */}
                  <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
                    {JOURNEY_STEPS.map((step, i) => {
                      const done = i < stepIndex
                      const current = i === stepIndex
                      return (
                        <div key={step} className="flex items-center flex-1 min-w-[72px]">
                          <div className="flex flex-col items-center gap-1.5 flex-1">
                            <div
                              className={cn(
                                'h-6 w-6 rounded-full flex items-center justify-center border-2 shrink-0',
                                done && 'bg-primary border-primary text-primary-foreground',
                                current && !done && 'border-primary bg-background',
                                !done && !current && 'border-muted-foreground/30 bg-background',
                              )}
                            >
                              {done ? <Check size={12} /> : current ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                            </div>
                            <span className="text-[10px] text-center text-muted-foreground leading-tight px-0.5">{step}</span>
                          </div>
                          {i < JOURNEY_STEPS.length - 1 && (
                            <div className={cn('h-0.5 flex-1 -mt-5', i < stepIndex ? 'bg-primary' : 'bg-border')} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Pending tasks */}
                <div className="px-5 py-4 border-b border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">Pendências</h4>
                      {pendingTasks.length > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
                          {pendingTasks.length}
                        </span>
                      )}
                    </div>
                  </div>
                  {pendingTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma pendência no momento.</p>
                  ) : (
                    <div className="space-y-3">
                      {pendingTasks.map((task) => (
                        <div key={task.id} className="rounded-xl border border-border overflow-hidden">
                          <div className="p-3 flex gap-3">
                            <Checkbox className="mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">{task.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{task.desc}</p>
                            </div>
                          </div>
                          <div className="px-3 py-2 bg-muted/40 border-t border-border flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                            <span>Prioridade: Normal</span>
                            <span>·</span>
                            <span>Responsável: Gestão</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notes & clinical */}
                <div className="px-5 py-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">Notas clínicas</h4>
                      {(patient.clinical_summary || documents.length > 0) && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
                          {(patient.clinical_summary ? 1 : 0) + documents.length}
                        </span>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="h-8" onClick={() => onEdit?.(patientId)}>
                      <Plus size={14} />
                      Adicionar nota
                    </Button>
                  </div>

                  {patient.clinical_summary ? (
                    <div className="rounded-xl border border-border p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <FileText size={14} className="text-muted-foreground" />
                          Resumo clínico
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDateTime(patient.updated_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{patient.clinical_summary}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma nota registrada.</p>
                  )}

                  {/* Quick links */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                    <button
                      type="button"
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50"
                      onClick={() => setResponsibleOpen(true)}
                    >
                      Responsável
                      <ChevronRight size={14} />
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50"
                      onClick={() => setAddressOpen(true)}
                    >
                      Endereço
                      <ChevronRight size={14} />
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/50"
                      onClick={() => setDocumentOpen(true)}
                    >
                      Documentos ({documents.length})
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {documents.length > 0 && (
                    <ul className="space-y-2">
                      {documents.map((doc) => (
                        <li key={doc.id} className="flex items-center justify-between text-sm border border-border rounded-lg px-3 py-2">
                          <div className="min-w-0">
                            <span className="font-medium truncate block">{doc.file_name ?? 'Sem nome'}</span>
                            <span className="text-xs text-muted-foreground">
                              {patientDocumentTypeLabels[doc.document_type] ?? doc.document_type}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => deleteDoc.mutate(doc.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {primaryAddress && (
                    <p className="text-xs text-muted-foreground border-t border-border pt-3">
                      <span className="font-medium text-foreground">Endereço: </span>
                      {primaryAddress.full_address}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {patientId && patient && (
        <>
          <ResponsibleFormModal
            patientId={patientId}
            open={responsibleOpen}
            onOpenChange={setResponsibleOpen}
            defaultValues={primaryResponsible ? {
              id: primaryResponsible.id,
              full_name: primaryResponsible.full_name,
              cpf: primaryResponsible.cpf ?? '',
              email: primaryResponsible.email ?? '',
              phone: primaryResponsible.phone ?? '',
              backup_phone: primaryResponsible.backup_phone ?? '',
              is_primary: primaryResponsible.is_primary,
            } : undefined}
          />
          <AddressFormModal
            patientId={patientId}
            open={addressOpen}
            onOpenChange={setAddressOpen}
            defaultValues={primaryAddress ? {
              id: primaryAddress.id,
              street: primaryAddress.street ?? '',
              number: primaryAddress.number ?? '',
              complement: primaryAddress.complement ?? '',
              neighborhood: primaryAddress.neighborhood ?? '',
              postal_code: primaryAddress.postal_code ?? '',
              city_id: primaryAddress.city_id ?? '',
              full_address: primaryAddress.full_address ?? '',
            } : undefined}
          />
          <DocumentUploadModal patientId={patientId} open={documentOpen} onOpenChange={setDocumentOpen} />
        </>
      )}
    </>
  )
}
