/** Shared value helpers for sync. */

export function uuidStr(v) {
  if (v == null || v === '') return null
  return String(v).trim().toLowerCase()
}

export function asStr(v, max) {
  if (v == null) return null
  const s = String(v)
  return max != null ? s.slice(0, max) : s
}

export function asBool(v, fallback = false) {
  if (v == null) return fallback
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  const s = String(v).trim().toLowerCase()
  if (['true', '1', 'yes', 'y', 't'].includes(s)) return true
  if (['false', '0', 'no', 'n', 'f'].includes(s)) return false
  return fallback
}

export function asNum(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function asDate(v) {
  if (v == null || v === '') return null
  const d = v instanceof Date ? v : new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export function stringifyJson(v) {
  if (v == null) return null
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v)
  }
  catch {
    return null
  }
}

export function parseJson(v, fallback = null) {
  if (v == null) return fallback
  if (typeof v === 'object') return v
  if (typeof v !== 'string') return fallback
  try {
    return JSON.parse(v)
  }
  catch {
    return fallback
  }
}

export function log(msg) {
  console.log(`[sync] ${msg}`)
}

export function warn(msg) {
  console.warn(`[sync:warn] ${msg}`)
}

/**
 * @param {number} ms
 */
export function elapsed(ms) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}
