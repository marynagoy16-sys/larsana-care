import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/types/auth'
import { AuthContext, type AuthContextValue } from '@/providers/auth-context'
import { cancelAccountDeletionOnLogin } from '@/services/accountDeletion'

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, primary_role, is_active')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data as UserProfile
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    const { data: { session: current } } = await supabase.auth.getSession()
    if (!current?.user?.id) {
      setProfile(null)
      return
    }
    const p = await fetchProfile(current.user.id)
    setProfile(p)
  }

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return
      setSession(s)
      if (s?.user?.id) {
        fetchProfile(s.user.id).then((p) => {
          if (mounted) setProfile(p)
        })
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s?.user?.id) {
        fetchProfile(s.user.id).then(setProfile)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    // Login explícito cancela automaticamente uma solicitação de exclusão pendente.
    let deletionCancelled = false
    try {
      const result = await cancelAccountDeletionOnLogin()
      deletionCancelled = result?.cancelled === true
    } catch {
      // Não bloqueia o login se a verificação falhar.
    }
    return { error: null, deletionCancelled }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.primary_role ?? null,
      loading,
      signIn,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
