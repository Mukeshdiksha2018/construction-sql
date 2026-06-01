/**
 * Holdback accrued on progress invoices (AGAINST_PO / AGAINST_CO) from financial_breakdown.totals,
 * with fallback to holdback % × (item_total + charges_total + tax_total).
 */
export function accruedHoldbackFromProgressInvoice(invoice: {
  financial_breakdown?: unknown
  holdback?: string | number | null
}): number {
  let breakdown: any = null
  if (invoice.financial_breakdown != null) {
    try {
      breakdown =
        typeof invoice.financial_breakdown === 'string'
          ? JSON.parse(invoice.financial_breakdown)
          : invoice.financial_breakdown
    } catch {
      breakdown = null
    }
  }
  if (breakdown && typeof breakdown === 'object' && breakdown.totals) {
    const t = breakdown.totals
    const raw = t.holdback_amount ?? t.holdbackAmount
    if (raw !== null && raw !== undefined && raw !== '') {
      const n = typeof raw === 'number' ? raw : parseFloat(String(raw))
      if (!Number.isNaN(n) && n > 0) return n
    }
  }
  const pct = parseFloat(String(invoice.holdback ?? '0')) || 0
  if (pct > 0 && breakdown?.totals) {
    const t2 = breakdown.totals
    const item = parseFloat(String(t2.item_total ?? 0)) || 0
    const charges = parseFloat(String(t2.charges_total ?? 0)) || 0
    const tax = parseFloat(String(t2.tax_total ?? 0)) || 0
    const base = item + charges + tax
    if (base > 0) return (base * pct) / 100
  }
  return 0
}
