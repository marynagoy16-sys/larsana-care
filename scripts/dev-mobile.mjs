#!/usr/bin/env node
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MOBILE_APPS, parseMobileAppArg, printMobileAppUsage } from './mobile-app-arg.mjs'

const app = parseMobileAppArg(process.argv.slice(2))

if (!app) {
  printMobileAppUsage('dev:mobile')
  process.exit(1)
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const appDir = path.join(root, 'mobile', 'apps', app)
const envPath = path.join(appDir, '.env')

function ensureAppEnv() {
  if (fs.existsSync(envPath)) return

  const templateApps = ['profissional', 'paciente']
  for (const templateApp of templateApps) {
    const templatePath = path.join(root, 'mobile', 'apps', templateApp, '.env')
    if (fs.existsSync(templatePath)) {
      fs.copyFileSync(templatePath, envPath)
      console.log(`Criado mobile/apps/${app}/.env a partir de ${templateApp}/.env`)
      return
    }
  }

  const rootEnvPath = path.join(root, '.env')
  if (!fs.existsSync(rootEnvPath)) {
    console.warn(
      `Aviso: mobile/apps/${app}/.env não encontrado. Copie de profissional ou configure EXPO_PUBLIC_SUPABASE_* manualmente.`,
    )
    return
  }

  const lines = fs.readFileSync(rootEnvPath, 'utf8').split(/\r?\n/)
  const map = new Map()
  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match) continue
    map.set(match[1], match[2])
  }

  const url = map.get('EXPO_PUBLIC_SUPABASE_URL') ?? map.get('VITE_SUPABASE_URL')
  const key = map.get('EXPO_PUBLIC_SUPABASE_ANON_KEY') ?? map.get('VITE_SUPABASE_ANON_KEY')
  const devLogin = map.get('EXPO_PUBLIC_ENABLE_DEV_LOGIN') ?? map.get('VITE_ENABLE_DEV_LOGIN') ?? 'true'

  if (!url || !key) {
    console.warn(
      `Aviso: não foi possível gerar mobile/apps/${app}/.env a partir da raiz. Configure EXPO_PUBLIC_SUPABASE_* manualmente.`,
    )
    return
  }

  const content = [
    `EXPO_PUBLIC_SUPABASE_URL=${url}`,
    `EXPO_PUBLIC_SUPABASE_ANON_KEY=${key}`,
    `EXPO_PUBLIC_ENABLE_DEV_LOGIN=${devLogin}`,
    '',
  ].join('\n')

  fs.writeFileSync(envPath, content, 'utf8')
  console.log(`Criado mobile/apps/${app}/.env a partir do .env da raiz`)
}

if (!MOBILE_APPS.includes(app)) {
  printMobileAppUsage('dev:mobile')
  process.exit(1)
}

console.log(`Iniciando LarsanaCare mobile — ${app}`)
ensureAppEnv()

const child = spawn('npm', ['run', 'start'], {
  cwd: appDir,
  stdio: 'inherit',
  shell: true,
})

child.on('exit', (code) => process.exit(code ?? 0))
