import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { recordLegalAcceptance } from '@/services/legalDocuments'

const STORAGE_KEY = 'larsana_cookie_consent'

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      setVisible(!stored)
    } catch {
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  const save = (value: 'essential' | 'all') => {
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // ignore
    }
    setVisible(false)
  }

  const acceptAll = async () => {
    try {
      await recordLegalAcceptance('POLITICA_COOKIES', { contextType: 'registration' })
    } catch {
      // banner não bloqueia uso se RPC falhar (ex.: anon)
    }
    save('all')
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur px-4 py-4 shadow-lg">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Utilizamos cookies essenciais e, com seu consentimento, cookies analíticos. Consulte a{' '}
          <a href="/politica-de-cookies" className="text-primary underline-offset-2 hover:underline">
            Política de Cookies
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => save('essential')}>
            Apenas essenciais
          </Button>
          <Button size="sm" onClick={() => void acceptAll()}>
            Aceitar todos
          </Button>
        </div>
      </div>
    </div>
  )
}
