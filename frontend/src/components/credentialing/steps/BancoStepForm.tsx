import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MaskedInput } from '@/components/forms/MaskedInput'
import { ASAAS_SIGNUP_URL, ASAAS_WALLET_HELP } from '@/constants/asaas'
import { bancoStepSchema, type BancoStepValues } from '@/schemas/credentialing'
import type { CredentialingSnapshot } from '@/lib/credentialingModel'

type Props = {
  snapshot: CredentialingSnapshot
  onSubmit: (values: BancoStepValues) => Promise<void>
  disabled?: boolean
}

function toDefaultValues(snapshot: CredentialingSnapshot): BancoStepValues {
  const bank = snapshot.bank
  return {
    bank_code: bank?.bank_code ?? undefined,
    bank_name: bank?.bank_name ?? '',
    agency: bank?.agency ?? '',
    account_number: bank?.account_number ?? '',
    account_type: (bank?.account_type as BancoStepValues['account_type']) ?? 'corrente',
    pix_key: bank?.pix_key ?? '',
    holder_name: bank?.holder_name ?? '',
    holder_document: bank?.holder_document ?? '',
    asaas_wallet_id: snapshot.professional.asaas_wallet_id ?? '',
  }
}

export function BancoStepForm({ snapshot, onSubmit, disabled }: Props) {
  const form = useForm<BancoStepValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(bancoStepSchema) as any,
    defaultValues: toDefaultValues(snapshot),
    mode: 'onBlur',
  })

  return (
    <Form {...form}>
      <form id="credentialing-step-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="bank_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Banco</FormLabel>
                <FormControl><Input {...field} disabled={disabled} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bank_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código (opcional)</FormLabel>
                <FormControl><Input {...field} disabled={disabled} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="agency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agência</FormLabel>
                <FormControl><Input {...field} disabled={disabled} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="account_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conta</FormLabel>
                <FormControl><Input {...field} disabled={disabled} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="account_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={disabled}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="corrente">Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="pix_key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chave PIX</FormLabel>
              <FormControl><Input {...field} disabled={disabled} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="holder_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titular da conta</FormLabel>
                <FormControl><Input {...field} disabled={disabled} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="holder_document"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF/CNPJ do titular</FormLabel>
                <FormControl>
                  <MaskedInput mask="cpf_cnpj" value={field.value} onChange={field.onChange} disabled={disabled} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="asaas_wallet_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wallet ID Asaas</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} disabled={disabled} placeholder="Cole o wallet ID da sua conta" />
              </FormControl>
              <p className="text-xs text-muted-foreground">{ASAAS_WALLET_HELP}</p>
              <a href={ASAAS_SIGNUP_URL} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                Criar conta no Asaas
              </a>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
