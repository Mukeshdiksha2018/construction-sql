import { taxAdjustmentKey } from '~/utils/advancePaymentTaxAdjustmentKeys'
import {
  parseAdvancePaymentAmount,
  roundAdvancePaymentCurrency,
} from '~/utils/advancePaymentAmounts'

export interface AdjustedAdvancePaymentRecord {
  advance_payment_uuid?: string | null
  cost_code_uuid?: string | null
  adjusted_amount?: unknown
  metadata?: { tax_line_key?: string } | null
}

/** Nested map: advance payment invoice uuid → (cost code or tax key → adjusted amount). */
export function buildAdjustedAdvancePaymentAmountsMap(
  records: AdjustedAdvancePaymentRecord[] | null | undefined,
): Record<string, Record<string, number>> {
  const map: Record<string, Record<string, number>> = {}
  if (!Array.isArray(records)) return map

  for (const item of records) {
    const advancePaymentUuid = item.advance_payment_uuid
    if (!advancePaymentUuid) continue

    const adjustedAmount = parseAdvancePaymentAmount(item.adjusted_amount)
    if (adjustedAmount <= 0) continue

    const taxKey = item.metadata?.tax_line_key
    if (!map[advancePaymentUuid]) {
      map[advancePaymentUuid] = {}
    }

    if (taxKey) {
      map[advancePaymentUuid][taxAdjustmentKey(String(taxKey))] = adjustedAmount
    } else if (item.cost_code_uuid) {
      map[advancePaymentUuid][String(item.cost_code_uuid)] = adjustedAmount
    }
  }

  return map
}

/** Sum adjusted amounts keyed by cost_code_uuid or synthetic tax key (__tax_*). */
export function sumAdjustedAdvancePaymentAmountsTotal(
  amounts: Record<string, Record<string, number>> | Record<string, number> | null | undefined,
): number {
  if (!amounts || typeof amounts !== 'object') return 0

  let total = 0
  for (const value of Object.values(amounts)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const nested of Object.values(value as Record<string, unknown>)) {
        total += parseAdvancePaymentAmount(nested)
      }
    } else {
      total += parseAdvancePaymentAmount(value)
    }
  }

  return roundAdvancePaymentCurrency(total)
}

export function aggregateAdjustedAdvancePaymentAmounts(
  records: AdjustedAdvancePaymentRecord[] | null | undefined,
): Record<string, number> {
  const map: Record<string, number> = {}
  if (!Array.isArray(records)) return map

  for (const rec of records) {
    const amount = parseAdvancePaymentAmount(rec?.adjusted_amount)
    if (amount <= 0) continue

    const taxLineKey = rec?.metadata?.tax_line_key
    const key = taxLineKey
      ? taxAdjustmentKey(String(taxLineKey))
      : rec?.cost_code_uuid
        ? String(rec.cost_code_uuid)
        : null

    if (!key) continue
    map[key] = roundAdvancePaymentCurrency((map[key] || 0) + amount)
  }

  return map
}

const ADVANCE_PAYMENT_BELOW_CONSUMED_EPSILON = 0.009

export function isAdvanceAmountBelowConsumed(
  advanceAmount: unknown,
  consumedAmount: number,
): boolean {
  const consumed = parseAdvancePaymentAmount(consumedAmount)
  if (consumed <= 0) return false
  return (
    parseAdvancePaymentAmount(advanceAmount) + ADVANCE_PAYMENT_BELOW_CONSUMED_EPSILON <
    consumed
  )
}

export function validateAdvancePaymentNotBelowConsumed(options: {
  advancePaymentCostCodes: unknown
  financialBreakdown: unknown
  consumedByKey: Record<string, number>
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const consumed = options.consumedByKey || {}

  if (Array.isArray(options.advancePaymentCostCodes)) {
    for (const row of options.advancePaymentCostCodes) {
      const costCodeUuid = row?.cost_code_uuid
      if (!costCodeUuid) continue

      const minimum = parseAdvancePaymentAmount(consumed[String(costCodeUuid)])
      if (minimum <= 0) continue

      const advance = parseAdvancePaymentAmount(row?.advanceAmount ?? row?.advance_amount)
      if (isAdvanceAmountBelowConsumed(advance, minimum)) {
        errors.push(
          `Advance amount for cost code cannot be less than ${minimum.toFixed(2)} already adjusted in other invoices.`,
        )
      }
    }
  }

  const salesTaxes =
    options.financialBreakdown &&
    typeof options.financialBreakdown === 'object' &&
    (options.financialBreakdown as Record<string, unknown>).sales_taxes &&
    typeof (options.financialBreakdown as Record<string, unknown>).sales_taxes === 'object'
      ? ((options.financialBreakdown as Record<string, any>).sales_taxes as Record<
          string,
          { amount?: unknown }
        >)
      : null

  for (const taxKey of ['sales_tax_1', 'sales_tax_2'] as const) {
    const minimum = parseAdvancePaymentAmount(consumed[taxAdjustmentKey(taxKey)])
    if (minimum <= 0) continue

    const taxAmount = parseAdvancePaymentAmount(salesTaxes?.[taxKey]?.amount)
    if (isAdvanceAmountBelowConsumed(taxAmount, minimum)) {
      const label = taxKey === 'sales_tax_1' ? 'Sales Tax 1' : 'Sales Tax 2'
      errors.push(
        `${label} amount cannot be less than ${minimum.toFixed(2)} already adjusted in other invoices.`,
      )
    }
  }

  return { valid: errors.length === 0, errors }
}

export const ADVANCE_PAYMENT_DELETE_BLOCKED_MESSAGE =
  'This advance payment has amounts adjusted in other vendor invoices and cannot be deleted.'

export function hasConsumedAdvanceAdjustments(
  records: AdjustedAdvancePaymentRecord[] | null | undefined,
): boolean {
  const aggregated = aggregateAdjustedAdvancePaymentAmounts(records)
  return Object.values(aggregated).some((amount) => amount > 0)
}
