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
  city_name: string | null
  state_code: string | null
  patients?: { full_name: string } | null
  regions?: { code: string; name: string } | null
}

async function listWaitlist(): Promise<{ data: WaitlistRow[]; count: number }> {
  const { data, error, count } = await supabase
    .from('patient_waitlist' as 'demands')
    .select(`
      id, patient_id, region_id, status, created_at, city_name, state_code,
      patients ( full_name ),
      regions ( code, name )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })

  if (error) throw error
  return { data: (data ?? []) as unknown as WaitlistRow[], count: count ?? 0 }
}

function cityLabel(row: WaitlistRow) {
  if (!row.city_name) return 'Cidade não informada'
  return row.state_code ? `${row.city_name}/${row.state_code}` : row.city_name
}

export function AdminWaitlistPage() {
  return (
    <EntityListPage
      title="Lista de espera"
      description="Pacientes aguardando cobertura. O resumo acima da tabela mostra a demanda por cidade."
      renderAfterStats={(rows) => {
        const counts = new Map<string, number>()
        for (const row of rows) {
          const label = cityLabel(row as WaitlistRow)
          counts.set(label, (counts.get(label) ?? 0) + 1)
        }
        const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1])
        if (ranked.length === 0) return null
        return (
          <div className="mb-4 flex flex-wrap gap-2">
            {ranked.map(([label, count]) => (
              <Badge key={label} variant="secondary">
                {label}: {count}
              </Badge>
            ))}
          </div>
        )
      }}
      queryKey={['admin', 'waitlist']}
      queryFn={listWaitlist}
      columns={[
        {
          key: 'patient',
          header: 'Paciente',
          cell: (row) => row.patients?.full_name ?? '—',
        },
        {
          key: 'city',
          header: 'Cidade',
          cell: (row) => cityLabel(row),
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
