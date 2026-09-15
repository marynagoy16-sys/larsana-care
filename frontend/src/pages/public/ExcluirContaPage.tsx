import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/shared/Logo'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  )
}

export function ExcluirContaPage() {
  return (
    <div className="min-h-dvh bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex justify-center">
          <Logo layout="horizontal" adaptToTheme style="v1" size="sm" subtitle="Fisioterapia Domiciliar" />
        </div>

        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Voltar ao login
        </Link>

        <div className="space-y-2">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Exclusão de conta — LarsanaCare
          </h1>
          <p className="text-sm text-muted-foreground">
            Esta página explica como solicitar a exclusão da sua conta do aplicativo LarsanaCare
            (fisioterapia domiciliar), o que acontece com os seus dados e os prazos envolvidos.
          </p>
        </div>

        <div className="space-y-6 rounded-xl border border-border bg-card px-4 py-5 sm:px-6 sm:py-6">
          <Section title="Como solicitar a exclusão">
            <p>Você pode solicitar a exclusão da sua conta de duas formas:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>No aplicativo:</strong> acesse <em>Conta</em> (paciente) ou{' '}
                <em>Perfil</em> (profissional parceiro) e toque em{' '}
                <em>“Solicitar exclusão da conta”</em>. Será exibido um aviso e será pedida uma
                confirmação explícita.
              </li>
              <li>
                <strong>Por e-mail:</strong> caso não consiga acessar o app, escreva para{' '}
                <a
                  href="mailto:contato@larsanacare.com.br"
                  className="font-medium text-primary hover:underline"
                >
                  contato@larsanacare.com.br
                </a>{' '}
                a partir do e-mail cadastrado, pedindo a exclusão da conta.
              </li>
            </ul>
          </Section>

          <Section title="Período de carência de 30 dias">
            <p>
              A exclusão <strong>não é imediata</strong>. Ao solicitar, a remoção é{' '}
              <strong>programada para 30 dias depois</strong> da solicitação. Durante esse período a
              conta continua existindo normalmente.
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Você pode cancelar a exclusão a qualquer momento dentro desses 30 dias.</li>
              <li>
                Se você <strong>fizer login novamente</strong> antes da data programada, a
                solicitação é <strong>cancelada automaticamente</strong> e a conta é mantida.
              </li>
              <li>
                Uma nova solicitação de exclusão <strong>reinicia</strong> o prazo de 30 dias do
                zero.
              </li>
            </ul>
          </Section>

          <Section title="O que é excluído">
            <p>Após o período de carência, os dados pessoais da conta são removidos ou anonimizados:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Dados de acesso e identificação (nome, e-mail, avatar) são anonimizados.</li>
              <li>Telefone, CPF e dados de contato do responsável/profissional são removidos.</li>
              <li>Notificações, mensagens de chat e chamados de suporte são apagados.</li>
              <li>Dados bancários do profissional parceiro são removidos.</li>
              <li>
                O acesso é permanentemente desativado. Contas sem qualquer histórico de atendimento
                ou financeiro são totalmente excluídas, inclusive do sistema de autenticação.
              </li>
            </ul>
          </Section>

          <Section title="O que pode ser anonimizado ou retido">
            <p>
              Alguns registros <strong>não podem ser simplesmente apagados</strong> porque estão
              sujeitos a obrigações legais, regulatórias, contábeis/fiscais ou de guarda de
              prontuário. Nesses casos, os dados são mantidos de forma dissociada da sua
              identidade sempre que possível:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                <strong>Registros clínicos / prontuário</strong> (avaliações, sessões, evoluções):
                retidos conforme a legislação profissional aplicável.
              </li>
              <li>
                <strong>Registros financeiros e fiscais</strong> (cobranças, recibos, repasses,
                notas): retidos conforme a legislação fiscal/contábil.
              </li>
              <li>
                <strong>Registros de consentimento e contratos</strong> (aceites de termos,
                contratos de credenciamento): retidos como comprovação legal.
              </li>
            </ul>
          </Section>

          <Section title="Prazos e motivos de retenção">
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-amber-700 dark:text-amber-400">
              <strong>PENDENTE DE VALIDAÇÃO JURÍDICA.</strong> Os prazos exatos de retenção de
              prontuários, registros fiscais e comprovações legais dependem da legislação aplicável
              e ainda serão confirmados pela assessoria jurídica da LarsanaCare. Até a validação,
              esses registros são mantidos apenas pelo tempo necessário ao cumprimento das
              obrigações legais e, depois disso, anonimizados ou eliminados.
            </p>
          </Section>

          <Section title="Dúvidas">
            <p>
              Para dúvidas sobre exclusão de conta ou tratamento de dados pessoais, entre em contato
              pelo e-mail{' '}
              <a
                href="mailto:contato@larsanacare.com.br"
                className="font-medium text-primary hover:underline"
              >
                contato@larsanacare.com.br
              </a>
              .
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}
