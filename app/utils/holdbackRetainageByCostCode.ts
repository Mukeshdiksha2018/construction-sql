import { isTaxAdjustmentKey } from '@/utils/advancePaymentTaxAdjustmentKeys'
import { applyEqualAdvanceDeductionToBreakdown } from '@/utils/applyEqualAdvanceDeductionToBreakdown'

export function getAdvanceAdjustmentsByCostCode(holdbackInvoice: any): Map<string, number> {
  const result = new Map<string, number>()
  if (!holdbackInvoice) return result

  const raw = holdbackInvoice.adjusted_advance_payment_amounts
  let adjustments: Record<string, Record<string, number>> | null = null
  if (raw && typeof raw === 'object') {
    adjustments = raw as Record<string, Record<string, number>>
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        adjustments = parsed as Record<string, Record<string, number>>
      }
    } catch {
      adjustments = null
    }
  }

  if (!adjustments) return result

  for (const byCostCode of Object.values(adjustments)) {
    if (!byCostCode || typeof byCostCode !== 'object') continue
    for (const [costCodeUuid, amount] of Object.entries(byCostCode)) {
      if (!costCodeUuid || isTaxAdjustmentKey(costCodeUuid)) continue
      const n = parseFloat(String(amount || 0)) || 0
      if (n <= 0) continue
      result.set(costCodeUuid, (result.get(costCodeUuid) || 0) + n)
    }
  }

  return result
}

export function getAdvanceTaxAdjustmentsTotal(holdbackInvoice: any): number {
  if (!holdbackInvoice) return 0

  const raw = holdbackInvoice.adjusted_advance_payment_amounts
  let adjustments: Record<string, Record<string, number>> | null = null
  if (raw && typeof raw === 'object') {
    adjustments = raw as Record<string, Record<string, number>>
  } else if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        adjustments = parsed as Record<string, Record<string, number>>
      }
    } catch {
      adjustments = null
    }
  }
  if (!adjustments) return 0

  let total = 0
  for (const byCostCode of Object.values(adjustments)) {
    if (!byCostCode || typeof byCostCode !== 'object') continue
    for (const [costCodeUuid, amount] of Object.entries(byCostCode)) {
      if (!isTaxAdjustmentKey(costCodeUuid)) continue
      total += parseFloat(String(amount || 0)) || 0
    }
  }

  return Math.round((total + Number.EPSILON) * 100) / 100
}

// eslint-disable-next-line complexity
function resolveItemLineTotal(item: any, preferInvoiceAmountFirst: boolean): number {
  if (preferInvoiceAmountFirst) {
    const ia = parseFloat(String(item.invoice_amount ?? '')) || 0
    if (ia > 0) return ia
  }

  if (item.invoice_total !== null && item.invoice_total !== undefined) {
    return parseFloat(String(item.invoice_total)) || 0
  }
  if (item.co_total !== null && item.co_total !== undefined) {
    return parseFloat(String(item.co_total)) || 0
  }
  if (item.po_total !== null && item.po_total !== undefined) {
    return parseFloat(String(item.po_total)) || 0
  }
  if (item.total !== null && item.total !== undefined) {
    return parseFloat(String(item.total)) || 0
  }
  if (item.po_amount !== null && item.po_amount !== undefined) {
    return parseFloat(String(item.po_amount)) || 0
  }
  if (item.co_amount !== null && item.co_amount !== undefined) {
    return parseFloat(String(item.co_amount)) || 0
  }
  if (item.invoice_amount !== null && item.invoice_amount !== undefined) {
    return parseFloat(String(item.invoice_amount)) || 0
  }
  return 0
}

/**
 * Retainage (holdback) per cost code for a source AGAINST_PO / AGAINST_CO invoice.
 * Matches HoldbackBreakdownTable / Configure COA: advances and equal tax advances, then holdback %.
 */
export function computeRetainageAmountsByCostCode(
  items: any[],
  holdbackInvoice: any,
  options?: { preferInvoiceAmountFirst?: boolean }
): Map<string, number> {
  const retainageMap = new Map<string, number>()
  const preferInvoiceAmountFirst = Boolean(options?.preferInvoiceAmountFirst)

  if (!holdbackInvoice) {
    return retainageMap
  }

  let holdbackAmount = 0
  let holdbackPercentage = 0

  let invoiceFinancialBreakdown = holdbackInvoice.financial_breakdown
  if (typeof invoiceFinancialBreakdown === 'string') {
    try {
      invoiceFinancialBreakdown = JSON.parse(invoiceFinancialBreakdown)
    } catch {
      // ignore
    }
  }

  if (invoiceFinancialBreakdown && typeof invoiceFinancialBreakdown === 'object' && invoiceFinancialBreakdown.totals) {
    const holdbackValue =
      invoiceFinancialBreakdown.totals.holdback_amount ||
      invoiceFinancialBreakdown.totals.holdbackAmount ||
      invoiceFinancialBreakdown.totals['holdback_amount'] ||
      invoiceFinancialBreakdown.totals['holdbackAmount']
    if (holdbackValue !== null && holdbackValue !== undefined && holdbackValue !== '') {
      const parsedValue =
        typeof holdbackValue === 'number' ? holdbackValue : parseFloat(String(holdbackValue)) || 0
      if (parsedValue > 0) {
        holdbackAmount = parsedValue
      }
    }
  }

  const holdbackPctRaw = holdbackInvoice.holdback
  const parsedPct = typeof holdbackPctRaw === 'number' ? holdbackPctRaw : parseFloat(String(holdbackPctRaw || '0')) || 0
  if (parsedPct > 0) {
    holdbackPercentage = parsedPct
  }

  if (holdbackAmount === 0) {
    const invoiceAmount =
      typeof holdbackInvoice.amount === 'number' ? holdbackInvoice.amount : parseFloat(String(holdbackInvoice.amount || '0')) || 0
    const hbPct =
      typeof holdbackInvoice.holdback === 'number'
        ? holdbackInvoice.holdback
        : parseFloat(String(holdbackInvoice.holdback || '0')) || 0

    if (hbPct > 0 && invoiceAmount > 0) {
      holdbackAmount = (invoiceAmount * hbPct) / 100
    }
  }

  // Match legacy HoldbackBreakdownTable: no line-item retainage if totals never produced a holdback dollar amount.
  // Per-cost-code % below still uses holdbackPercentage from the invoice row when present.
  if (holdbackAmount === 0) {
    return retainageMap
  }

  const costCodeTotals = new Map<string, number>()
  let totalItemAmount = 0
  const advanceAdjustmentsByCostCode = getAdvanceAdjustmentsByCostCode(holdbackInvoice)
  const advanceTaxAdjustmentsTotal = getAdvanceTaxAdjustmentsTotal(holdbackInvoice)

  items.forEach((item: any) => {
    const costCodeUuid = item.cost_code_uuid || null
    if (!costCodeUuid) return

    const itemTotal = resolveItemLineTotal(item, preferInvoiceAmountFirst)
    const currentTotal = costCodeTotals.get(costCodeUuid) || 0
    costCodeTotals.set(costCodeUuid, currentTotal + itemTotal)
    totalItemAmount += itemTotal
  })

  costCodeTotals.forEach((grossTotal, costCodeUuid) => {
    const advanceDeduction = advanceAdjustmentsByCostCode.get(costCodeUuid) || 0
    const netTotal = Math.max(0, grossTotal - advanceDeduction)
    costCodeTotals.set(costCodeUuid, netTotal)
  })

  if (advanceTaxAdjustmentsTotal > 0 && costCodeTotals.size > 0) {
    const rows = Array.from(costCodeTotals.entries()).map(([costCodeUuid, total]) => ({
      accountUuid: costCodeUuid,
      total,
    }))
    const afterTaxAdvance = applyEqualAdvanceDeductionToBreakdown(rows, advanceTaxAdjustmentsTotal)
    costCodeTotals.clear()
    for (const row of afterTaxAdvance) {
      costCodeTotals.set(row.accountUuid, row.total)
    }
  }

  totalItemAmount = Array.from(costCodeTotals.values()).reduce((s, v) => s + v, 0)

  if (holdbackPercentage > 0) {
    costCodeTotals.forEach((costCodeTotal, costCodeUuid) => {
      const retainageAmount = (costCodeTotal * holdbackPercentage) / 100
      retainageMap.set(costCodeUuid, Math.round((retainageAmount + Number.EPSILON) * 100) / 100)
    })
    return retainageMap
  }

  if (totalItemAmount > 0) {
    costCodeTotals.forEach((costCodeTotal, costCodeUuid) => {
      const proportion = costCodeTotal / totalItemAmount
      const retainageAmount = holdbackAmount * proportion
      retainageMap.set(costCodeUuid, Math.round((retainageAmount + Number.EPSILON) * 100) / 100)
    })
  }

  return retainageMap
}

/** Same source-item resolution as HoldbackBreakdownTable (labor vs PO/CO lines). */
export function resolveSourceItemsFromVendorInvoicePayload(
  invoice: any,
  isLaborPO: boolean,
  isLaborCO: boolean
): any[] {
  if (!invoice) return []

  const laborItems = Array.isArray(invoice.labor_invoice_items) ? invoice.labor_invoice_items : []
  const poItems = Array.isArray(invoice.po_invoice_items) ? invoice.po_invoice_items : []
  const coItems = Array.isArray(invoice.co_invoice_items) ? invoice.co_invoice_items : []
  const poLwmItems = Array.isArray(invoice.po_lwm_invoice_items) ? invoice.po_lwm_invoice_items : []
  const coLwmItems = Array.isArray(invoice.co_lwm_invoice_items) ? invoice.co_lwm_invoice_items : []

  if ((isLaborPO || isLaborCO) && laborItems.length > 0) {
    return [...laborItems]
  }

  if (invoice.invoice_type === 'AGAINST_PO') {
    const poSource = [...poItems, ...poLwmItems]
    if (poSource.length > 0) return poSource
  } else if (invoice.invoice_type === 'AGAINST_CO') {
    const coSource = [...coItems, ...coLwmItems]
    if (coSource.length > 0) return coSource
  }

  if (laborItems.length > 0) return [...laborItems]
  return [...poItems, ...poLwmItems, ...coItems, ...coLwmItems]
}
