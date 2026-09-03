import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LegalTermAcceptanceStepForm } from '@/components/legal/LegalTermAcceptanceStepForm'
import { PATIENT_ONBOARDING_TERM_TYPES } from '@/constants/legalTerms'
import type { LegalTermType } from '@/constants/legalTerms'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { loadCurrentLegalTerms, recordLegalAcceptances } from '@/services/legalDocuments'
import { useAuth } from '@/hooks/useAuth'

export function PacienteAceitePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [done, setDone] = useState(false)

  const { data: terms = [], isLoading } = useQuery({
    queryKey: ['paciente', 'legal_terms_current', 'onboarding'],
    queryFn: () => loadCurrentLegalTerms(PATIENT_ONBOARDING_TERM_TYPES),
  })

  const handleAccept = async (termTypes: LegalTermType[]) => {
    if (!user?.id) return
    await recordLegalAcceptances(termTypes, 'registration')
    setDone(true)
    navigate('/paciente')
  }

  return (
    <>
      <PageHeader>
        <h1 className="font-display font-bold text-xl">Aceite inicial</h1>
      </PageHeader>

      <CrudScrollPageLayout>
        <div className="space-y-5 pb-8 max-w-2xl">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando termos...</p>
          ) : (
            <LegalTermAcceptanceStepForm
              title="Termos de uso e privacidade"
              termTypes={PATIENT_ONBOARDING_TERM_TYPES}
              legalTerms={terms}
              acceptedTermTypes={done ? [...PATIENT_ONBOARDING_TERM_TYPES] : []}
              onAccept={handleAccept}
              submitLabel="Continuar para o app"
            />
          )}
        </div>
      </CrudScrollPageLayout>
    </>
  )
}
