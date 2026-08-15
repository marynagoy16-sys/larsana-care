import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { EntityListPage } from '@/components/crud/EntityListPage'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

type WaitlistRow = {
  id: string
  patient_id: string
  region_id: string | null
  status: string
  created_at: string
  patients?: { full_name: string } | null
  regions?: { code: string; name: string } | null
}

async function listWaitlist(): Promise<{ data: WaitlistRow[]; count: number }> {
  const { data, error, count } = await supabase
    .from('patient_waitlist' as 'demands')
    .select(`
      id, patient_id, region_id, status, created_at,
      patients ( full_name ),
      regions ( code, name )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (error) throw error
  return { data: (data ?? []) as WaitlistRow[], count: count ?? 0 }
}

export function AdminWaitlistPage() {
  return (
    <EntityListPage
      title="Lista de espera"
      description="Pacientes aguardando cobertura ou início de tratamento"
      queryKey={['admin', 'waitlist']}
      queryFn={listWaitlist}
      columns={[
        {
          key: 'patient',
          header: 'Paciente',
          cell: (row) => row.patients?.full_name ?? '—',
        },
        {
          key: 'region',
          header: 'Região',
          cell: (row) =>
            row.regions?.code ? `Região ${row.regions.code}` : '—',
        },
        {
          key: 'status',
          header: 'Status',
          cell: (row) => (
            <Badge variant={row.status === 'pendente' ? 'secondary' : 'default'}>
              {row.status}
            </Badge>
          ),
        },
        {
          key: 'created',
          header: 'Entrada',
          cell: (row) => format(new Date(row.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        },
      ]}
    />
  )
}
