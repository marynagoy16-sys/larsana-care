import { maskCepInput, maskCpfCnpjInput, maskCpfInput, maskPhoneInput } from '@/lib/formatters'

export type MaskType = 'cpf' | 'cpf_cnpj' | 'phone' | 'cep' | 'none'

export function applyMask(type: MaskType, value: string): string {
  switch (type) {
    case 'cpf':
      return maskCpfInput(value)
    case 'cpf_cnpj':
      return maskCpfCnpjInput(value)
    case 'phone':
      return maskPhoneInput(value)
    case 'cep':
      return maskCepInput(value)
    default:
      return value
  }
}
