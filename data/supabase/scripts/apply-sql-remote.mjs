import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '../../..')

function loadEnv() {
  const candidates = [resolve(root, '.env'), resolve(process.cwd(), '.env')]
  for (const envPath of candidates) {
    try {
      const raw = readFileSync(envPath, 'utf8')
      const env = {}
      for (const line of raw.split(/\r?\n/)) {
        if (!line.trim()) continue
        const m = line.match(/^([^#=]+)=(.*)$/)
        if (m) env[m[1].trim()] = m[2].trim()
      }
      if (env.access_token || env.PROJECT_ID) return env
    } catch {
      // try next
    }
  }
  return {}
}

function splitStatements(sql) {
  const blocks = []
  let current = []
  for (const line of sql.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('--') && current.length === 0) continue
    current.push(line)
    if (trimmed.endsWith(';')) {
      blocks.push(current.join('\n'))
      current = []
    }
  }
  if (current.length) blocks.push(current.join('\n'))
  return blocks.filter((b) => b.trim())
}

async function runQuery(token, projectId, query) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`${res.status}: ${body.slice(0, 500)}`)
  return body
}

async function main() {
  const env = loadEnv()
  const token = env.access_token
  const projectId = env.PROJECT_ID
  if (!token || !projectId) throw new Error('Missing access_token or PROJECT_ID in .env')

  const file = process.argv[2]
  if (!file) throw new Error('Usage: node apply-sql-remote.mjs <sql-file>')

  const sql = readFileSync(resolve(process.cwd(), file), 'utf8')
  // Dollar-quoted function bodies contain inner semicolons. Split only when asked.
  const statements = process.argv.includes('--split') ? splitStatements(sql) : [sql]
  console.log(`Applying ${statements.length} statement(s) from ${file}...`)

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    const preview = stmt.trim().split('\n')[0].slice(0, 80)
    process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `)
    await runQuery(token, projectId, stmt)
    console.log('ok')
  }

  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
