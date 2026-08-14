import { supabase } from '@/lib/supabase'
import type { PpProfileValues } from '@/schemas/ppProfile'

const PROFESSIONAL_DOCS_BUCKET = 'professional-documents'
const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

export async function getProfessionalIdForCurrentUser(): Promise<string | null> {
  const { data, error } = await supabase.rpc('current_professional_id')
  if (error) throw error
  return data ?? null
}

export async function resolveProfessionalAvatarUrl(avatarPath: string | null | undefined): Promise<string | null> {
  if (!avatarPath) return null
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) return avatarPath

  const { data, error } = await supabase.storage
    .from(PROFESSIONAL_DOCS_BUCKET)
    .createSignedUrl(avatarPath, 3600)

  if (error) throw error
  return data.signedUrl
}

export async function uploadProfessionalAvatar(file: File, professionalId: string, userId: string): Promise<string> {
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error('Use uma imagem JPG, PNG ou WebP.')
  }
  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error('A imagem deve ter no máximo 5 MB.')
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const storagePath = `${professionalId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(PROFESSIONAL_DOCS_BUCKET)
    .upload(storagePath, file, { upsert: true, contentType: file.type })

  if (uploadError) throw uploadError

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: storagePath })
    .eq('id', userId)

  if (profileError) throw profileError

  return storagePath
}

export async function savePpProfile(values: PpProfileValues): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão expirada')

  const professionalId = await getProfessionalIdForCurrentUser()
  if (!professionalId) throw new Error('Profissional não encontrado')

  const { error: proError } = await supabase
    .from('professionals')
    .update({
      full_name: values.full_name,
      email: values.email,
      profession: values.profession,
    })
    .eq('id', professionalId)

  if (proError) throw proError

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      full_name: values.full_name,
      email: values.email,
    })
    .eq('id', user.id)

  if (profileError) throw profileError
}
