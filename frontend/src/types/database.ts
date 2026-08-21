import type { Database as GeneratedDatabase } from './database.types.generated'

export type { Json, Tables, TablesInsert, TablesUpdate, Enums } from './database.types.generated'

type ProfessionalsTable = GeneratedDatabase['public']['Tables']['professionals']

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

export type Database = Omit<GeneratedDatabase, 'public'> & {
  public: Omit<GeneratedDatabase['public'], 'Tables'> & {
    Tables: Omit<GeneratedDatabase['public']['Tables'], 'professionals'> & {
      professionals: PatchedProfessionalsTable
    }
  }
}
