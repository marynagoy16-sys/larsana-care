import { createClient } from 'jsr:@supabase/supabase-js@2'

export async function requireStaff(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    throw new Error('Não autenticado')
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    throw new Error('Não autenticado')
  }

  const { data: isStaff, error: staffError } = await supabase.rpc('is_staff')
  if (staffError || !isStaff) {
    throw new Error('Sem permissão')
  }

  return { supabase, userId: userData.user.id }
}

export function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )
}
