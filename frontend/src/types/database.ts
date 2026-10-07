import type { Database as GeneratedDatabase } from './database.types.generated'

export type { Json, Enums } from './database.types.generated'

type ProfessionalsTable = GeneratedDatabase['public']['Tables']['professionals']
type PatientsTable = GeneratedDatabase['public']['Tables']['patients']

/** Colunas de localização ao vivo (migration 20260818130000 — pode anteceder o schema remoto). */
type PatchedProfessionalsTable = Omit<ProfessionalsTable, 'Row' | 'Insert' | 'Update'> & {
  Row: ProfessionalsTable['Row'] & {
    last_lat: number | null
    last_lng: number | null
    location_updated_at: string | null
  }
  Insert: ProfessionalsTable['Insert'] & {
    last_lat?: number | null
    last_lng?: number | null
    location_updated_at?: string | null
  }
  Update: ProfessionalsTable['Update'] & {
    last_lat?: number | null
    last_lng?: number | null
    location_updated_at?: string | null
  }
}

type PatchedPatientsTable = Omit<PatientsTable, 'Row' | 'Insert' | 'Update'> & {
  Row: PatientsTable['Row'] & { is_active: boolean }
  Insert: PatientsTable['Insert'] & { is_active?: boolean }
  Update: PatientsTable['Update'] & { is_active?: boolean }
}

export type Database = Omit<GeneratedDatabase, 'public'> & {
  public: Omit<GeneratedDatabase['public'], 'Tables'> & {
    Tables: Omit<GeneratedDatabase['public']['Tables'], 'professionals' | 'patients'> & {
      professionals: PatchedProfessionalsTable
      patients: PatchedPatientsTable
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  TableName extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views']),
> = (DefaultSchema['Tables'] & DefaultSchema['Views'])[TableName] extends { Row: infer R } ? R : never

export type TablesInsert<
  TableName extends keyof DefaultSchema['Tables'],
> = DefaultSchema['Tables'][TableName] extends { Insert: infer I } ? I : never

export type TablesUpdate<
  TableName extends keyof DefaultSchema['Tables'],
> = DefaultSchema['Tables'][TableName] extends { Update: infer U } ? U : never
