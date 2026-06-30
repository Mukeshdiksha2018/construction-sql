import { sumAdjustedAdvancePaymentAmountsTotal } from '~/utils/adjustedAdvancePaymentAggregates'

export type NimblePaidByInvoiceUuid = Record<string, number> | Map<string, number>

export type NimblePaymentRow = {
  amount?: unknown
  paid_status?: unknown
}

/** Matches Nimble/webhook status normalization (partially_paid, Partially Paid, etc.). */
export const normalizeInvoicePaymentStatusKey = (status: unknown): string =>
  String(status ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '')

export const isFullyPaidInvoiceStatus = (status: unknown): boolean =>
  normalizeInvoicePaymentStatusKey(status) === 'paid'

export const isPartiallyPaidInvoiceStatus = (status: unknown): boolean =>
  normalizeInvoicePaymentStatusKey(status) === 'partiallypaid'

export const isUnpaidInvoiceStatus = (status: unknown): boolean =>
  normalizeInvoicePaymentStatusKey(status) === 'unpaid'

export const isApprovedVendorInvoiceStatus = (status: unknown): boolean =>
  normalizeInvoicePaymentStatusKey(status) === 'approved'

/** Vendor invoices included on AP / PO invoice summary reports (post-approval payment states). */
export const isReportEligibleVendorInvoiceStatus = (status: unknown): boolean =>
  isApprovedVendorInvoiceStatus(status) ||
  isUnpaidInvoiceStatus(status) ||
  isFullyPaidInvoiceStatus(status) ||
  isPartiallyPaidInvoiceStatus(status)

export const filterReportEligibleVendorInvoices = <T extends { status?: unknown }>(
  invoices: T[]
): T[] => invoices.filter((inv) => isReportEligibleVendorInvoiceStatus(inv.status))

/** Invoice has (or may have) Nimble bill payment rows in vendor_invoice_nimble_payments. */
export const isNimbleBillLifecycleInvoice = (invoice: any): boolean => {
  if (String(invoice?.nimble_jeid ?? '').trim()) return true
  const status = invoice?.status
  return (
    isFullyPaidInvoiceStatus(status) ||
    isPartiallyPaidInvoiceStatus(status) ||
    isUnpaidInvoiceStatus(status)
  )
}

const normalizeNimblePaidStatusKey = (paidStatus: unknown): string =>
  String(paidStatus ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '')

/** Sum paid Nimble rows (excludes UnPaid remainder lines) — same rules as stamp popover. */
export const sumNimblePaymentRowsAmount = (rows: NimblePaymentRow[]): number => {
  let total = 0
  for (const row of rows) {
    if (normalizeNimblePaidStatusKey(row.paid_status) === 'unpaid') continue
    const raw = row.amount
    const numeric =
      typeof raw === 'number'
        ? raw
        : raw === null || raw === undefined || raw === ''
          ? NaN
          : Number(String(raw).replace(/,/g, ''))
    if (!Number.isFinite(numeric) || numeric <= 0) continue
    total += numeric
  }
  return Math.round((total + Number.EPSILON) * 100) / 100
}

const parseFinancialBreakdown = (raw: unknown): Record<string, any> => {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }
  return typeof raw === 'object' ? (raw as Record<string, any>) : {}
}

const toNumericAmount = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0
  const numeric = typeof value === 'number' ? value : parseFloat(String(value))
  return Number.isFinite(numeric) ? numeric : 0
}

export const roundCurrencyAmount = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Matches FinancialBreakdown: advance/holdback reduce the base before tax is added. */
export const computeLaborInvoiceAmountFromComponents = (input: {
  laborItemTotal: unknown
  chargesTotal?: unknown
  taxTotal?: unknown
  holdbackAmount?: unknown
  advancePaymentDeduction?: unknown
}): number => {
  const labor = roundCurrencyAmount(toNumericAmount(input.laborItemTotal))
  const advance = roundCurrencyAmount(toNumericAmount(input.advancePaymentDeduction))
  const holdback = roundCurrencyAmount(toNumericAmount(input.holdbackAmount))
  const charges = roundCurrencyAmount(toNumericAmount(input.chargesTotal))
  const tax = roundCurrencyAmount(toNumericAmount(input.taxTotal))
  const taxableBase = Math.max(0, roundCurrencyAmount(labor - advance - holdback))
  return roundCurrencyAmount(taxableBase + charges + tax)
}

/**
 * Final total for labor against PO/CO invoices.
 * Stale financial_breakdown totals can store item-only amounts while tax_total is populated;
 * do not infer advance payment from that gap.
 */
export const resolveLaborInvoiceFinancialTotal = (input: {
  laborItemTotal: number
  chargesTotal?: unknown
  taxTotal?: unknown
  holdbackAmount?: unknown
  advancePaymentDeduction?: unknown
  explicitFinalTotal?: unknown
}): number => {
  const laborItemTotal = toNumericAmount(input.laborItemTotal)
  const taxTotal = toNumericAmount(input.taxTotal)
  const explicitFinalTotal = roundCurrencyAmount(toNumericAmount(input.explicitFinalTotal))
  const advance = roundCurrencyAmount(toNumericAmount(input.advancePaymentDeduction))
  const holdback = roundCurrencyAmount(toNumericAmount(input.holdbackAmount))
  const hasDeductions = advance > 0 || holdback > 0

  const computedTotal = computeLaborInvoiceAmountFromComponents(input)

  if (explicitFinalTotal <= 0) {
    return computedTotal
  }

  if (Math.abs(explicitFinalTotal - computedTotal) <= 0.02) {
    return computedTotal
  }

  const gapDueToMissingTax =
    taxTotal > 0 &&
    explicitFinalTotal <= roundCurrencyAmount(laborItemTotal) + 0.02 &&
    computedTotal > explicitFinalTotal + 0.02 &&
    Math.abs(roundCurrencyAmount(computedTotal - explicitFinalTotal) - taxTotal) <= 0.02

  if (gapDueToMissingTax) {
    return computedTotal
  }

  // Stale breakdown total without deductions — only gross-up when the gap is tax/charges omission or rounding.
  // A lower explicit amount may be the saved net after advance/holdback; do not inflate it.
  if (!hasDeductions && explicitFinalTotal < computedTotal - 0.02) {
    const gap = roundCurrencyAmount(computedTotal - explicitFinalTotal)
    if (gap <= 0.1) {
      return computedTotal
    }

    const charges = roundCurrencyAmount(toNumericAmount(input.chargesTotal))
    const preTaxExplicit = roundCurrencyAmount(laborItemTotal + charges)
    const gapDueToTaxOnly =
      taxTotal > 0 &&
      explicitFinalTotal <= preTaxExplicit + 0.02 &&
      Math.abs(gap - taxTotal) <= 0.02
    const gapDueToMissingChargesAndTax =
      explicitFinalTotal <= roundCurrencyAmount(laborItemTotal) + 0.02 &&
      Math.abs(gap - roundCurrencyAmount(charges + taxTotal)) <= 0.02
    if (gapDueToTaxOnly || gapDueToMissingChargesAndTax) {
      return computedTotal
    }
  }

  if (hasDeductions && explicitFinalTotal <= computedTotal + 0.02) {
    return explicitFinalTotal
  }

  return computedTotal
}

const resolveAdvancePaymentDeductionForParse = (
  invoice: any,
  totals: Record<string, any>
): number => {
  const explicit = roundCurrencyAmount(toNumericAmount(invoice?.advance_payment_deduction))
  if (explicit > 0) return explicit

  const adjustedAmounts = invoice?.adjusted_advance_payment_amounts
  const appliedFromAmounts = sumAdjustedAdvancePaymentAmountsTotal(adjustedAmounts)
  if (appliedFromAmounts > 0) return appliedFromAmounts

  const item = toNumericAmount(totals.item_total)
  const charges = toNumericAmount(totals.charges_total)
  const tax = toNumericAmount(totals.tax_total)
  const gross = roundCurrencyAmount(item + charges + tax)

  const netFinal = roundCurrencyAmount(
    toNumericAmount(
      invoice?.amount ??
        totals.total_invoice_amount ??
        totals.amount ??
        invoice?.total_invoice_amount
    )
  )

  if (netFinal > 0 && gross > netFinal + 0.02) {
    const gap = roundCurrencyAmount(gross - netFinal)
    // A gap equal to tax means the saved net is item-only, not an advance deduction.
    if (tax > 0 && Math.abs(gap - roundCurrencyAmount(tax)) <= 0.02) {
      return 0
    }
    return gap
  }

  return 0
}

const resolveInvoiceAmountFromFinancialTotals = (invoice: any, totals: Record<string, any>): number => {
  const hasLaborItems =
    Array.isArray(invoice?.labor_invoice_items) && invoice.labor_invoice_items.length > 0
  const itemTotal = hasLaborItems
    ? invoice.labor_invoice_items.reduce(
        (sum: number, item: any) => sum + toNumericAmount(item?.invoice_amount),
        0
      )
    : toNumericAmount(totals.item_total)

  const holdbackAmount = roundCurrencyAmount(toNumericAmount(totals.holdback_amount))

  // The stored advance_payment_deduction is the TOTAL reduction (advance + holdback) since the
  // save derives it as gross - net. Strip the holdback portion so it isn't subtracted twice
  // (once here as "advance" and again via holdbackAmount below).
  const totalDeduction = resolveAdvancePaymentDeductionForParse(invoice, totals)
  const advancePaymentDeduction = Math.max(0, roundCurrencyAmount(totalDeduction - holdbackAmount))

  const explicitFinalTotal =
    invoice?.amount ??
    totals.total_invoice_amount ??
    totals.amount ??
    invoice?.total_invoice_amount

  return resolveLaborInvoiceFinancialTotal({
    laborItemTotal: itemTotal,
    chargesTotal: totals.charges_total,
    taxTotal: totals.tax_total,
    holdbackAmount,
    advancePaymentDeduction,
    explicitFinalTotal,
  })
}

/** Invoice amount from saved total_invoice_amount / financial_breakdown / amount. */
export const parseInvoiceAmountFromRecord = (invoice: any): number => {
  const fb = parseFinancialBreakdown(invoice?.financial_breakdown)
  const totals = fb?.totals

  if (totals) {
    const resolved = resolveInvoiceAmountFromFinancialTotals(invoice, totals)
    if (resolved > 0) return resolved
  }

  let amount = invoice?.total_invoice_amount ?? invoice?.amount ?? 0

  if (!amount || Number(amount) === 0) {
    amount = totals?.total_invoice_amount ?? totals?.amount ?? 0
  }

  const numeric = typeof amount === 'number' ? amount : parseFloat(String(amount))
  return Number.isFinite(numeric) ? numeric : 0
}

export const parseHoldbackAmountFromRecord = (invoice: any): number => {
  const fb = parseFinancialBreakdown(invoice?.financial_breakdown)
  let holdbackAmount = fb?.totals?.holdback_amount ?? 0

  if (!holdbackAmount || Number(holdbackAmount) === 0) {
    holdbackAmount = invoice?.holdback_amount ?? 0
  }

  const numeric =
    typeof holdbackAmount === 'number'
      ? holdbackAmount
      : parseFloat(String(holdbackAmount))
  return Number.isFinite(numeric) ? numeric : 0
}

export const sumTotalInvoicedFromInvoices = (invoices: any[]): number =>
  invoices.reduce((sum, invoice) => sum + parseInvoiceAmountFromRecord(invoice), 0)

/** PO/CO invoice summary report — net progress amounts plus advance/holdback invoices. */
export const sumPoCoReportTotalInvoicedFromInvoices = (invoices: any[]): number =>
  roundCurrencyAmount(
    invoices.reduce((sum, invoice) => sum + parseInvoiceAmountFromRecord(invoice), 0)
  )

export const sumHoldbackFromInvoices = (invoices: any[]): number =>
  invoices.reduce((sum, invoice) => sum + parseHoldbackAmountFromRecord(invoice), 0)

const lookupNimblePaidAmount = (
  invoiceUuid: string,
  nimblePaidByInvoiceUuid: NimblePaidByInvoiceUuid
): number => {
  if (!invoiceUuid) return 0
  if (nimblePaidByInvoiceUuid instanceof Map) {
    return nimblePaidByInvoiceUuid.get(invoiceUuid) || 0
  }
  return nimblePaidByInvoiceUuid[invoiceUuid] || 0
}

/** Paid amount: full invoice for Paid status, Nimble rows for partially_paid. */
export const computeInvoicePaidAmount = (
  invoice: any,
  nimblePaidByInvoiceUuid: NimblePaidByInvoiceUuid = {}
): number => {
  if (isFullyPaidInvoiceStatus(invoice?.status)) {
    return parseInvoiceAmountFromRecord(invoice)
  }
  if (isPartiallyPaidInvoiceStatus(invoice?.status)) {
    const invoiceUuid = String(invoice?.uuid || '').trim()
    return lookupNimblePaidAmount(invoiceUuid, nimblePaidByInvoiceUuid)
  }
  return 0
}

/**
 * Report paid amount per invoice: prefer vendor_invoice_nimble_payments totals (same DB source
 * as GET /api/vendor-invoices/:uuid/nimble-payments stamp popover), then fall back to full
 * invoice amount when status is Paid and no payment rows exist.
 * Partially paid invoices rely on Nimble rows; unpaid invoices with no rows contribute 0.
 */
export const resolveBudgetReportPaidAmount = (
  invoice: any,
  nimblePaidByInvoiceUuid: NimblePaidByInvoiceUuid = {}
): number => {
  const invoiceUuid = String(invoice?.uuid || '').trim()
  const nimblePaid = lookupNimblePaidAmount(invoiceUuid, nimblePaidByInvoiceUuid)
  if (nimblePaid > 0) return nimblePaid
  if (isFullyPaidInvoiceStatus(invoice?.status)) {
    return parseInvoiceAmountFromRecord(invoice)
  }
  return 0
}

export const sumTotalPaidFromInvoices = (
  invoices: any[],
  nimblePaidByInvoiceUuid: NimblePaidByInvoiceUuid = {}
): number =>
  invoices.reduce(
    (sum, invoice) =>
      sum + resolveBudgetReportPaidAmount(invoice, nimblePaidByInvoiceUuid),
    0
  )

export const collectPartiallyPaidInvoiceUuids = (invoices: any[]): string[] => [
  ...new Set(
    invoices
      .filter((invoice) => isPartiallyPaidInvoiceStatus(invoice?.status))
      .map((invoice) => String(invoice?.uuid || '').trim())
      .filter(Boolean)
  ),
]

/**
 * Invoice UUIDs to load from vendor_invoice_nimble_payments.
 * Includes every invoice on the PO/CO so unpaid, partially_paid, and paid amounts consolidate
 * correctly (payment rows are the source of truth; status-only filtering misses unpaid bills).
 */
export const collectNimblePaidInvoiceUuids = (invoices: any[]): string[] => [
  ...new Set(
    invoices
      .map((invoice) => String(invoice?.uuid || '').trim())
      .filter(Boolean)
  ),
]
