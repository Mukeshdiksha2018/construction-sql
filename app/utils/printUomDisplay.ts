/** Minimal UOM row for print resolution (matches `stores/uom` UOM shape). */
export type UomLookupRow = { short_name?: string; uom_name?: string; name?: string }

/**
 * Print tables show a UOM column. Items often store `unit_uuid` while `unit_label`
 * may be empty in API responses — resolve short name from the UOM catalog when needed.
 */
export function resolvePrintUomDisplay(
  item: Record<string, unknown> | null | undefined,
  getUomByUuid: (uuid: string) => UomLookupRow | undefined
): string {
  if (!item || typeof item !== 'object') return ''
  const direct = String(
    item.uom ?? item.uom_label ?? item.unit_label ?? item.unit ?? '',
  ).trim()
  if (direct) return direct
  const uid = item.unit_uuid ?? item.uom_uuid
  if (uid) {
    const u = getUomByUuid(String(uid))
    if (u) return String(u.short_name || u.uom_name || u.name || '').trim()
  }
  return ''
}
