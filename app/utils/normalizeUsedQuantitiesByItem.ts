/** Normalize estimate-quantity-availability API keys to lowercase item_uuid-cost_code_uuid. */
export function normalizeUsedQuantitiesByItem(
  data: Record<string, number> | null | undefined,
): Record<string, number> {
  const normalized: Record<string, number> = {}
  if (!data || typeof data !== 'object') return normalized

  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = String(key).toLowerCase()
    normalized[normalizedKey] = value
  }
  return normalized
}
