import {
  bulkImportProfessionals,
  PROFESSIONAL_IMPORT_TEMPLATE,
} from '@/services/bulkImport'
import { AdminImportPage } from '@/pages/admin/import/AdminImportPage'

export function AdminImportProfessionalsPage() {
  return (
    <AdminImportPage
      title="Importar profissionais"
      description="Importação de PPs legados (patente Bronze recomendada). PPs com conta Asaas existente: preencha asaas_wallet_id (UUID da carteira no painel Asaas). Credenciamento padrão: ativo. Pontos podem ser grandfathered."
      templateCsv={PROFESSIONAL_IMPORT_TEMPLATE}
      templateFilename="modelo_importacao_profissionais.csv"
      importFn={bulkImportProfessionals}
    />
  )
}
