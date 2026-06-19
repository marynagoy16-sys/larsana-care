import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FileSignature } from 'lucide-react'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import { contratoAcceptSchema, type ContratoAcceptValues } from '@/schemas/credentialing'
import { PP_LEGAL_TERM_TYPES, type CredentialingSnapshot } from '@/lib/credentialingModel'

type LegalTerm = {
  id: string
  term_type: string
  title: string
  version: string
}

type Props = {
  snapshot: CredentialingSnapshot
  legalTerms: LegalTerm[]
  onSubmit: (values: ContratoAcceptValues) => Promise<void>
  disabled?: boolean
}

const termLabels: Record<string, string> = {
  DIRETRIZES_PP: 'Diretrizes e Termos de Uso — Profissional Parceiro',
  LGPD_PP: 'Política de Privacidade (LGPD) — Profissional Parceiro',
}

export function ContratoStepForm({ snapshot, legalTerms, onSubmit, disabled }: Props) {
  const form = useForm<ContratoAcceptValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(contratoAcceptSchema) as any,
    defaultValues: {
      acceptDiretrizes: snapshot.acceptedTermTypes.includes('DIRETRIZES_PP'),
      acceptLgpd: snapshot.acceptedTermTypes.includes('LGPD_PP'),
      acceptContract: snapshot.contract?.status === 'assinado' || snapshot.contract?.status === 'aprovado',
    },
    mode: 'onChange',
  })

  const contractNumber = snapshot.contract?.contract_number

  return (
    <Form {...form}>
      <form id="credentialing-step-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2 lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <FileSignature className="h-4 w-4 text-primary" />
              Contrato LRS-PROF
            </div>
            <p className="text-sm text-muted-foreground">
              {contractNumber
                ? `Número: ${contractNumber}. Contrato gerado com seus dados no ANEXO I.`
                : 'Ao enviar, geramos automaticamente o contrato LRS-PROF com seus dados no ANEXO I.'}
            </p>
          </div>

          {legalTerms.map((term) => {
          const fieldName = term.term_type === 'DIRETRIZES_PP' ? 'acceptDiretrizes' : 'acceptLgpd'
          if (!PP_LEGAL_TERM_TYPES.includes(term.term_type as typeof PP_LEGAL_TERM_TYPES[number])) return null

          return (
            <FormField
              key={term.id}
              control={form.control}
              name={fieldName as 'acceptDiretrizes' | 'acceptLgpd'}
              render={({ field }) => (
                <FormItem className="flex h-full items-start gap-3 rounded-lg border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value === true}
                      onCheckedChange={(v) => field.onChange(v === true)}
                      disabled={disabled}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="text-sm font-medium leading-snug cursor-pointer">
                      {termLabels[term.term_type] ?? term.title}
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">Versão {term.version}</p>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          )
        })}

        {legalTerms.length === 0 && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Termos legais ainda não publicados pela Larsana. A gestão configurará em Configurações → Termos.
          </p>
        )}

        <FormField
          control={form.control}
          name="acceptContract"
          render={({ field }) => (
            <FormItem className="flex items-start gap-3 rounded-lg border p-4 lg:col-span-2">
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
        </div>
      </form>
    </Form>
  )
}
