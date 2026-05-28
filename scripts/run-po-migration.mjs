import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import sql from 'mssql'

const __dirname = dirname(fileURLToPath(import.meta.url))

const connStr = 'Server=10.4.1.12;Database=supabase;Trusted_Connection=True;TrustServerCertificate=true;User ID=sa;Password=^!ml3Le#543*;Integrated Security=False;MultipleActiveResultSets=True'

// Parse MSSQL connection string
const config = {
  server: '10.4.1.12',
  database: 'supabase',
  user: 'sa',
  password: '^!ml3Le#543*',
  options: {
    trustServerCertificate: true,
    encrypt: true,
  },
  port: 1433,
}

const migrationPath = join(__dirname, '..', 'prisma', 'migrations', '20260529100000_add_purchase_orders_tables', 'migration.sql')
const sql_content = readFileSync(migrationPath, 'utf-8')

// Split by GO statements (if any) and filter out comment-only blocks
const statements = sql_content
  .split(/\n(?=CREATE TABLE|CREATE INDEX|ALTER TABLE)/g)
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'))

async function run() {
  let pool
  try {
    pool = await sql.connect(config)
    console.log('Connected to MSSQL')

    for (const stmt of statements) {
      if (!stmt.trim()) continue
      try {
        await pool.request().query(stmt)
        const firstLine = stmt.split('\n')[0].substring(0, 80)
        console.log(`✓ ${firstLine}`)
      } catch (err) {
        if (err.message?.includes('already exists') || err.message?.includes('There is already an object')) {
          const firstLine = stmt.split('\n')[0].substring(0, 80)
          console.log(`⚠ Already exists: ${firstLine}`)
        } else {
          console.error(`✗ Error: ${err.message}`)
          console.error(`  Statement: ${stmt.substring(0, 100)}`)
        }
      }
    }

    console.log('\nMigration complete!')
  } catch (err) {
    console.error('Connection error:', err)
    process.exit(1)
  } finally {
    if (pool) await pool.close()
  }
}

run()
