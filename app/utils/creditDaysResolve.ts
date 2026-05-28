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

export type CreditDaysOption = {
  label: string
  value: string
  id?: string | null
  days?: number | null
}

export const STATIC_CREDIT_DAYS_OPTIONS: CreditDaysOption[] = [
  { label: 'Net 15 - Payment due in 15 days', value: 'NET_15', days: 15 },
  { label: 'Net 25 - Payment due in 25 days', value: 'NET_25', days: 25 },
  { label: 'Net 30 - Payment due in 30 days', value: 'NET_30', days: 30 },
  { label: 'Net 45 - Payment due in 45 days', value: 'NET_45', days: 45 },
  { label: 'Net 60 - Payment due in 60 days', value: 'NET_60', days: 60 },
  { label: '50% Deposit - Balance Before Delivery', value: 'DEPOSIT_50_BALANCE_BEFORE_DELIVERY', days: null },
]

export function resolveCreditDaysToDayCount(
  allOptions: readonly CreditDaysOption[],
  creditDays: string | null,
  creditDaysId?: string | null
): number | null {
  const key = String(creditDays || '').trim().toLowerCase()
  const idKey = String(creditDaysId || '').trim()
  if (idKey) {
    const byId = allOptions.find((opt) => String(opt.id || '') === idKey)
    if (typeof byId?.days === 'number') return byId.days
  }
  if (key) {
    const byValue = allOptions.find((opt) => String(opt.value).toLowerCase() === key)
    if (typeof byValue?.days === 'number') return byValue.days
    const byLabel = allOptions.find((opt) => String(opt.label).toLowerCase() === key)
    if (typeof byLabel?.days === 'number') return byLabel.days
  }
  const match = String(creditDays || '').match(/(\d+)/)
  if (match?.[1]) {
    const n = Number(match[1])
    return Number.isFinite(n) ? n : null
  }
  return null
}
