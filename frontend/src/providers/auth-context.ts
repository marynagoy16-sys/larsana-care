import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { UserProfile, UserRole } from '@/types/auth'

export interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  role: UserRole | null
  loading: boolean
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; deletionCancelled?: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
