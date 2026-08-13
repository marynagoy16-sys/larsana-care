import { CreditCard } from 'lucide-react'
import { PPAccountSubpageHeader } from '@/components/profissional/account/PPAccountSubpageHeader'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'

export function PPCartaoPage() {
  return (
    <>
      <PPAccountSubpageHeader title="Cartão de visita" />

      <CrudScrollPageLayout>
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-5 py-10 text-center pb-8">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
            <CreditCard className="size-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">Cartão digital em breve</p>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            Em breve você poderá compartilhar suas informações profissionais com pacientes e famílias.
          </p>
        </div>
      </CrudScrollPageLayout>
    </>
  )
}
