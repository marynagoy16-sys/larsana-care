import type { Database as GeneratedDatabase } from './database.types.generated'
import type { AcademyDatabaseFunctions, AcademyDatabaseTables } from './database.academy.extension'
import type { FinancialDatabaseFunctions, FinancialDatabaseTables } from './database.financial.extension'
import type { GamificationDatabaseFunctions, GamificationDatabaseTables } from './database.gamification.extension'

export type { Json, Tables, TablesInsert, TablesUpdate, Enums } from './database.types.generated'

type ProfessionalsTable = GeneratedDatabase['public']['Tables']['professionals']
type PatchedProfessionalsTable = Omit<ProfessionalsTable, 'Insert' | 'Update'> & {
  Insert: ProfessionalsTable['Insert'] & {
    patient_preferences?: GeneratedDatabase['public']['Enums']['pp_technical_category'][]
    points_total?: number
    patente?: GeneratedDatabase['public']['Enums']['pp_patente']
    referral_code?: string | null
    referral_count_pre_bronze?: number
  }
  Update: ProfessionalsTable['Update'] & {
    patient_preferences?: GeneratedDatabase['public']['Enums']['pp_technical_category'][]
    points_total?: number
    patente?: GeneratedDatabase['public']['Enums']['pp_patente']
    referral_code?: string | null
    referral_count_pre_bronze?: number
  }
}

export type Database = Omit<GeneratedDatabase, 'public'> & {
  public: Omit<GeneratedDatabase['public'], 'Tables' | 'Functions'> & {
    Tables: Omit<GeneratedDatabase['public']['Tables'], 'professionals'> & {
      professionals: PatchedProfessionalsTable
    } & AcademyDatabaseTables & FinancialDatabaseTables & GamificationDatabaseTables
    Functions: Omit<
      GeneratedDatabase['public']['Functions'],
      'review_assessment_level_change'
    > & AcademyDatabaseFunctions &
      FinancialDatabaseFunctions &
      GamificationDatabaseFunctions
  }
}
