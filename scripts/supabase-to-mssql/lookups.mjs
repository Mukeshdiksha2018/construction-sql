import { pgQuery } from './db.mjs'
import { log, uuidStr, warn } from './utils.mjs'

/**
 * @typedef {{
 *   corpByUuid: Map<string, string>,
 *   corpByNimble: Map<string, string>,
 *   vendorByUuid: Map<string, string>,
 *   vendorByNimble: Map<string, string>,
 *   uomByUuid: Map<string, string>,
 *   uomByNimble: Map<string, string>,
 *   shipViaByUuid: Map<string, string>,
 *   shipViaByNimble: Map<string, string>,
 *   coaByUuid: Map<string, string>,
 *   coaByNimble: Map<string, string>,
 *   misses: { kind: string, value: string }[],
 *   strict: boolean,
 * }} Lookups
 */

function addMap(byUuid, byNimble, uuid, nimbleId) {
  const u = uuidStr(uuid)
  const n = nimbleId != null && String(nimbleId).trim() !== '' ? String(nimbleId).trim() : null
  if (!u || !n) return
  byUuid.set(u, n)
  byNimble.set(n.toLowerCase(), n)
  // Also index original case nimble keys
  byNimble.set(n, n)
}

/**
 * @param {import('pg').Pool} pg
 * @param {{ strict?: boolean }} [opts]
 * @returns {Promise<Lookups>}
 */
export async function loadLookups(pg, opts = {}) {
  const lookups = {
    corpByUuid: new Map(),
    corpByNimble: new Map(),
    vendorByUuid: new Map(),
    vendorByNimble: new Map(),
    uomByUuid: new Map(),
    uomByNimble: new Map(),
    shipViaByUuid: new Map(),
    shipViaByNimble: new Map(),
    coaByUuid: new Map(),
    coaByNimble: new Map(),
    misses: [],
    strict: !!opts.strict,
  }

  const properties = await pgQuery(
    pg,
    `select uuid::text as uuid, nimble_corporation_id
     from public.properties
     where nimble_corporation_id is not null and trim(nimble_corporation_id) <> ''`,
  )
  for (const r of properties) addMap(lookups.corpByUuid, lookups.corpByNimble, r.uuid, r.nimble_corporation_id)
  log(`lookup properties → nimble corp: ${lookups.corpByUuid.size}`)

  try {
    const vendors = await pgQuery(
      pg,
      `select uuid::text as uuid, nimble_vendor_id
       from public.vendors
       where nimble_vendor_id is not null and trim(nimble_vendor_id) <> ''`,
    )
    for (const r of vendors) addMap(lookups.vendorByUuid, lookups.vendorByNimble, r.uuid, r.nimble_vendor_id)
    log(`lookup vendors → nimble vendor: ${lookups.vendorByUuid.size}`)
  }
  catch (e) {
    warn(`vendors lookup skipped: ${e.message}`)
  }

  try {
    const uoms = await pgQuery(
      pg,
      `select uuid::text as uuid, nimble_uom_id
       from public.uom
       where nimble_uom_id is not null and trim(nimble_uom_id) <> ''`,
    )
    for (const r of uoms) addMap(lookups.uomByUuid, lookups.uomByNimble, r.uuid, r.nimble_uom_id)
    log(`lookup uom → nimble uom: ${lookups.uomByUuid.size}`)
  }
  catch (e) {
    warn(`uom lookup skipped: ${e.message}`)
  }

  try {
    const shipVia = await pgQuery(
      pg,
      `select uuid::text as uuid, nimble_ship_via_id
       from public.ship_via
       where nimble_ship_via_id is not null and trim(nimble_ship_via_id) <> ''`,
    )
    for (const r of shipVia) addMap(lookups.shipViaByUuid, lookups.shipViaByNimble, r.uuid, r.nimble_ship_via_id)
    log(`lookup ship_via → nimble: ${lookups.shipViaByUuid.size}`)
  }
  catch (e) {
    warn(`ship_via lookup skipped: ${e.message}`)
  }

  try {
    const coa = await pgQuery(
      pg,
      `select uuid::text as uuid, nimble_account_id
       from public.chart_of_accounts
       where nimble_account_id is not null and trim(nimble_account_id) <> ''`,
    )
    for (const r of coa) addMap(lookups.coaByUuid, lookups.coaByNimble, r.uuid, r.nimble_account_id)
    log(`lookup chart_of_accounts → nimble: ${lookups.coaByUuid.size}`)
  }
  catch (e) {
    warn(`chart_of_accounts lookup skipped: ${e.message}`)
  }

  return lookups
}

/**
 * @param {Lookups} lookups
 * @param {'corp'|'vendor'|'uom'|'shipVia'|'coa'} kind
 * @param {unknown} value
 */
function remap(lookups, kind, value) {
  if (value == null || value === '') return null
  const raw = String(value).trim()
  if (!raw) return null

  const maps = {
    corp: [lookups.corpByUuid, lookups.corpByNimble],
    vendor: [lookups.vendorByUuid, lookups.vendorByNimble],
    uom: [lookups.uomByUuid, lookups.uomByNimble],
    shipVia: [lookups.shipViaByUuid, lookups.shipViaByNimble],
    coa: [lookups.coaByUuid, lookups.coaByNimble],
  }[kind]

  const [byUuid, byNimble] = maps
  const lower = raw.toLowerCase()

  // Already a nimble id
  let out = null
  if (byNimble.has(raw) || byNimble.has(lower)) {
    out = byNimble.get(raw) || byNimble.get(lower)
  }
  else {
    const mapped = byUuid.get(lower) || byUuid.get(raw)
    if (mapped) out = mapped
  }

  if (out == null) {
    lookups.misses.push({ kind, value: raw })
    if (lookups.strict) {
      throw new Error(`Remap miss (${kind}): ${raw}`)
    }
    out = raw
  }

  // Column widths: remapped FKs are usually NVarChar(36); PO.ship_via is NVarChar(255)
  const maxLen = kind === 'shipVia' ? 255 : 36
  if (out.length > maxLen) {
    warn(`Remap ${kind} value truncated to ${maxLen} chars: ${out}`)
    out = out.slice(0, maxLen)
  }
  return out
}

/** @param {Lookups} L @param {unknown} v */
export const remapCorp = (L, v) => remap(L, 'corp', v)
/** @param {Lookups} L @param {unknown} v */
export const remapVendor = (L, v) => remap(L, 'vendor', v)
/** @param {Lookups} L @param {unknown} v */
export const remapUom = (L, v) => remap(L, 'uom', v)
/** @param {Lookups} L @param {unknown} v */
export const remapShipVia = (L, v) => remap(L, 'shipVia', v)
/** @param {Lookups} L @param {unknown} v */
export const remapCoa = (L, v) => remap(L, 'coa', v)

/**
 * Resolve --corporation filter to local Supabase properties.uuid values (for WHERE).
 * Accepts either local uuid or nimble corp id.
 * @param {Lookups} lookups
 * @param {string|null} corporation
 */
export function resolveCorporationFilter(lookups, corporation) {
  if (!corporation) return null
  const raw = corporation.trim()
  const lower = raw.toLowerCase()

  // If it's a properties uuid
  if (lookups.corpByUuid.has(lower)) {
    return { localUuids: [lower], nimbleId: lookups.corpByUuid.get(lower) }
  }

  // If it's already a nimble id — find all local uuids that map to it
  const localUuids = []
  for (const [u, n] of lookups.corpByUuid.entries()) {
    if (n === raw || n.toLowerCase() === lower) localUuids.push(u)
  }
  if (localUuids.length) {
    return { localUuids, nimbleId: lookups.corpByUuid.get(localUuids[0]) }
  }

  // Unknown — treat as local uuid anyway for query
  warn(`corporation filter not found in lookups; using as-is: ${raw}`)
  return { localUuids: [lower], nimbleId: raw }
}

export function summarizeMisses(lookups) {
  /** @type {Record<string, number>} */
  const counts = {}
  for (const m of lookups.misses) {
    counts[m.kind] = (counts[m.kind] || 0) + 1
  }
  return counts
}
