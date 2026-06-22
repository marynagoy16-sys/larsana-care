import type { PostgrestError } from '@supabase/supabase-js'

const CODE_MESSAGES: Record<string, string> = {
  '23505': 'Registro duplicado. Verifique os dados informados.',
  '23503': 'Referência inválida. Um dos campos relacionados não existe.',
  '42501': 'Você não tem permissão para esta operação.',
  'PGRST116': 'Registro não encontrado.',
  'PGRST202': 'Função do banco não disponível. Peça ao administrador para aplicar as migrations pendentes no Supabase.',
  '22P02': 'Formato de dado inválido.',
}

export function mapSupabaseError(error: PostgrestError | Error | null): string {
  if (!error) return 'Erro desconhecido.'
  if ('code' in error && error.code && CODE_MESSAGES[error.code]) {
    return CODE_MESSAGES[error.code]
  }
  return error.message || 'Não foi possível concluir a operação.'
}
