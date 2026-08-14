import { supabase } from '@/lib/supabase'
import { sanitizeEmail } from '@/lib/sanitize'

export async function requestPasswordReset(email: string): Promise<void> {
  const sanitized = sanitizeEmail(email)
  if (!sanitized) {
    throw new Error('Informe um e-mail válido.')
  }

  const redirectTo = `${window.location.origin}/redefinir-senha`

  const { error } = await supabase.auth.resetPasswordForEmail(sanitized, { redirectTo })
  if (error) throw error
}

export function getPasswordRecoveryHashError(): string | null {
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash) return null

  const params = new URLSearchParams(hash)
  if (!params.get('error')) return null

  return params.get('error_description') ?? params.get('error') ?? 'Link inválido ou expirado.'
}

export function hasPasswordRecoveryHash(): boolean {
  const hash = window.location.hash.replace(/^#/, '')
  if (!hash) return false

  const params = new URLSearchParams(hash)
  return params.get('type') === 'recovery' && !params.get('error')
}

export async function waitForPasswordRecoverySession(): Promise<boolean> {
  if (getPasswordRecoveryHashError()) return false
  if (!hasPasswordRecoveryHash()) return false

  const { data: { session } } = await supabase.auth.getSession()
  if (session) return true

  return new Promise((resolve) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY' && nextSession) {
        window.clearTimeout(timeout)
        subscription.unsubscribe()
        resolve(true)
      }
    })

    const timeout = window.setTimeout(() => {
      subscription.unsubscribe()
      resolve(false)
    }, 8000)
  })
}

export async function updatePassword(password: string): Promise<void> {
  if (password.length < 8) {
    throw new Error('A senha deve ter pelo menos 8 caracteres.')
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error

  await supabase.auth.signOut()
}
