import {
  bulkImportPatients,
  PATIENT_IMPORT_TEMPLATE,
} from '@/services/bulkImport'
import { AdminImportPage } from '@/pages/admin/import/AdminImportPage'

export function AdminImportPatientsPage() {
  return (
    <AdminImportPage
      title="Importar pacientes"
      description="Importação de pacientes legados via CSV. Campos obrigatórios: full_name. Região (region_code) e endereço recomendados para demandas."
      templateCsv={PATIENT_IMPORT_TEMPLATE}
      templateFilename="modelo_importacao_pacientes.csv"
      importFn={bulkImportPatients}
    />
  )
}
