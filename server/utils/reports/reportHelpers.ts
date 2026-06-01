export function parseJson<T = unknown>(val: unknown, fallback: T): T {
  if (val == null || val === '') return fallback
  if (typeof val === 'object') return val as T
  try {
    return JSON.parse(String(val)) as T
  } catch {
    return fallback
  }
}

export function toNum(val: unknown): number {
  if (val == null || val === '') return 0
  const n = typeof val === 'number' ? val : Number(val)
  return Number.isFinite(n) ? n : 0
}

export function parseFinancialTotal(
  financialBreakdown: unknown,
  keys: string[],
  fallbackAmount?: unknown,
): number {
  const breakdown = parseJson<Record<string, unknown>>(financialBreakdown, {})
  const totals = (breakdown?.totals || breakdown || {}) as Record<string, unknown>
  for (const key of keys) {
    const val = totals[key]
    if (val != null && val !== '') {
      const n = toNum(val)
      if (n !== 0) return n
    }
  }
  return toNum(fallbackAmount)
}

export function parseInvoiceTaxAmount(financialBreakdown: unknown): number {
  const breakdown = parseJson<Record<string, unknown>>(financialBreakdown, {})
  const salesTaxes = (breakdown?.sales_taxes || breakdown?.salesTaxes) as Record<string, unknown> | undefined
  if (salesTaxes) {
    const tax1 = salesTaxes.sales_tax_1 as Record<string, unknown> | undefined
    const tax2 = salesTaxes.sales_tax_2 as Record<string, unknown> | undefined
    const t1 = toNum(tax1?.amount ?? (tax1 as any)?.amount_value)
    const t2 = toNum(tax2?.amount ?? (tax2 as any)?.amount_value)
    return t1 + t2
  }
  const totals = (breakdown?.totals || {}) as Record<string, unknown>
  return toNum(totals.tax_total ?? totals.taxTotal)
}

export function normalizeUTC(val: unknown, endOfDay = false): Date | null {
  if (val == null || val === '') return null
  const str = String(val).trim()
  if (!str) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(endOfDay ? `${str}T23:59:59.999Z` : `${str}T00:00:00.000Z`)
  }
  const parsed = new Date(str)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const APPROVED_PO_CO_STATUSES = ['Approved', 'Completed', 'Partially_Received']
