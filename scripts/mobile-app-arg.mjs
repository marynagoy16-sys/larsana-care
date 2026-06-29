export const MOBILE_APPS = ['profissional', 'paciente', 'financeiro', 'gestao']

/** Aceita `profissional`, `--profissional`, `-- paciente`, etc. */
export function parseMobileAppArg(argvSlice) {
  for (const raw of argvSlice) {
    if (!raw) continue
    const name = raw.replace(/^--+/, '')
    if (MOBILE_APPS.includes(name)) return name
  }
  return null
}

export function printMobileAppUsage(command, { typecheck = false } = {}) {
  const action = typecheck ? 'typecheck:mobile' : 'dev:mobile'
  console.error(`Uso: npm run ${action} -- <app>`)
  console.error(`     npm run ${action} -- --profissional`)
  console.error('')
  console.error('Apps disponíveis:')
  for (const app of MOBILE_APPS) {
    console.error(`  - ${app}  →  npm run ${action}:${app}`)
  }
  if (!typecheck) {
    console.error('')
    console.error('Exemplos:')
    console.error('  npm run dev:web')
    console.error('  npm run dev:mobile -- profissional')
    console.error('  npm run dev:mobile:paciente')
  }
}
