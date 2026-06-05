import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CrudModal } from '@/components/crud/CrudModal'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FormActions } from '@/components/crud/FormActions'
import { patientDocumentTypeLabels } from '@/constants/labels'
import { useUploadPatientDocument } from '@/hooks/mutations/usePatientSubMutations'
import type { Tables } from '@/types/database'

const schema = z.object({
  document_type: z.enum(['RG', 'LAUDO', 'EXAME', 'OUTRO']),
})

interface DocumentUploadModalProps {
  patientId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DocumentUploadModal({ patientId, open, onOpenChange }: DocumentUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const mutation = useUploadPatientDocument(patientId)
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { document_type: 'OUTRO' },
  })

  return (
    <CrudModal open={open} onOpenChange={onOpenChange} title="Enviar documento" size="md">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(async (values) => {
            if (!file) {
              form.setError('document_type', { message: 'Selecione um arquivo' })
              return
            }
            await mutation.mutateAsync({
              file,
              document_type: values.document_type as Tables<'patient_documents'>['document_type'],
            })
            setFile(null)
            onOpenChange(false)
          })}
          className="space-y-4"
        >
          <FormField control={form.control} name="document_type" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {Object.entries(patientDocumentTypeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormItem>
            <FormLabel>Arquivo (PDF, JPEG, PNG — máx. 10 MB)</FormLabel>
            <FormControl>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </FormControl>
          </FormItem>
          <FormActions onCancel={() => onOpenChange(false)} isSubmitting={mutation.isPending} submitLabel="Enviar" />
        </form>
      </Form>
    </CrudModal>
  )
}
