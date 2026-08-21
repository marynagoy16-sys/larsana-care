import { spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'

const sdk = join(homedir(), 'AppData', 'Local', 'Android', 'Sdk')
const java =
  process.env.JAVA_HOME?.includes('jdk-21')
    ? process.env.JAVA_HOME
    : 'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.12.8-hotspot\\'
const cwd = 'C:\\DEV\\larsana-care\\frontend\\android'
const env = {
  ...process.env,
  ANDROID_HOME: sdk,
  ANDROID_SDK_ROOT: sdk,
  JAVA_HOME: java,
}

console.log('JAVA_HOME=' + java)
console.log('ANDROID_HOME=' + sdk)
const result = spawnSync(
  join(cwd, 'gradlew.bat'),
  ['assembleDebug', '--no-daemon'],
  { cwd, env, stdio: 'inherit', shell: true, windowsHide: true },
)
process.exit(result.status ?? 1)
