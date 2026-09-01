import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  getPatientReceiptSignedUrl,
  receiptKindLabels,
  uploadAdminIntermediationReceipt,
} from '@/services/patientReceipts'
import { supabase } from '@/lib/supabase'
import { formatDateTime } from '@/lib/formatters'

type ReceiptRow = {
  id: string
  receipt_kind: 'intermediacao' | 'pp_prestacao' | null
  storage_path: string | null
  issued_at: string
}

export function AdminChargeReceiptSection({ chargeId }: { chargeId: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const [uploading, setUploading] = useState(false)

  const { data: receipts = [] } = useQuery({
    queryKey: ['admin', 'charge-receipts', chargeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_receipts')
        .select('id, receipt_kind, storage_path, issued_at')
        .eq('charge_id', chargeId)
        .order('issued_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ReceiptRow[]
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAdminIntermediationReceipt(chargeId, file),
    onSuccess: () => {
      toast.success('NF de intermediação enviada')
      void queryClient.invalidateQueries({ queryKey: ['admin', 'charge-receipts', chargeId] })
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setUploading(false),
  })

  const openReceipt = async (storagePath: string) => {
    try {
      const url = await getPatientReceiptSignedUrl(storagePath)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível abrir o arquivo')
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="space-y-1">
        <h2 className="font-semibold text-sm">Notas fiscais do paciente</h2>
        <p className="text-xs text-muted-foreground">
          Envie a NF de intermediação Larsana. A NF do PP aparece após validação do repasse.
        </p>
      </div>

      {receipts.length ? (
        <ul className="space-y-2 text-sm">
          {receipts.map((receipt) => (
            <li key={receipt.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2">
              <div>
                <p className="font-medium">
                  {receiptKindLabels[receipt.receipt_kind ?? ''] ?? 'Nota fiscal'}
                </p>
                <p className="text-xs text-muted-foreground">{formatDateTime(receipt.issued_at)}</p>
              </div>
              {receipt.storage_path ? (
                <Button type="button" size="sm" variant="outline" onClick={() => void openReceipt(receipt.storage_path!)}>
                  Ver arquivo
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhuma NF vinculada a esta cobrança.</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/jpeg,image/png"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setUploading(true)
          uploadMutation.mutate(file)
          e.target.value = ''
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading || uploadMutation.isPending}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-4 mr-2" />
        Enviar NF intermediação
      </Button>
    </section>
  )
}
