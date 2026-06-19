import { useRef, type ChangeEvent } from 'react'
import { Upload, Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  OPTIONAL_PP_DOCUMENTS,
  REQUIRED_PP_DOCUMENTS,
  type CredentialingSnapshot,
} from '@/lib/credentialingModel'
import { professionalDocumentTypeLabels } from '@/constants/labels'
import type { Tables } from '@/types/database'

type Props = {
  snapshot: CredentialingSnapshot
  onUpload: (file: File, type: Tables<'professional_documents'>['document_type']) => Promise<void>
  onRemove: (documentId: string) => Promise<void>
  uploadingType?: string | null
  disabled?: boolean
}

const ALL_DOC_TYPES = [...REQUIRED_PP_DOCUMENTS, ...OPTIONAL_PP_DOCUMENTS]

export function DocumentosStepForm({ snapshot, onUpload, onRemove, uploadingType, disabled }: Props) {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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
    <div id="credentialing-step-form" className="grid gap-3 sm:grid-cols-1 xl:grid-cols-2">
      {ALL_DOC_TYPES.map((type) => {
        const doc = docByType.get(type)
        const required = (REQUIRED_PP_DOCUMENTS as readonly string[]).includes(type)
        const uploading = uploadingType === type

        return (
          <div
            key={type}
            className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-muted/20 p-4 sm:flex-row sm:items-center xl:flex-col xl:items-stretch"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {professionalDocumentTypeLabels[type] ?? type}
                {required && <span className="text-destructive ml-1">*</span>}
              </p>
              {doc ? (
                <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
              ) : (
                <p className="text-xs text-muted-foreground">PDF, JPEG ou PNG · máx. 10 MB</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 sm:ml-auto xl:ml-0 xl:justify-end">
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
                    onChange={(e) => void handleFile(type, e)}
                  />
                  <Button
                    type="button"
                    variant={doc ? 'outline' : 'default'}
                    size="sm"
                    disabled={uploading}
                    onClick={() => inputRefs.current[type]?.click()}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    {uploading ? 'Enviando…' : doc ? 'Substituir' : 'Enviar'}
                  </Button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function isDocumentosStepValid(snapshot: CredentialingSnapshot): boolean {
  const types = new Set(snapshot.documents.map((d) => d.document_type))
  return REQUIRED_PP_DOCUMENTS.every((t) => types.has(t))
}
