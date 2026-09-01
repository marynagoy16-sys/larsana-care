import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { formatCpf } from '@/lib/formatters'

export type PatientBillingInfo = {
  full_name: string
  cpf: string | null
  full_address: string | null
}

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    toast.success(`${label} copiado`)
  } catch {
    toast.error('Não foi possível copiar')
  }
}

export function PatientBillingCopyCard({ patient }: { patient: PatientBillingInfo | null }) {
  if (!patient) return null

  const lines = [
    { label: 'Nome', value: patient.full_name },
    patient.cpf ? { label: 'CPF', value: formatCpf(patient.cpf) } : null,
    patient.full_address ? { label: 'Endereço', value: patient.full_address } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>

  if (!lines.length) return null

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div>
        <h2 className="font-semibold text-sm">Dados do paciente para NF</h2>
        <p className="text-xs text-muted-foreground">Use estes dados ao emitir a nota fiscal de prestação.</p>
      </div>
      <div className="space-y-2">
        {lines.map((line) => (
          <div key={line.label} className="flex items-start justify-between gap-3 rounded-lg bg-muted/40 px-3 py-2">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{line.label}</p>
              <p className="text-sm break-words">{line.value}</p>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="shrink-0"
              onClick={() => void copyText(line.label, line.value)}
            >
              <Copy className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  )
}
