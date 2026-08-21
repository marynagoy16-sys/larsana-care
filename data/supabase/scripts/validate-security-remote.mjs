import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const env = Object.fromEntries(
  readFileSync(resolve(root, '.env'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

async function q(query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${env.PROJECT_ID}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 400)}`)
  console.log(text)
}

await q(`select
  public.resolve_public_signup_role('admin') as admin_req,
  public.resolve_public_signup_role('financeiro') as fin_req,
  public.resolve_public_signup_role('pp') as pp_req,
  public.resolve_public_signup_role('paciente') as pac_req`)

await q(`select tgname from pg_trigger where tgname = 'protect_profile_primary_role'`)

await q(`select primary_role::text, count(*)::int as n from public.profiles group by 1 order by 1`)

await q(`select r.rolname, has_function_privilege(r.oid, p.oid, 'EXECUTE') as can_exec
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join pg_roles r on r.rolname in ('anon','authenticated','service_role')
  where n.nspname = 'public' and p.proname = 'simulate_charge_payment'`)

await q(`select column_name from information_schema.columns
  where table_schema = 'public' and table_name = 'payment_webhook_events' and column_name = 'asaas_event_id'`)

await q(`select indexname from pg_indexes
  where tablename = 'payment_webhook_events' and indexname = 'idx_payment_webhook_events_asaas_event_id'`)

await q(`select column_name, data_type from information_schema.columns
  where table_schema = 'supabase_migrations' and table_name = 'schema_migrations' order by ordinal_position`)

await q(`select version from supabase_migrations.schema_migrations
  where version in ('20260819184130','20260819184341','20260819191000')
  order by version`)
