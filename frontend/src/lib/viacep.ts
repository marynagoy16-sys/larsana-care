export type ViaCepAddress = {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export async function fetchViaCep(postalCode: string): Promise<ViaCepAddress | null> {
  const digits = postalCode.replace(/\D/g, '')
  if (digits.length !== 8) return null

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
  if (!response.ok) return null

  const data = (await response.json()) as ViaCepAddress
  if (data.erro) return null
  return data
}
