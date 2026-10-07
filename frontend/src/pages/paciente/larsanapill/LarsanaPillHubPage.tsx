import { useState } from 'react'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ContentHubLayout } from '@/components/content-experience/ContentHubLayout'

const NOTIFY_KEY = 'larsanapill-notify'

export function LarsanaPillHubPage() {
  const [notified, setNotified] = useState(() => localStorage.getItem(NOTIFY_KEY) === '1')

  const askNotify = () => {
    localStorage.setItem(NOTIFY_KEY, '1')
    setNotified(true)
    toast.success('Avisaremos quando o LarsanaPill estiver disponível.')
  }

  return (
    <ContentHubLayout>
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="bg-primary px-6 py-8 text-primary-foreground sm:px-8">
          <Badge className="border-transparent bg-primary-foreground/15 text-primary-foreground">Em breve</Badge>
          <h1 className="mt-4 font-display text-2xl font-bold">LarsanaPill</h1>
        </div>
        <div className="space-y-5 px-6 py-6 sm:px-8">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Em breve, um espaço com protocolo, orientações e materiais práticos para o seu dia a dia. Quer saber quando estiver disponível?
          </p>
          <Button type="button" onClick={askNotify} disabled={notified}>
            <Bell className="size-4" />
            {notified ? 'Avisaremos você' : 'Avise-me'}
          </Button>
        </div>
      </section>
    </ContentHubLayout>
  )
}
