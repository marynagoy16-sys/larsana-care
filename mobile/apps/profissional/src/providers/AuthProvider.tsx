import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { UserProfile } from '@larsana/shared'
import { supabase } from '@/lib/supabase'

interface AuthContextValue {
  session: Session | null
  profile: UserProfile | null
  role: UserProfile['primary_role'] | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

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

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!mounted) return
      setSession(s)
      if (s?.user?.id) {
        const p = await fetchProfile(s.user.id)
        if (mounted) setProfile(p)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      if (s?.user?.id) {
        const p = await fetchProfile(s.user.id)
        setProfile(p)
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
    const { error, data } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    if (data.user?.id) {
      const p = await fetchProfile(data.user.id)
      setProfile(p)
    }

    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
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

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
