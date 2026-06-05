import { maskCepInput, maskCpfInput, maskPhoneInput } from '@/lib/formatters'

export type MaskType = 'cpf' | 'phone' | 'cep' | 'none'

export function applyMask(type: MaskType, value: string): string {
  switch (type) {
    case 'cpf':
      return maskCpfInput(value)
    case 'phone':
      return maskPhoneInput(value)
    case 'cep':
      return maskCepInput(value)
    default:
      return value
  }
}
