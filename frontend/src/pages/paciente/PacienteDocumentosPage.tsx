import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { PacienteEmptyState, PacienteSubpageShell } from '@/components/paciente/PacienteSubpageShell'
import { patientDocumentTypeLabels } from '@/constants/labels'
import { formatDate } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'

type DocumentRow = {
  id: string
  document_type: string
  file_name: string
  created_at: string
}

export function PacienteDocumentosPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['paciente', 'documents-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_documents')
        .select('id, document_type, file_name, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as DocumentRow[]
    },
  })

  const documents = Array.isArray(data) ? data : []

  return (
    <PacienteSubpageShell loading={isLoading}>
      <div className="space-y-4 pb-8">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Documentos</h2>
          <p className="text-sm text-muted-foreground mt-1">Termos aceitos, comprovantes e recibos</p>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando documentos…</p>
        ) : documents.length === 0 ? (
          <PacienteEmptyState message="Nenhum documento disponível no momento." />
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-4"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="size-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{doc.file_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {patientDocumentTypeLabels[doc.document_type] ?? doc.document_type}
                    {' · '}
                    {formatDate(doc.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PacienteSubpageShell>
  )
}
