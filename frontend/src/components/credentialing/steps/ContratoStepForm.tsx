import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileSignature } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { contratoAcceptSchema, type ContratoAcceptValues } from '@/schemas/credentialing'
import type { CredentialingSnapshot } from '@/lib/credentialingModel'

type Props = {
  snapshot: CredentialingSnapshot
  onSubmit: (values: ContratoAcceptValues) => Promise<void>
  disabled?: boolean
}

export function ContratoStepForm({ snapshot, onSubmit, disabled }: Props) {
  const form = useForm<ContratoAcceptValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(contratoAcceptSchema) as any,
    defaultValues: {
      acceptContract:
        snapshot.contract?.status === 'assinado' || snapshot.contract?.status === 'aprovado',
    },
    mode: 'onChange',
  })

  const contractNumber = snapshot.contract?.contract_number

  return (
    <Form {...form}>
      <form id="credentialing-step-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileSignature className="h-4 w-4 text-primary" />
            Contrato LRS-PROF
          </div>
          <p className="text-sm text-muted-foreground">
            {contractNumber
              ? `Número: ${contractNumber}. Contrato gerado com seus dados no ANEXO I.`
              : 'Ao enviar, geramos automaticamente o contrato LRS-PROF com seus dados no ANEXO I.'}
          </p>
          <p className="text-xs text-muted-foreground">
            Termos de uso, privacidade, categorias, sigilo e regras comerciais já foram aceitos nas etapas anteriores.
          </p>
        </div>

        <FormField
          control={form.control}
          name="acceptContract"
          render={({ field }) => (
            <FormItem className="flex items-start gap-3 rounded-lg border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(v) => field.onChange(v === true)}
                  disabled={disabled}
                />
              </FormControl>
              <div className="space-y-1">
                <FormLabel className="text-sm font-medium leading-snug cursor-pointer">
                  Li e aceito o contrato LRS-PROF e autorizo o envio para validação da Larsana Care
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
