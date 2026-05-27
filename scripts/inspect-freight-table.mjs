import sql from 'mssql'
import { config } from 'dotenv'

config()

const conn = process.env.NUXT_MSSQL_CONNECTION_STRING
if (!conn) {
  console.error('NUXT_MSSQL_CONNECTION_STRING not set')
  process.exit(1)
}

const pool = await sql.connect(conn)
const tables = await pool.request().query(`
  SELECT TABLE_SCHEMA, TABLE_NAME
  FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_NAME LIKE '%freight%'
  ORDER BY TABLE_NAME
`)
console.log('tables:', JSON.stringify(tables.recordset, null, 2))

for (const row of tables.recordset) {
  const cols = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = '${row.TABLE_SCHEMA}' AND TABLE_NAME = '${row.TABLE_NAME}'
    ORDER BY ORDINAL_POSITION
  `)
  console.log(`columns for ${row.TABLE_SCHEMA}.${row.TABLE_NAME}:`, JSON.stringify(cols.recordset, null, 2))
}

await pool.close()
