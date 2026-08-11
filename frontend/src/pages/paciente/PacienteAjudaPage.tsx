import { Mail, MessageCircle, Phone } from 'lucide-react'
import { PacienteSubpageShell } from '@/components/paciente/PacienteSubpageShell'

const FAQ_ITEMS = [
  {
    question: 'Como pagar meu ciclo de tratamento?',
    answer:
      'Acesse Conta → Pagamentos, escolha a cobrança pendente e siga as instruções de PIX ou boleto. Após a confirmação, as sessões são liberadas automaticamente.',
  },
  {
    question: 'Como solicitar um profissional parceiro?',
    answer:
      'Use a aba Solicitar no menu inferior. Se sua região tiver cobertura, envie o pedido; caso contrário, você pode entrar na lista de espera.',
  },
  {
    question: 'Onde vejo as sessões do tratamento?',
    answer:
      'Na aba Tratamento você acompanha o ciclo atual, sessões realizadas e as próximas visitas agendadas.',
  },
  {
    question: 'Como alterar meus dados de responsável?',
    answer:
      'Em Conta → Perfil você pode atualizar nome, e-mail e telefone do responsável.',
  },
] as const

export function PacienteAjudaPage() {
  return (
    <PacienteSubpageShell>
      <div className="space-y-5 pb-8">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Ajuda</h2>
          <p className="text-sm text-muted-foreground mt-1">Suporte e perguntas frequentes</p>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          <a
            href="mailto:atendimento@larsanacare.com.br"
            className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/40"
          >
            <Mail className="size-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground">E-mail</p>
              <p className="text-sm text-muted-foreground">atendimento@larsanacare.com.br</p>
            </div>
          </a>
          <a href="tel:08001234567" className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-muted/40">
            <Phone className="size-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground">Telefone</p>
              <p className="text-sm text-muted-foreground">0800 123 4567 · Seg–Sex, 8h–18h</p>
            </div>
          </a>
          <div className="flex items-center gap-3 px-4 py-4">
            <MessageCircle className="size-5 shrink-0 text-primary" />
            <div>
              <p className="font-medium text-foreground">WhatsApp</p>
              <p className="text-sm text-muted-foreground">Canal em breve para suporte rápido</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Perguntas frequentes</h3>
          {FAQ_ITEMS.map((item) => (
            <details key={item.question} className="rounded-xl border border-border bg-card px-4 py-3 group">
              <summary className="cursor-pointer font-medium text-sm text-foreground list-none flex items-center justify-between gap-2">
                {item.question}
                <span className="text-muted-foreground text-xs group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </PacienteSubpageShell>
  )
}
