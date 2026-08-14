import { supabase } from '@/lib/supabase'

const PATIENT_DOCS_BUCKET = 'patient-documents'
const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']

export async function getPatientIdForCurrentUser(): Promise<string | null> {
  const { data, error } = await supabase
    .from('patient_responsibles')
    .select('patient_id')
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.patient_id ?? null
}

export async function resolvePatientAvatarUrl(avatarPath: string | null | undefined): Promise<string | null> {
  if (!avatarPath) return null
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) return avatarPath

  const { data, error } = await supabase.storage
    .from(PATIENT_DOCS_BUCKET)
    .createSignedUrl(avatarPath, 3600)

  if (error) throw error
  return data.signedUrl
}

export async function uploadPatientAvatar(file: File, patientId: string, userId: string): Promise<string> {
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new Error('Use uma imagem JPG, PNG ou WebP.')
  }
  if (file.size > MAX_AVATAR_SIZE) {
    throw new Error('A imagem deve ter no máximo 5 MB.')
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const storagePath = `${patientId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(PATIENT_DOCS_BUCKET)
    .upload(storagePath, file, { upsert: true, contentType: file.type })

  if (uploadError) throw uploadError

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: storagePath })
    .eq('id', userId)

  if (profileError) throw profileError

  return storagePath
}
