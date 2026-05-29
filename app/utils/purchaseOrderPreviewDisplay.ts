export function trimDisplayStr(v: unknown): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

export function looksLikeUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(s).trim()
  )
}

export function resolveFreightUuidFromPo(po: any): string {
  const explicit = trimDisplayStr(po?.freight_uuid)
  if (explicit) return explicit
  const freightCol = trimDisplayStr(po?.freight)
  return freightCol && looksLikeUuid(freightCol) ? freightCol : ''
}

export function resolveShipViaUuidFromPo(po: any): string {
  const explicit = trimDisplayStr(po?.ship_via_uuid)
  if (explicit) return explicit
  const shipViaCol = trimDisplayStr(po?.ship_via)
  return shipViaCol && looksLikeUuid(shipViaCol) ? shipViaCol : ''
}

export function resolveFreightDisplayLabel(
  po: any,
  getFreightByUuid: (uuid: string) => { freight_name?: string; description?: string | null } | undefined,
  getShipViaByUuid: (uuid: string) => { ship_via?: string; description?: string | null } | undefined,
): string {
  if (!po) return ''

  const freightUuid = resolveFreightUuidFromPo(po)
  if (freightUuid) {
    const freightRecord = getFreightByUuid(freightUuid)
    const name = trimDisplayStr(freightRecord?.freight_name)
    if (name) return name
    if (freightRecord?.description) return trimDisplayStr(freightRecord.description)
  }

  const freightText = trimDisplayStr(po.freight)
  if (freightText && !looksLikeUuid(freightText)) return freightText

  const shipViaUuid = resolveShipViaUuidFromPo(po)
  if (shipViaUuid) {
    const sv = getShipViaByUuid(shipViaUuid)
    const via = trimDisplayStr(sv?.ship_via)
    if (via) return via
    if (sv?.description) return trimDisplayStr(sv.description)
  }

  const shipViaText = trimDisplayStr(po.ship_via)
  if (shipViaText && !looksLikeUuid(shipViaText)) return shipViaText

  return ''
}

export function normalizeLocationWiseMaterialItems(po: any): any[] {
  if (!po) return []
  if (Array.isArray(po.location_wise_material)) return po.location_wise_material
  if (Array.isArray(po.po_location_wise_material_items)) return po.po_location_wise_material_items
  return []
}

/** Read charge/tax amounts from financial_breakdown with fallback to top-level PO fields. */
export function getPoFinancialValue(po: any, path: string, fallbackPath?: string): number {
  if (!po) return 0

  const breakdown = po.financial_breakdown
  if (breakdown && typeof breakdown === 'object') {
    const value = path.split('.').reduce((obj: any, key: string) => obj?.[key], breakdown)
    if (value !== null && value !== undefined) {
      return parseFloat(value) || 0
    }
  }

  const directValue = fallbackPath ? po[fallbackPath] : po[path]
  return parseFloat(directValue) || 0
}
