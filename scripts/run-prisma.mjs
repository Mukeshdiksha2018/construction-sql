/**
 * Runs Prisma CLI with DATABASE_URL derived from .env
 * (DATABASE_URL or NUXT_MSSQL_CONNECTION_STRING).
 */
import { spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

loadEnvFile(resolve(root, '.env'))

if (!process.env.DATABASE_URL?.trim() && process.env.NUXT_MSSQL_CONNECTION_STRING?.trim()) {
  const { adoConnectionStringToPrismaUrl } = await import('./ado-to-prisma-url.mjs')
  process.env.DATABASE_URL = adoConnectionStringToPrismaUrl(
    process.env.NUXT_MSSQL_CONNECTION_STRING,
  )
}

if (!process.env.DATABASE_URL?.trim()) {
  console.error(
    'Missing DATABASE_URL. Set DATABASE_URL (Prisma format) or NUXT_MSSQL_CONNECTION_STRING in .env',
  )
  process.exit(1)
}

const args = process.argv.slice(2)
const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['prisma', ...args],
  { stdio: 'inherit', env: process.env, cwd: root, shell: process.platform === 'win32' },
)

process.exit(result.status ?? 1)

function loadEnvFile(path) {
  if (!existsSync(path)) return
  const content = readFileSync(path, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith('\'') && value.endsWith('\''))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}
