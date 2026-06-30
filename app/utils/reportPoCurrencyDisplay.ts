import {
  convertPoCurrency,
  formatPoCurrency,
  normalizePoCurrencyConversionFields,
  resolveDualCurrencyAmounts,
  roundPoCurrencyValue,
  type PoCurrencyCode,
} from '~/utils/poCurrencyConversion'

export type ReportOrderCurrencyRow = {
  currency_conversion_enabled?: boolean
  currency_from?: PoCurrencyCode | null
  currency_to?: PoCurrencyCode | null
  conversion_rate?: number | null
}

export type VendorPoAmountField =
  | 'goods_amount'
  | 'freight_amount'
  | 'additional_charges'
  | 'hst'
  | 'po_total'

export type VendorPoAmountAggregate = {
  cadTotal: number
  usdFromTotal: number
  showDual: boolean
}

export function getOrderCurrencyFields(row: ReportOrderCurrencyRow) {
  return normalizePoCurrencyConversionFields(row)
}

export function showOrderDualCurrency(row: ReportOrderCurrencyRow): boolean {
  return getOrderCurrencyFields(row).currency_conversion_enabled
}

export function pickVendorOrderAmount(
  order: ReportOrderCurrencyRow & Record<string, unknown>,
  field: VendorPoAmountField
): number {
  return Number(order[field] ?? 0) || 0
}

export type VendorCurrencyAmountSource = ReportOrderCurrencyRow & {
  amount: number
}

/**
 * Vendor contract totals:
 * - CAD total includes every PO/CO (converted to CAD when USD conversion is enabled).
 * - USD total includes only documents with USD from-currency conversion enabled.
 */
export function aggregateVendorCurrencyAmounts(
  sources: VendorCurrencyAmountSource[]
): VendorPoAmountAggregate {
  let cadTotal = 0
  let usdFromTotal = 0
  let hasUsdConversion = false

  for (const source of sources) {
    const amount = Number(source.amount ?? 0) || 0
    const currency = getOrderCurrencyFields(source)

    if (currency.currency_conversion_enabled && currency.currency_from === 'USD') {
      hasUsdConversion = true
      usdFromTotal += amount
      cadTotal +=
        currency.currency_to === 'CAD'
          ? convertPoCurrency(amount, currency.conversion_rate)
          : amount
      continue
    }

    cadTotal += amount
  }

  return {
    cadTotal: roundPoCurrencyValue(cadTotal),
    usdFromTotal: roundPoCurrencyValue(usdFromTotal),
    showDual: hasUsdConversion,
  }
}

export function sumVendorCurrencyAggregates(
  aggregates: VendorPoAmountAggregate[]
): VendorPoAmountAggregate {
  let cadTotal = 0
  let usdFromTotal = 0
  let showDual = false

  for (const aggregate of aggregates) {
    cadTotal += aggregate.cadTotal
    usdFromTotal += aggregate.usdFromTotal
    if (aggregate.showDual) showDual = true
  }

  return {
    cadTotal: roundPoCurrencyValue(cadTotal),
    usdFromTotal: roundPoCurrencyValue(usdFromTotal),
    showDual,
  }
}

export function formatReportVendorCurrencyAggregateForExport(
  aggregate: VendorPoAmountAggregate
): string | number {
  if (!aggregate.showDual) return aggregate.cadTotal
  return formatReportDualCurrencyForExport(
    aggregate.cadTotal,
    aggregate.usdFromTotal
  )
}

/**
 * Vendor PO totals:
 * - CAD total includes every order (converted to CAD when USD conversion is enabled).
 * - USD total includes only orders with USD from-currency conversion enabled.
 */
export function aggregateVendorPoAmount(
  orders: Array<ReportOrderCurrencyRow & Record<string, unknown>>,
  field: VendorPoAmountField
): VendorPoAmountAggregate {
  return aggregateVendorCurrencyAmounts(
    orders.map((order) => ({
      ...order,
      amount: pickVendorOrderAmount(order, field),
    }))
  )
}

export type BreakoutCurrencyAmountEntry = {
  row: ReportOrderCurrencyRow
  amount: number
}

export function aggregateBreakoutCurrencyAmounts(
  entries: BreakoutCurrencyAmountEntry[]
): VendorPoAmountAggregate {
  return aggregateVendorCurrencyAmounts(
    entries.map(({ row, amount }) => ({
      amount,
      ...getOrderCurrencyFields(row),
    }))
  )
}

export function formatReportBreakoutAggregateForExport(
  entries: BreakoutCurrencyAmountEntry[]
): string | number {
  return formatReportVendorCurrencyAggregateForExport(
    aggregateBreakoutCurrencyAmounts(entries)
  )
}

export function formatReportDualCurrencyForExport(
  cadAmount: number,
  usdAmount: number
): string {
  return `${formatPoCurrency(cadAmount, 'CAD')} / ${formatPoCurrency(usdAmount, 'USD')}`
}

export function formatReportVendorPoAmountForExport(
  orders: Array<ReportOrderCurrencyRow & Record<string, unknown>>,
  field: VendorPoAmountField
): string | number {
  const aggregate = aggregateVendorPoAmount(orders, field)
  if (!aggregate.showDual) return aggregate.cadTotal

  return formatReportDualCurrencyForExport(
    aggregate.cadTotal,
    aggregate.usdFromTotal
  )
}

export function formatReportPoAmountForExport(
  amount: number | null | undefined,
  row: ReportOrderCurrencyRow
): string | number {
  const numeric = Number(amount ?? 0) || 0
  const currency = getOrderCurrencyFields(row)
  if (!currency.currency_conversion_enabled) return numeric

  const { cadAmount, usdAmount } = resolveDualCurrencyAmounts(
    numeric,
    currency.currency_from,
    currency.currency_to,
    currency.conversion_rate
  )
  return formatReportDualCurrencyForExport(cadAmount, usdAmount)
}
