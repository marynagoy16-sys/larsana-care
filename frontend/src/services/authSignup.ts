import { supabase } from '@/lib/supabase'
import { digitsOnly, sanitizeEmail } from '@/lib/sanitize'

export type SignupAccountType = 'paciente' | 'pp'

export type PpProfession = 'FISIO' | 'NUTI' | 'MED' | 'CUID' | 'FONO'

export const PP_PROFESSION_OPTIONS: { value: PpProfession; label: string }[] = [
  { value: 'FISIO', label: 'Fisioterapia' },
  { value: 'NUTI', label: 'Nutrição' },
  { value: 'MED', label: 'Medicina' },
  { value: 'CUID', label: 'Cuidador' },
  { value: 'FONO', label: 'Fonoaudiologia' },
]

export type SignupPayload = {
  accountType: SignupAccountType
  fullName: string
  email: string
  password: string
  cpf?: string
  profession?: PpProfession
  referralCode?: string
}

export async function signUpAccount(payload: SignupPayload): Promise<void> {
  const fullName = payload.fullName.trim()
  const email = sanitizeEmail(payload.email)

  if (!fullName || !email || !payload.password) {
    throw new Error('Preencha todos os campos obrigatórios.')
  }

  const metadata: Record<string, string> = {
    full_name: fullName,
    primary_role: payload.accountType === 'pp' ? 'pp' : 'paciente',
  }

  if (payload.accountType === 'pp') {
    const cpf = digitsOnly(payload.cpf ?? '')
    if (cpf.length !== 11) {
      throw new Error('Informe um CPF válido com 11 dígitos.')
    }
    metadata.cpf_cnpj = cpf
    metadata.profession = payload.profession ?? 'FISIO'
    const referral = payload.referralCode?.trim()
    if (referral) metadata.referral_code = referral
  }

  const { error } = await supabase.auth.signUp({
    email,
    password: payload.password,
    options: { data: metadata },
  })

  if (error) throw error
}
