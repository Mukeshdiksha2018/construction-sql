export function parseAdvancePaymentAmount(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  const normalized = String(value).replace(/,/g, '').trim()
  if (!normalized) return 0
  const numeric = Number(normalized)
  return Number.isFinite(numeric) ? numeric : 0
}

export function roundAdvancePaymentCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Sum advance_amount / advanceAmount from Advance Payment Distribution rows. */
export function sumAdvancePaymentCostCodeAmounts(rows: unknown): number {
  if (!Array.isArray(rows)) return 0

  const total = rows.reduce((sum: number, row: Record<string, unknown>) => {
    const raw = row.advanceAmount ?? row.advance_amount
    return sum + parseAdvancePaymentAmount(raw)
  }, 0)

  return roundAdvancePaymentCurrency(total)
}

export function resolveAdvancePaymentInvoiceTotals(
  form: Record<string, any>,
  itemTotal: number,
  taxTotalOverride?: number | null,
): { itemTotal: number; taxTotal: number; totalInvoiceAmount: number } {
  const normalizedItemTotal = roundAdvancePaymentCurrency(itemTotal)

  const taxTotal =
    taxTotalOverride !== undefined && taxTotalOverride !== null
      ? roundAdvancePaymentCurrency(taxTotalOverride)
      : roundAdvancePaymentCurrency(
          parseAdvancePaymentAmount(form.financial_breakdown?.totals?.tax_total),
        )

  const totalInvoiceAmount = roundAdvancePaymentCurrency(
    normalizedItemTotal + taxTotal,
  )

  return {
    itemTotal: normalizedItemTotal,
    taxTotal,
    totalInvoiceAmount,
  }
}

export function syncAdvancePaymentInvoiceFinancialTotals(
  form: Record<string, any>,
  itemTotal: number,
  taxTotalOverride?: number | null,
): number {
  const { itemTotal: normalizedItemTotal, taxTotal, totalInvoiceAmount } =
    resolveAdvancePaymentInvoiceTotals(form, itemTotal, taxTotalOverride)

  if (!form.financial_breakdown || typeof form.financial_breakdown !== 'object') {
    form.financial_breakdown = {
      charges: {
        freight: { percentage: null, amount: null, taxable: false },
        packing: { percentage: null, amount: null, taxable: false },
        custom_duties: { percentage: null, amount: null, taxable: false },
        other: { percentage: null, amount: null, taxable: false },
      },
      sales_taxes: {
        sales_tax_1: { percentage: null, amount: null },
        sales_tax_2: { percentage: null, amount: null },
      },
      totals: {},
    }
  }

  if (!form.financial_breakdown.totals || typeof form.financial_breakdown.totals !== 'object') {
    form.financial_breakdown.totals = {}
  }

  const totals = form.financial_breakdown.totals as Record<string, unknown>
  totals.item_total = normalizedItemTotal
  totals.charges_total = 0
  totals.tax_total = taxTotal
  totals.total_invoice_amount = totalInvoiceAmount
  totals.amount = totalInvoiceAmount
  form.amount = totalInvoiceAmount

  return totalInvoiceAmount
}
