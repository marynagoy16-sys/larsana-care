import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from 'next-themes'
import { Monitor, Moon, Sun } from 'lucide-react'
import { PacienteSubpageShell } from '@/components/paciente/PacienteSubpageShell'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ThemeOption = 'light' | 'dark' | 'system'

const THEME_OPTIONS: {
  value: ThemeOption
  label: string
  description: string
  icon: typeof Sun
}[] = [
  {
    value: 'light',
    label: 'Claro',
    description: 'Fundo claro e textos escuros',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Escuro',
    description: 'Fundo escuro e textos claros',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'Sistema',
    description: 'Segue a preferência do dispositivo',
    icon: Monitor,
  },
]

function resolveThemeLabel(theme: ThemeOption | undefined, resolvedTheme: string | undefined) {
  if (theme === 'system') return 'Sistema'
  if (theme === 'dark' || resolvedTheme === 'dark') return 'Escuro'
  return 'Claro'
}

export function PacienteAparenciaPage() {
  const navigate = useNavigate()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [initialTheme, setInitialTheme] = useState<ThemeOption>('light')
  const [draftTheme, setDraftTheme] = useState<ThemeOption>('light')

  useEffect(() => {
    setMounted(true)
    const current = (theme ?? 'light') as ThemeOption
    setInitialTheme(current)
    setDraftTheme(current)
  }, [theme])

  const goBack = () => navigate('/paciente/conta')

  const handleSave = () => {
    setTheme(draftTheme)
    goBack()
  }

  const handleCancel = () => {
    setDraftTheme(initialTheme)
    goBack()
  }

  if (!mounted) {
    return (
      <PacienteSubpageShell title="Aparência" onBack={handleCancel} loading>
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </PacienteSubpageShell>
    )
  }

  return (
    <PacienteSubpageShell title="Aparência" onBack={handleCancel}>
      <div className="space-y-5 pb-8">
        <p className="text-sm text-muted-foreground">
          Tema atual: {resolveThemeLabel(initialTheme, resolvedTheme)}
        </p>

          <div className="space-y-2">
            {THEME_OPTIONS.map(({ value, label, description, icon: Icon }) => {
              const selected = draftTheme === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDraftTheme(value)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-4 py-4 text-left transition-colors',
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-card hover:bg-muted/40',
                  )}
                >
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-full',
                      selected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  </div>
                  <span
                    className={cn(
                      'size-4 shrink-0 rounded-full border-2',
                      selected ? 'border-primary bg-primary' : 'border-muted-foreground/40',
                    )}
                    aria-hidden
                  />
                </button>
              )
            })}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button className="w-full h-12 lg:h-10" onClick={handleSave} disabled={draftTheme === initialTheme}>
              Salvar
            </Button>
            <Button variant="outline" className="w-full h-12 lg:h-10" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        </div>
    </PacienteSubpageShell>
  )
}

export function getThemeDescription(theme: ThemeOption | undefined, resolvedTheme: string | undefined) {
  if (theme === 'system') return 'Segue o sistema'
  if (theme === 'dark' || resolvedTheme === 'dark') return 'Modo escuro ativo'
  return 'Modo claro ativo'
}
