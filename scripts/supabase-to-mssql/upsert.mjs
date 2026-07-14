import { sql } from './db.mjs'
import { log, warn } from './utils.mjs'

/**
 * Upsert rows into MSSQL by uuid.
 * @param {import('mssql').ConnectionPool} pool
 * @param {{
 *   table: string,
 *   columns: string[],
 *   rows: Record<string, unknown>[],
 *   dryRun?: boolean,
 *   identityInsert?: boolean,
 * }} opts
 */
export async function upsertByUuid(pool, opts) {
  const { table, columns, rows, dryRun = false } = opts
  if (!rows.length) {
    log(`${table}: 0 rows`)
    return { inserted: 0, updated: 0, skipped: 0 }
  }

  const cols = columns.filter((c) => c !== 'id')
  if (!cols.includes('uuid')) throw new Error(`${table}: columns must include uuid`)

  let inserted = 0
  let updated = 0
  let skipped = 0

  // Existing uuids
  const existing = new Set()
  {
    const rs = await pool.request().query(`SELECT CAST(uuid AS NVARCHAR(100)) AS uuid FROM dbo.[${table}]`)
    for (const r of rs.recordset) {
      if (r.uuid) existing.add(String(r.uuid).toLowerCase())
    }
  }

  const BATCH = 50
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    for (const row of chunk) {
      const uuid = row.uuid != null ? String(row.uuid) : null
      if (!uuid) {
        skipped++
        continue
      }
      const key = uuid.toLowerCase()
      const data = {}
      for (const c of cols) {
        if (c in row) data[c] = row[c]
      }
      data.uuid = uuid

      if (dryRun) {
        if (existing.has(key)) updated++
        else inserted++
        continue
      }

      if (existing.has(key)) {
        const setCols = cols.filter((c) => c !== 'uuid')
        if (!setCols.length) {
          skipped++
          continue
        }
        const req = pool.request()
        req.input('uuid', sql.NVarChar(100), uuid)
        const sets = setCols.map((c, idx) => {
          const p = `p${idx}`
          bind(req, p, data[c])
          return `[${c}] = @${p}`
        })
        await req.query(`UPDATE dbo.[${table}] SET ${sets.join(', ')} WHERE CAST(uuid AS NVARCHAR(100)) = @uuid`)
        updated++
      }
      else {
        const req = pool.request()
        const insertCols = cols.filter((c) => c in data)
        for (let idx = 0; idx < insertCols.length; idx++) {
          bind(req, `p${idx}`, data[insertCols[idx]])
        }
        const colList = insertCols.map((c) => `[${c}]`).join(', ')
        const paramList = insertCols.map((_, idx) => `@p${idx}`).join(', ')
        await req.query(`INSERT INTO dbo.[${table}] (${colList}) VALUES (${paramList})`)
        existing.add(key)
        inserted++
      }
    }
    if ((i + BATCH) % 500 < BATCH || i + BATCH >= rows.length) {
      log(`${table}: progress ${Math.min(i + BATCH, rows.length)}/${rows.length}`)
    }
  }

  log(`${table}: inserted=${inserted} updated=${updated} skipped=${skipped}`)
  return { inserted, updated, skipped }
}

/**
 * @param {import('mssql').Request} req
 * @param {string} name
 * @param {unknown} value
 */
function bind(req, name, value) {
  if (value === undefined) {
    req.input(name, sql.NVarChar, null)
    return
  }
  if (value === null) {
    req.input(name, sql.NVarChar, null)
    return
  }
  if (typeof value === 'boolean') {
    req.input(name, sql.Bit, value)
    return
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value) && Math.abs(value) < 2e9) req.input(name, sql.Int, value)
    else req.input(name, sql.Float, value)
    return
  }
  if (value instanceof Date) {
    req.input(name, sql.DateTime2, value)
    return
  }
  if (typeof value === 'object') {
    req.input(name, sql.NVarChar(sql.MAX), JSON.stringify(value))
    return
  }
  const s = String(value)
  if (s.length > 4000) req.input(name, sql.NVarChar(sql.MAX), s)
  else req.input(name, sql.NVarChar(s.length > 255 ? 4000 : 255), s)
}

/**
 * Delete children for parents then insert.
 * @param {import('mssql').ConnectionPool} pool
 * @param {{
 *   table: string,
 *   parentCol: string,
 *   parentUuids: string[],
 *   columns: string[],
 *   rows: Record<string, unknown>[],
 *   dryRun?: boolean,
 * }} opts
 */
export async function replaceChildren(pool, opts) {
  const { table, parentCol, parentUuids, columns, rows, dryRun = false } = opts
  const parents = [...new Set(parentUuids.filter(Boolean).map((u) => String(u)))]
  if (!parents.length && !rows.length) {
    log(`${table}: nothing to replace`)
    return { deleted: 0, inserted: 0 }
  }

  if (dryRun) {
    log(`${table}: dry-run replace parents=${parents.length} rows=${rows.length}`)
    return { deleted: parents.length, inserted: rows.length }
  }

  // Delete in chunks
  let deleted = 0
  const DEL_BATCH = 100
  for (let i = 0; i < parents.length; i += DEL_BATCH) {
    const chunk = parents.slice(i, i + DEL_BATCH)
    const req = pool.request()
    const params = chunk.map((u, idx) => {
      req.input(`u${idx}`, sql.NVarChar(100), u)
      return `@u${idx}`
    })
    const res = await req.query(
      `DELETE FROM dbo.[${table}] WHERE CAST([${parentCol}] AS NVARCHAR(100)) IN (${params.join(',')})`,
    )
    deleted += res.rowsAffected?.[0] || 0
  }

  let inserted = 0
  const cols = columns.filter((c) => c !== 'id')
  for (const row of rows) {
    const data = {}
    for (const c of cols) {
      if (c in row) data[c] = row[c]
    }
    if (!data[parentCol] && row[parentCol]) data[parentCol] = row[parentCol]
    const insertCols = cols.filter((c) => c in data)
    if (!insertCols.length) continue
    const req = pool.request()
    for (let idx = 0; idx < insertCols.length; idx++) {
      bind(req, `p${idx}`, data[insertCols[idx]])
    }
    const colList = insertCols.map((c) => `[${c}]`).join(', ')
    const paramList = insertCols.map((_, idx) => `@p${idx}`).join(', ')
    try {
      await req.query(`INSERT INTO dbo.[${table}] (${colList}) VALUES (${paramList})`)
      inserted++
    }
    catch (e) {
      warn(`${table} insert failed: ${e.message}`)
    }
  }

  log(`${table}: replace deleted≈${deleted} inserted=${inserted}`)
  return { deleted, inserted }
}

/**
 * @param {import('mssql').ConnectionPool} pool
 * @param {string} table
 */
export async function countMssql(pool, table) {
  const rs = await pool.request().query(`SELECT COUNT(*) AS c FROM dbo.[${table}]`)
  return Number(rs.recordset[0]?.c || 0)
}
