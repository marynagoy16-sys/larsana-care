import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const envFile = Object.fromEntries(
  readFileSync(resolve(root, '.env'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const token = envFile.access_token
const projectId = envFile.PROJECT_ID
if (!token || !projectId) {
  console.error('Missing access_token or PROJECT_ID')
  process.exit(1)
}

const env = { ...process.env, SUPABASE_ACCESS_TOKEN: token }
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx'

function deploy(args) {
  const result = spawnSync(
    npx,
    ['supabase', 'functions', 'deploy', ...args, '--project-ref', projectId, '--workdir', 'data', '--use-api', '--yes'],
    { cwd: root, env, stdio: 'inherit', shell: true },
  )
  if (result.status !== 0) process.exit(result.status ?? 1)
}

deploy(['create-charge'])
deploy(['payment-webhook', '--no-verify-jwt'])
