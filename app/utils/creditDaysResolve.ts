export const CREDIT_DAYS_MAP: Record<string, number> = {
  NET_15: 15,
  NET_30: 30,
  NET_45: 45,
  NET_60: 60,
  NET_90: 90,
}

export function resolveCreditDaysToCount(creditDaysValue: string | null): number | null {
  if (!creditDaysValue) return null
  const upper = creditDaysValue.toUpperCase()
  if (CREDIT_DAYS_MAP[upper] !== undefined) return CREDIT_DAYS_MAP[upper]
  const match = upper.match(/NET[_\s]?(\d+)/)
  if (match?.[1]) return parseInt(match[1], 10)
  return null
}
