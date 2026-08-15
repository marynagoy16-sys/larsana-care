import { useRef, useState, type ChangeEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ExternalLink, FileText, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import { mapSupabaseError } from '@/lib/supabase-errors'
import {
  getPPTransferInvoiceSignedUrl,
  uploadPPTransferInvoice,
  type PPRepasseInvoice,
  type TransferStatus,
} from '@/services/ppTransfers'

type RepasseInvoiceSectionProps = {
  transferId: string
  status: TransferStatus
  amountCents: number
  invoice: PPRepasseInvoice | null
  onUploaded: () => void
}

export function RepasseInvoiceSection({
  transferId,
  status,
  amountCents,
  invoice,
  onUploaded,
}: RepasseInvoiceSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [openingInvoice, setOpeningInvoice] = useState(false)

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadPPTransferInvoice(transferId, file, invoice?.storage_path),
    onSuccess: () => {
      toast.success('Nota fiscal enviada. Aguarde a validação da Larsana.')
      onUploaded()
    },
    onError: (error) => {
      toast.error(mapSupabaseError(error))
    },
  })

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    uploadMutation.mutate(file)
  }

  const handleOpenInvoice = async () => {
    if (!invoice?.storage_path) return
    setOpeningInvoice(true)
    try {
      const url = await getPPTransferInvoiceSignedUrl(invoice.storage_path)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      toast.error(mapSupabaseError(error instanceof Error ? error : null))
    } finally {
      setOpeningInvoice(false)
    }
  }

  if (status === 'aguardando_nf') {
    return (
      <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
            <FileText className="size-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="font-medium text-foreground">Enviar nota fiscal</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Emita a NF no valor de{' '}
                <span className="font-medium text-foreground">{formatCurrency(amountCents)}</span>{' '}
                referente a este repasse e anexe o arquivo para liberar o pagamento.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">PDF, JPEG ou PNG · máx. 10 MB</p>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,image/jpeg,image/png"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={uploadMutation.isPending}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="mr-2 size-4" />
              {uploadMutation.isPending ? 'Enviando…' : 'Selecionar arquivo'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (invoice) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Nota fiscal</p>
            <p className="mt-1 truncate font-medium">{invoice.file_name ?? 'Arquivo enviado'}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Enviada em {formatDateTime(invoice.uploaded_at)}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={openingInvoice}
            onClick={() => void handleOpenInvoice()}
          >
            <ExternalLink className="mr-2 size-4" />
            {openingInvoice ? 'Abrindo…' : 'Ver arquivo'}
          </Button>
        </div>
      </div>
    )
  }

  return null
}
