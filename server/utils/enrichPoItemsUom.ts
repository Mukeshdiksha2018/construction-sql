import type { H3Event } from 'h3'
import { normalizeNimbleEntityId } from '../../app/utils/nimbleVendorMaster'
import { resolveNimbleBearerForEvent } from './nimbleBearer'

type NimbleUomRow = {
  ID?: string
  ShortName?: string
  UOMName?: string
}

let uomCatalogCache: { map: Map<string, string>; expiresAt: number } | null = null
const UOM_CACHE_MS = 5 * 60 * 1000

async function loadUomLabelMap(event: H3Event): Promise<Map<string, string>> {
  const now = Date.now()
  if (uomCatalogCache && uomCatalogCache.expiresAt > now) {
    return uomCatalogCache.map
  }

  const bearer = resolveNimbleBearerForEvent(event)
  if (!bearer) return new Map()

  const config = useRuntimeConfig()
  const baseUrl = String((config as Record<string, unknown>).nimbleApiBaseUrl || '').trim().replace(/\/$/, '')
  if (!baseUrl) return new Map()

  try {
    const data = await $fetch<{ UOMDTO?: NimbleUomRow[] }>(`${baseUrl}/v1/UOM/List`, {
      headers: { Authorization: `Bearer ${bearer}` },
    })
    const map = new Map<string, string>()
    for (const row of data?.UOMDTO ?? []) {
      const id = normalizeNimbleEntityId(row.ID)
      const label = String(row.ShortName || row.UOMName || '').trim()
      if (id && label) map.set(id, label)
    }
    uomCatalogCache = { map, expiresAt: now + UOM_CACHE_MS }
    return map
  }
  catch (e) {
    console.warn('[PO Print] enrichPoItemsUom — Nimble UOM list failed', String(e))
    return new Map()
  }
}

/** Fill empty `unit_label` from Nimble UOM catalog using session cookie on the request. */
export async function enrichPoItemsWithUomLabels<T extends Record<string, unknown>>(
  items: T[],
  event: H3Event,
): Promise<T[]> {
  const needsResolve = items.some((item) => {
    const uid = item.unit_uuid ?? item.uom_uuid
    const label = String(item.unit_label ?? item.uom_label ?? '').trim()
    return uid && !label
  })
  if (!needsResolve) return items

  const uomMap = await loadUomLabelMap(event)
  if (!uomMap.size) return items

  return items.map((item) => {
    const label = String(item.unit_label ?? item.uom_label ?? '').trim()
    if (label) return item

    const uid = normalizeNimbleEntityId(item.unit_uuid ?? item.uom_uuid)
    const resolved = uid ? uomMap.get(uid) : ''
    if (!resolved) return item

    return {
      ...item,
      unit_label: resolved,
      uom_label: resolved,
      uom: resolved,
      unit: resolved,
    }
  })
}
