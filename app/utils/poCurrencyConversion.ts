export const PO_SUPPORTED_CURRENCIES = ['CAD', 'USD'] as const

export type PoCurrencyCode = (typeof PO_SUPPORTED_CURRENCIES)[number]

export const PO_CURRENCY_META: Record<
  PoCurrencyCode,
  { countryCode: string; label: string }
> = {
  CAD: { countryCode: 'CA', label: 'CAD' },
  USD: { countryCode: 'US', label: 'USD' },
}

export const PO_CONVERSION_RATE_MAX_DECIMALS = 10

/** Min width for the rate input: integer digits, dot, max decimals, plus padding. */
export const PO_CONVERSION_RATE_INPUT_MIN_CHARS =
  4 + 1 + PO_CONVERSION_RATE_MAX_DECIMALS + 3

export function roundPoConversionRate(
  rate: number | string | null | undefined
): number {
  const numeric =
    typeof rate === 'string' ? parseFloat(rate) : Number(rate ?? 0)
  if (!Number.isFinite(numeric) || numeric < 0) return 0
  const factor = Math.pow(10, PO_CONVERSION_RATE_MAX_DECIMALS)
  return Math.round((numeric + Number.EPSILON) * factor) / factor
}

export function sanitizePoConversionRateInput(value: string): string {
  const raw = String(value ?? '').replace(/,/g, '').trim()
  if (!raw) return ''

  let result = ''
  let hasDot = false
  let decimals = 0

  for (const ch of raw) {
    if (ch >= '0' && ch <= '9') {
      if (hasDot) {
        if (decimals >= PO_CONVERSION_RATE_MAX_DECIMALS) continue
        decimals++
      }
      result += ch
      continue
    }
    if (ch === '.' && !hasDot) {
      result += ch
      hasDot = true
    }
  }

  return result
}

export function formatPoConversionRateDisplay(
  rate: number | string | null | undefined
): string {
  const rounded = roundPoConversionRate(rate)
  if (!Number.isFinite(rounded)) return '0'
  const fixed = rounded.toFixed(PO_CONVERSION_RATE_MAX_DECIMALS)
  return fixed.replace(/\.?0+$/, '') || '0'
}

export function roundPoCurrencyValue(
  amount: number | string | null | undefined
): number {
  const numericAmount =
    typeof amount === 'string' ? parseFloat(amount) : Number(amount ?? 0)
  if (!Number.isFinite(numericAmount)) return 0
  return Math.round(numericAmount * 100) / 100
}

export function formatPoCurrency(
  amount: number | string | null | undefined,
  _currencyCode?: PoCurrencyCode
): string {
  const numericAmount = roundPoCurrencyValue(amount)

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount)
  } catch {
    return `$${numericAmount.toFixed(2)}`
  }
}

/** PO/CO item table column header, e.g. "Unit Price (USD)". */
export function formatPoAmountColumnHeader(
  label: string,
  currency: unknown
): string {
  const code =
    normalizePoCurrencyCode(currency) ??
    PO_CURRENCY_CONVERSION_DEFAULTS.currency_from
  return `${label} (${code})`
}

export function convertPoCurrency(
  amount: number | string | null | undefined,
  conversionRate: number | string | null | undefined
): number {
  const numericAmount = roundPoCurrencyValue(amount)
  const numericRate =
    typeof conversionRate === 'string'
      ? parseFloat(conversionRate)
      : Number(conversionRate ?? 0)
  if (!Number.isFinite(numericRate) || numericRate < 0) return 0
  return roundPoCurrencyValue(numericAmount * numericRate)
}

/** Resolve display amounts with CAD first and USD second for dual-currency UI. */
export function resolveDualCurrencyAmounts(
  amount: number | string | null | undefined,
  fromCurrency: PoCurrencyCode,
  _toCurrency: PoCurrencyCode,
  conversionRate: number | string | null | undefined
): { cadAmount: number; usdAmount: number } {
  const numeric = roundPoCurrencyValue(amount)

  if (fromCurrency === 'CAD') {
    return {
      cadAmount: numeric,
      usdAmount: convertPoCurrency(numeric, conversionRate),
    }
  }

  return {
    cadAmount: convertPoCurrency(numeric, conversionRate),
    usdAmount: numeric,
  }
}

export function invertPoConversionRate(
  rate: number | string | null | undefined
): number {
  const numericRate =
    typeof rate === 'string' ? parseFloat(rate) : Number(rate ?? 0)
  if (!Number.isFinite(numericRate) || numericRate <= 0) return 1
  return roundPoConversionRate(1 / numericRate) || 1
}

export function getOtherPoCurrency(
  currency: PoCurrencyCode
): PoCurrencyCode {
  return currency === 'CAD' ? 'USD' : 'CAD'
}

export function formatPoCurrencyRateSummary(
  fromCurrency: PoCurrencyCode,
  toCurrency: PoCurrencyCode,
  conversionRate: number | string | null | undefined
): string {
  const rate = formatPoConversionRateDisplay(conversionRate)
  return `1 ${fromCurrency} = ${rate} ${toCurrency}`
}

export const PO_CURRENCY_CONVERSION_DEFAULTS = {
  currency_conversion_enabled: false,
  currency_from: 'CAD' as PoCurrencyCode,
  currency_to: 'USD' as PoCurrencyCode,
  conversion_rate: 1,
}

export function normalizePoCurrencyCode(
  value: unknown
): PoCurrencyCode | null {
  const code = String(value ?? '').trim().toUpperCase()
  if (code === 'CAD' || code === 'USD') return code
  return null
}

export function normalizePoConversionRate(
  value: unknown
): number {
  const numeric =
    typeof value === 'string' ? parseFloat(value) : Number(value ?? 1)
  if (!Number.isFinite(numeric) || numeric < 0) return 1
  const rounded = roundPoConversionRate(numeric)
  return rounded > 0 ? rounded : 1
}

export type PoCurrencyConversionFields = {
  currency_conversion_enabled: boolean
  currency_from: PoCurrencyCode
  currency_to: PoCurrencyCode
  conversion_rate: number
}

export function normalizePoCurrencyConversionFields(
  input: Record<string, unknown> | null | undefined
): PoCurrencyConversionFields {
  const enabled = input?.currency_conversion_enabled === true
  const from =
    normalizePoCurrencyCode(input?.currency_from) ??
    PO_CURRENCY_CONVERSION_DEFAULTS.currency_from
  let to =
    normalizePoCurrencyCode(input?.currency_to) ??
    PO_CURRENCY_CONVERSION_DEFAULTS.currency_to
  if (from === to) {
    to = getOtherPoCurrency(from)
  }
  return {
    currency_conversion_enabled: enabled,
    currency_from: from,
    currency_to: to,
    conversion_rate: normalizePoConversionRate(input?.conversion_rate),
  }
}

/** Row shape returned when looking up the latest PO/CO with conversion enabled. */
export type RecentCurrencyConversionCandidate = {
  currency_from?: unknown
  currency_to?: unknown
  conversion_rate?: unknown
  created_at?: string | null
}

function recentCurrencyCandidateTimestamp(
  row: RecentCurrencyConversionCandidate
): number {
  const ts = new Date(String(row.created_at ?? '')).getTime()
  return Number.isFinite(ts) ? ts : 0
}

function recentCurrencyCandidateToFields(
  row: RecentCurrencyConversionCandidate
): PoCurrencyConversionFields {
  return normalizePoCurrencyConversionFields({
    currency_conversion_enabled: true,
    currency_from: row.currency_from,
    currency_to: row.currency_to,
    conversion_rate: row.conversion_rate,
  })
}

/**
 * Pick conversion settings from the more recently created PO or CO candidate.
 * Used when pre-filling exchange rate from corporation history.
 */
export function pickMoreRecentCurrencyConversion(
  purchaseOrder: RecentCurrencyConversionCandidate | null | undefined,
  changeOrder: RecentCurrencyConversionCandidate | null | undefined
): PoCurrencyConversionFields | null {
  const po = purchaseOrder ? recentCurrencyCandidateToFields(purchaseOrder) : null
  const co = changeOrder ? recentCurrencyCandidateToFields(changeOrder) : null
  const poTs = purchaseOrder ? recentCurrencyCandidateTimestamp(purchaseOrder) : 0
  const coTs = changeOrder ? recentCurrencyCandidateTimestamp(changeOrder) : 0

  if (!po && !co) return null
  if (po && !co) return po
  if (co && !po) return co
  return poTs >= coTs ? po : co
}

/** Row with currency_from used for vendor-scoped recent currency lookup. */
export type RecentVendorCurrencyCandidate = {
  currency_from?: unknown
  created_at?: string | null
}

/**
 * Pick the from-currency from the more recently created PO or CO for a vendor.
 */
export function pickMoreRecentVendorCurrencyFrom(
  purchaseOrder: RecentVendorCurrencyCandidate | null | undefined,
  changeOrder: RecentVendorCurrencyCandidate | null | undefined
): PoCurrencyCode | null {
  const poFrom = purchaseOrder
    ? normalizePoCurrencyCode(purchaseOrder.currency_from)
    : null
  const coFrom = changeOrder
    ? normalizePoCurrencyCode(changeOrder.currency_from)
    : null
  const poTs = purchaseOrder ? recentCurrencyCandidateTimestamp(purchaseOrder) : 0
  const coTs = changeOrder ? recentCurrencyCandidateTimestamp(changeOrder) : 0

  if (!poFrom && !coFrom) return null
  if (poFrom && !coFrom) return poFrom
  if (coFrom && !poFrom) return coFrom
  return poTs >= coTs ? poFrom : coFrom
}

/**
 * Derive PO conversion fields from the selected from-currency.
 * CAD: conversion off, amounts in CAD.
 * USD: conversion on (USD → CAD), amounts stored in USD.
 */
export function syncPoCurrencyConversionForFromCurrency(
  from: PoCurrencyCode,
  options?: { conversionRate?: number }
): PoCurrencyConversionFields {
  if (from === 'CAD') {
    return {
      currency_conversion_enabled: false,
      currency_from: 'CAD',
      currency_to: 'USD',
      conversion_rate: 1,
    }
  }
  return {
    currency_conversion_enabled: true,
    currency_from: 'USD',
    currency_to: 'CAD',
    conversion_rate: normalizePoConversionRate(
      options?.conversionRate ?? PO_CURRENCY_CONVERSION_DEFAULTS.conversion_rate
    ),
  }
}

/**
 * Amount stored on PO/CO line items and financial breakdown is in from-currency when
 * conversion is enabled. Payables screens display corporation-facing to-currency amounts.
 */
export function amountInPoToCurrency(
  amount: number | string | null | undefined,
  input: Record<string, unknown> | null | undefined
): number {
  const fields = normalizePoCurrencyConversionFields(input)
  const numeric = roundPoCurrencyValue(amount)
  if (!fields.currency_conversion_enabled) return numeric
  return convertPoCurrency(numeric, fields.conversion_rate)
}

export type LaborBalanceToBeInvoicedInputs = {
  totalOrderValue: number
  advancePaidNet: number
  invoicedValue: number
  holdbackReleased: number
  holdbackBalanceToBeInvoiced: number
  fallbackBalance?: number
}

/**
 * Labor PO/CO balance to be invoiced for payables display.
 * When conversion is enabled, only total order value is converted;
 * advance, invoiced, and holdback amounts remain in to-currency (invoice currency).
 */
export function computeLaborBalanceToBeInvoicedForDisplay(
  order: Record<string, unknown> | null | undefined,
  inputs: LaborBalanceToBeInvoicedInputs
): number {
  const fields = normalizePoCurrencyConversionFields(order)
  const {
    totalOrderValue,
    advancePaidNet,
    invoicedValue,
    holdbackReleased,
    holdbackBalanceToBeInvoiced,
    fallbackBalance,
  } = inputs

  const recomputeFromParts = (total: number) => {
    const gross = Math.max(0, total - advancePaidNet - invoicedValue - holdbackReleased)
    return Math.max(0, gross - holdbackBalanceToBeInvoiced)
  }

  if (!fields.currency_conversion_enabled) {
    if (Number.isFinite(totalOrderValue) && totalOrderValue > 0) {
      return recomputeFromParts(totalOrderValue)
    }
    return roundPoCurrencyValue(fallbackBalance ?? 0)
  }

  if (!Number.isFinite(totalOrderValue) || totalOrderValue <= 0) {
    return amountInPoToCurrency(fallbackBalance ?? 0, order)
  }

  return recomputeFromParts(amountInPoToCurrency(totalOrderValue, order))
}

/** Order line monetary fields shown on vendor invoice item tables (payables). */
export const VENDOR_INVOICE_ORDER_MONETARY_KEYS = [
  'unit_price',
  'total',
  'po_unit_price',
  'po_total',
  'co_unit_price',
  'co_total',
  'po_amount',
  'co_amount',
  'material_budgeted_amount',
  'labor_budgeted_amount',
] as const

const VENDOR_INVOICE_SAVED_INVOICE_MONETARY_KEYS = [
  'invoice_unit_price',
  'invoice_total',
  'invoice_amount',
] as const

/**
 * Converts PO/CO order line amounts to corporation-facing to-currency for payables UI.
 * Saved invoice line amounts are left unchanged unless `convertInvoiceFields` is true.
 */
export function applyPoCurrencyToVendorInvoiceLineItem<
  T extends Record<string, unknown>,
>(
  item: T,
  currencySource: Record<string, unknown> | null | undefined,
  options?: {
    convertInvoiceFields?: boolean
    extraKeys?: string[]
  }
): T {
  const fields = normalizePoCurrencyConversionFields(currencySource)
  if (!fields.currency_conversion_enabled) return item

  const keys: string[] = [
    ...VENDOR_INVOICE_ORDER_MONETARY_KEYS,
    ...(options?.extraKeys ?? []),
    ...(options?.convertInvoiceFields ? VENDOR_INVOICE_SAVED_INVOICE_MONETARY_KEYS : []),
  ]

  const converted = { ...item } as T
  for (const key of keys) {
    if (!(key in converted)) continue
    const value = (converted as Record<string, unknown>)[key]
    if (value === null || value === undefined || value === '') continue
    ;(converted as Record<string, unknown>)[key] = amountInPoToCurrency(
      value as number | string,
      fields
    )
  }
  return converted
}
