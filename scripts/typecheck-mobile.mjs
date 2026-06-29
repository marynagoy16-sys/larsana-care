#!/usr/bin/env node
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MOBILE_APPS, parseMobileAppArg, printMobileAppUsage } from './mobile-app-arg.mjs'

const app = parseMobileAppArg(process.argv.slice(2)) ?? 'profissional'

if (!MOBILE_APPS.includes(app)) {
  printMobileAppUsage('typecheck:mobile', { typecheck: true })
  process.exit(1)
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const appDir = path.join(root, 'mobile', 'apps', app)

const child = spawn('npm', ['run', 'typecheck'], {
  cwd: appDir,
  stdio: 'inherit',
  shell: true,
})

child.on('exit', (code) => process.exit(code ?? 0))
