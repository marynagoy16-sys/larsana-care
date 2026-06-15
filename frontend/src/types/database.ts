import type { Database as GeneratedDatabase } from './database.types.generated'
import type { AcademyDatabaseFunctions, AcademyDatabaseTables } from './database.academy.extension'

export type { Json, Tables, TablesInsert, TablesUpdate, Enums } from './database.types.generated'

export type Database = Omit<GeneratedDatabase, 'public'> & {
  public: Omit<GeneratedDatabase['public'], 'Tables' | 'Functions'> & {
    Tables: GeneratedDatabase['public']['Tables'] & AcademyDatabaseTables
    Functions: GeneratedDatabase['public']['Functions'] & AcademyDatabaseFunctions
  }
}
