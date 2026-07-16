import { log, warn } from './utils.mjs'

/**
 * @typedef {{
 *   kind: 'pg'|'rest',
 *   querySql: (text: string, params?: unknown[]) => Promise<any[]>,
 *   end: () => Promise<void>,
 * }} SourceClient
 */

/**
 * PostgREST source over HTTPS (works when direct Postgres is IPv6-only / unreachable).
 * @param {{ url: string, serviceRoleKey: string }} opts
 * @returns {Promise<SourceClient>}
 */
export async function createRestSource(opts) {
  const base = opts.url.replace(/\/$/, '')
  const key = opts.serviceRoleKey
  if (!base || !key) {
    throw new Error('REST source requires NUXT_SUPABASE_URL and NUXT_SUPABASE_SERVICE_ROLE_KEY')
  }

  // Smoke test
  const probe = await restFetch(base, key, '/rest/v1/', { method: 'HEAD' })
  if (probe.status >= 500) {
    throw new Error(`Supabase REST not reachable (HTTP ${probe.status})`)
  }
  log('Using Supabase REST (PostgREST over HTTPS) — no direct Postgres socket')

  return {
    kind: 'rest',
    querySql: (text) => restQuerySql(base, key, text),
    end: async () => {},
  }
}

/**
 * @param {string} base
 * @param {string} key
 * @param {string} path
 * @param {RequestInit} [init]
 */
async function restFetch(base, key, path, init = {}) {
  const headers = new Headers(init.headers || {})
  headers.set('apikey', key)
  headers.set('Authorization', `Bearer ${key}`)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  return fetch(`${base}${path}`, { ...init, headers })
}

/**
 * Paginated select.
 * @param {string} base
 * @param {string} key
 * @param {string} table
 * @param {string} select
 * @param {string[]} filterQs querystring filter fragments (without leading ?)
 */
async function fetchAll(base, key, table, select, filterQs = []) {
  const pageSize = 1000
  /** @type {any[]} */
  const out = []
  let from = 0
  for (;;) {
    const qs = [`select=${encodeURIComponent(select)}`, ...filterQs].join('&')
    const path = `/rest/v1/${table}?${qs}`
    const res = await restFetch(base, key, path, {
      headers: {
        Range: `${from}-${from + pageSize - 1}`,
        Prefer: 'count=exact',
      },
    })
    if (!res.ok) {
      const body = await res.text()
      // Column mismatch on explicit select — retry once with *
      if (select !== '*' && res.status === 400 && body.includes('42703')) {
        warn(`REST ${table}: column missing in select; retrying with select=*`)
        return fetchAll(base, key, table, '*', filterQs)
      }
      throw new Error(`REST ${table} HTTP ${res.status}: ${body.slice(0, 300)}`)
    }
    const chunk = await res.json()
    if (!Array.isArray(chunk)) {
      throw new Error(`REST ${table}: expected array`)
    }
    out.push(...chunk)
    if (chunk.length < pageSize) break
    from += pageSize
  }
  return out
}

async function countTable(base, key, table) {
  const res = await restFetch(base, key, `/rest/v1/${table}?select=uuid`, {
    headers: {
      Range: '0-0',
      Prefer: 'count=exact',
    },
  })
  if (!res.ok) {
    // fallback: some tables may not have uuid — try *
    const res2 = await restFetch(base, key, `/rest/v1/${table}?select=*`, {
      headers: { Range: '0-0', Prefer: 'count=exact' },
    })
    if (!res2.ok) {
      const body = await res2.text()
      throw new Error(`REST count ${table}: ${res2.status} ${body.slice(0, 200)}`)
    }
    return parseContentRangeCount(res2.headers.get('content-range'))
  }
  return parseContentRangeCount(res.headers.get('content-range'))
}

function parseContentRangeCount(cr) {
  // e.g. 0-0/123
  if (!cr) return 0
  const m = String(cr).match(/\/(\d+|\*)\s*$/)
  if (!m || m[1] === '*') return 0
  return Number(m[1]) || 0
}

function parseInList(inner) {
  /** @type {string[]} */
  const vals = []
  const re = /'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"|([^,\s]+)/g
  let m
  while ((m = re.exec(inner))) {
    const v = (m[1] ?? m[2] ?? m[3] ?? '').replace(/\\'/g, "'").replace(/\\"/g, '"').trim()
    if (v && v.toLowerCase() !== 'null') vals.push(v)
  }
  return vals
}

function restInFilter(col, values) {
  // PostgREST: col=in.(a,b) — quote if needed
  const parts = values.map((v) => {
    if (/^[a-zA-Z0-9_-]+$/.test(v)) return v
    return `"${String(v).replace(/"/g, '\\"')}"`
  })
  return `${col}=in.(${parts.join(',')})`
}

/**
 * Translate the sync script's simple SQL into PostgREST calls.
 * @param {string} base
 * @param {string} key
 * @param {string} text
 */
async function restQuerySql(base, key, text) {
  const sql = String(text).replace(/\s+/g, ' ').trim()
  if (/\bwhere\s+false\b/i.test(sql)) return []

  const countM = sql.match(/^select\s+count\(\*\)(?:::\w+)?\s+as\s+c\s+from\s+public\.(\w+)\s*$/i)
  if (countM) {
    const c = await countTable(base, key, countM[1])
    return [{ c }]
  }

  const fromM = sql.match(/\bfrom\s+public\.(\w+)\b/i)
  if (!fromM) {
    throw new Error(`REST transport cannot parse SQL (need "from public.<table>"): ${sql.slice(0, 160)}`)
  }
  const table = fromM[1]

  // Always select * — source schemas often differ from MS SQL (e.g. no created_by on project_types).
  // Phase mappers already null-coalesce missing fields.
  const select = '*'

  /** @type {string[]} */
  const filterQs = []

  // where col is null or col::text in (...)
  const orNullIn = sql.match(
    /\bwhere\s+(\w+)\s+is\s+null\s+or\s+\1(?:::text)?\s+in\s*\(([^)]*)\)/i,
  )
  const plainIn = !orNullIn
    && sql.match(/\bwhere\s+(\w+)(?:::text)?\s+in\s*\(([^)]*)\)/i)

  if (orNullIn) {
    const col = orNullIn[1]
    const vals = parseInList(orNullIn[2])
    if (!vals.length) {
      filterQs.push(`${col}=is.null`)
    }
    else {
      // Chunk or-filter
      const chunks = chunk(vals, 80)
      /** @type {any[]} */
      const rows = []
      for (const ch of chunks) {
        const inPart = `${col}.in.(${ch.map(restQuote).join(',')})`
        const qs = [`or=(${col}.is.null,${inPart})`]
        rows.push(...await fetchAll(base, key, table, select, qs))
      }
      // Also rows with null alone already included each time — dedupe by uuid if present
      return dedupeRows(rows)
    }
  }
  else if (plainIn) {
    const col = plainIn[1]
    const vals = parseInList(plainIn[2])
    if (!vals.length) return []
    const chunks = chunk(vals, 100)
    /** @type {any[]} */
    const rows = []
    for (const ch of chunks) {
      rows.push(...await fetchAll(base, key, table, select, [restInFilter(col, ch)]))
    }
    return dedupeRows(rows)
  }

  return fetchAll(base, key, table, select, filterQs)
}

function restQuote(v) {
  if (/^[a-zA-Z0-9_-]+$/.test(v)) return v
  return `"${String(v).replace(/"/g, '\\"')}"`
}

function chunk(arr, size) {
  /** @type {typeof arr[]} */
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function dedupeRows(rows) {
  if (!rows.length || rows[0]?.uuid == null) return rows
  const seen = new Set()
  return rows.filter((r) => {
    const k = String(r.uuid).toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
