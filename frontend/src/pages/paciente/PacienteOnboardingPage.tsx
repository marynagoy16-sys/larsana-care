import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ZodError } from 'zod'
import { toast } from 'sonner'
import { LegalTermAcceptanceStepForm } from '@/components/legal/LegalTermAcceptanceStepForm'
import { PATIENT_ONBOARDING_TERM_TYPES } from '@/constants/legalTerms'
import type { LegalTermType } from '@/constants/legalTerms'
import { CityRegionFields } from '@/components/forms/CityRegionFields'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'
import { softFieldButtonClass, softFieldInputClass, softFieldLabelClass } from '@/lib/formFieldStyles'
import { formatCep, formatPhone } from '@/lib/formatters'
import { fetchViaCep } from '@/lib/viacep'
import { mapSupabaseError } from '@/lib/supabase-errors'
import { patientOnboardingSchema } from '@/schemas/patientOnboarding'
import { completePatientOnboarding } from '@/services/patientOnboarding'
import { loadCurrentLegalTerms, recordLegalAcceptances } from '@/services/legalDocuments'
import { findCityByNameAndState } from '@/services/regions'
import { sanitizeCep, sanitizePhone } from '@/lib/sanitize'

export function PacienteOnboardingPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [patientFullName, setPatientFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [cityId, setCityId] = useState('')
  const [regionId, setRegionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [allTermsChecked, setAllTermsChecked] = useState(false)

  const legalTermsQuery = useQuery({
    queryKey: ['paciente', 'onboarding-legal-terms'],
    queryFn: () => loadCurrentLegalTerms(PATIENT_ONBOARDING_TERM_TYPES),
  })

  useEffect(() => {
    if (profile?.full_name && !patientFullName) {
      setPatientFullName(profile.full_name)
    }
  }, [profile?.full_name, patientFullName])

  const handleCepBlur = async () => {
    const digits = sanitizeCep(postalCode)
    if (digits.length !== 8) return

    setCepLoading(true)
    try {
      const address = await fetchViaCep(digits)
      if (!address) return

      if (address.logradouro) setStreet(address.logradouro)
      if (address.bairro) setNeighborhood(address.bairro)

      const city = await findCityByNameAndState(address.localidade, address.uf)
      if (city) {
        setCityId(city.id)
        setRegionId(city.region_id)
      }
    } catch {
      // preenchimento manual continua disponível
    } finally {
      setCepLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allTermsChecked) {
      toast.error('Aceite todos os termos obrigatórios para continuar.')
      return
    }

    setLoading(true)

    try {
      const parsed = patientOnboardingSchema.parse({
        patientFullName,
        phone,
        street,
        number,
        complement,
        neighborhood,
        postalCode,
        cityId,
        regionId,
      })

      await recordLegalAcceptances(PATIENT_ONBOARDING_TERM_TYPES, 'onboarding')
      await completePatientOnboarding(parsed)
      toast.success('Cadastro concluído! Agora você pode solicitar atendimento.')
      navigate('/paciente/solicitar', { replace: true })
    } catch (err) {
      if (err instanceof ZodError) {
        toast.error(err.issues[0]?.message ?? 'Verifique os campos do formulário.')
      } else {
        toast.error(mapSupabaseError(err instanceof Error ? err : null))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <PageHeader>
        <h1 className="font-display text-xl font-bold">Complete seu cadastro</h1>
      </PageHeader>

      <CrudScrollPageLayout>
        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-lg space-y-5 pb-10">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Precisamos de alguns dados para encontrar um profissional parceiro na sua região.
          </p>

          <div className="space-y-2">
            <Label htmlFor="patientFullName" className={softFieldLabelClass}>
              Nome do paciente
            </Label>
            <Input
              id="patientFullName"
              value={patientFullName}
              onChange={(e) => setPatientFullName(e.target.value)}
              placeholder="Nome de quem receberá o atendimento"
              autoComplete="name"
              disabled={loading}
              required
              className={softFieldInputClass}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className={softFieldLabelClass}>
              Telefone de contato
            </Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(formatPhone(sanitizePhone(e.target.value)))}
              placeholder="(11) 99999-9999"
              autoComplete="tel"
              inputMode="tel"
              disabled={loading}
              required
              className={softFieldInputClass}
            />
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">Endereço do atendimento</p>

            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor="postalCode" className={softFieldLabelClass}>
                  CEP
                </Label>
                <Input
                  id="postalCode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(formatCep(sanitizeCep(e.target.value)))}
                  onBlur={() => void handleCepBlur()}
                  placeholder="00000-000"
                  inputMode="numeric"
                  disabled={loading || cepLoading}
                  required
                  className={softFieldInputClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street" className={softFieldLabelClass}>
                Rua
              </Label>
              <Input
                id="street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                disabled={loading}
                required
                className={softFieldInputClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="number" className={softFieldLabelClass}>
                  Número
                </Label>
                <Input
                  id="number"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  disabled={loading}
                  required
                  className={softFieldInputClass}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complement" className={softFieldLabelClass}>
                  Complemento
                </Label>
                <Input
                  id="complement"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  disabled={loading}
                  className={softFieldInputClass}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="neighborhood" className={softFieldLabelClass}>
                Bairro
              </Label>
              <Input
                id="neighborhood"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                disabled={loading}
                required
                className={softFieldInputClass}
              />
            </div>

            <CityRegionFields
              cityId={cityId}
              regionId={regionId}
              onCityChange={(nextCityId, nextRegionId) => {
                setCityId(nextCityId)
                setRegionId(nextRegionId)
              }}
              disabled={loading || cepLoading}
              hideRegion
            />
          </div>

          <LegalTermAcceptanceStepForm
            title="Termos obrigatórios"
            description="Antes de solicitar atendimento, aceite os documentos abaixo."
            termTypes={PATIENT_ONBOARDING_TERM_TYPES}
            legalTerms={legalTermsQuery.data ?? []}
            acceptedTermTypes={[]}
            onAccept={async (types: LegalTermType[]) => {
              await recordLegalAcceptances(types, 'onboarding')
            }}
            disabled={loading}
            showSubmitButton={false}
            onAllCheckedChange={setAllTermsChecked}
          />

          <Button type="submit" className={softFieldButtonClass} disabled={loading || !allTermsChecked}>
            {loading ? 'Salvando...' : 'Continuar para solicitar atendimento'}
          </Button>
        </form>
      </CrudScrollPageLayout>
    </>
  )
}
