import { useQuery } from '@tanstack/react-query'
import { PPAccountSubpageHeader } from '@/components/profissional/account/PPAccountSubpageHeader'
import { CrudScrollPageLayout } from '@/components/crud/list-page/CrudScrollPageLayout'
import { DetailPageSkeleton } from '@/components/crud/list-page/CrudListSkeleton'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

function ProfileField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value?.trim() ? value : '—'}</p>
    </div>
  )
}

export function PPPerfilPage() {
  const { profile } = useAuth()

  const { data: professional, isLoading } = useQuery({
    queryKey: ['pp', 'profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data, error } = await supabase
        .from('professionals')
        .select('id, full_name, profession, credentialing_status')
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  return (
    <>
      <PPAccountSubpageHeader title="Perfil" loading={isLoading} />

      <CrudScrollPageLayout>
        {isLoading ? (
          <DetailPageSkeleton fields={4} />
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border pb-8">
            <ProfileField label="Nome completo" value={professional?.full_name ?? profile?.full_name} />
            <ProfileField label="E-mail" value={profile?.email} />
            <ProfileField label="Profissão" value={professional?.profession} />
            <ProfileField label="Credenciamento" value={professional?.credentialing_status} />
          </div>
        )}
      </CrudScrollPageLayout>
    </>
  )
}
