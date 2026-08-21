import { createWriteStream, existsSync, mkdirSync, rmSync, renameSync } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { execFileSync, spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'

const SDK_ROOT = join(homedir(), 'AppData', 'Local', 'Android', 'Sdk')
const ZIP_URL =
  'https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip'
const ZIP_PATH = join(SDK_ROOT, 'commandlinetools.zip')
const TOOLS_PARENT = join(SDK_ROOT, 'cmdline-tools')
const TOOLS_LATEST = join(TOOLS_PARENT, 'latest')
const SDKMANAGER = join(TOOLS_LATEST, 'bin', 'sdkmanager.bat')

function run(file, args, extra = {}) {
  console.log(`> ${file} ${args.join(' ')}`)
  execFileSync(file, args, { stdio: 'inherit', windowsHide: true, shell: true, ...extra })
}

mkdirSync(SDK_ROOT, { recursive: true })

if (!existsSync(SDKMANAGER)) {
  console.log('Downloading Android command-line tools...')
  const res = await fetch(ZIP_URL)
  if (!res.ok) throw new Error(`Download failed: ${res.status}`)
  await pipeline(Readable.fromWeb(res.body), createWriteStream(ZIP_PATH))

  const extractTo = join(SDK_ROOT, '_cmdline_extract')
  rmSync(extractTo, { recursive: true, force: true })
  mkdirSync(extractTo, { recursive: true })
  run('tar', ['-xf', ZIP_PATH, '-C', extractTo])
  rmSync(ZIP_PATH, { force: true })

  mkdirSync(TOOLS_PARENT, { recursive: true })
  rmSync(TOOLS_LATEST, { recursive: true, force: true })
  const extracted = join(extractTo, 'cmdline-tools')
  if (!existsSync(extracted)) {
    throw new Error('Zip did not contain cmdline-tools/')
  }
  renameSync(extracted, TOOLS_LATEST)
  rmSync(extractTo, { recursive: true, force: true })
}

const packages = [
  'platform-tools',
  'platforms;android-36',
  'build-tools;35.0.0',
  'build-tools;36.0.0',
]

const env = {
  ...process.env,
  ANDROID_HOME: SDK_ROOT,
  ANDROID_SDK_ROOT: SDK_ROOT,
  JAVA_HOME: process.env.JAVA_HOME || 'C:\\Program Files\\Eclipse Adoptium\\jdk-17.0.19.10-hotspot\\',
}

console.log('Accepting SDK licenses...')
const yes = Buffer.from('y\n'.repeat(120))
const license = spawnSync(
  SDKMANAGER,
  [`--sdk_root=${SDK_ROOT}`, '--licenses'],
  { input: yes, stdio: ['pipe', 'inherit', 'inherit'], windowsHide: true, shell: true, env },
)
if (license.status) process.exit(license.status)

console.log('Installing SDK packages...')
run(SDKMANAGER, [`--sdk_root=${SDK_ROOT}`, ...packages], { env })
console.log(`SDK ready at ${SDK_ROOT}`)
