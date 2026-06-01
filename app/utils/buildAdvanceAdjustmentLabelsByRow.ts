import { isTaxAdjustmentKey } from '@/utils/advancePaymentTaxAdjustmentKeys'

/**
 * Build one label string per GL row for Configure COA "Advance applied" column:
 * maps advance adjustments (by advance payment → cost code → amount) to chart of account
 * via cost code's gl_account_uuid, then formats "INV-123 $10.00 · INV-456 $5.00" per account.
 */
export type BreakdownRow = { accountUuid: string; total: number }

export type AdvancePaymentMetadata = Record<string, { number?: string } | undefined>

export type CostCodeDetailsByUuid = Record<
  string,
  { gl_account_uuid?: string | null } | undefined
>

export function buildAdvanceAdjustmentLabelsByRow(params: {
  breakdown: BreakdownRow[]
  /** advancePaymentUuid -> costCodeUuid -> adjusted amount */
  adjustedAmounts: Record<string, Record<string, number>>
  /** advancePaymentUuid -> display invoice number */
  metadata: AdvancePaymentMetadata
  /** costCodeUuid -> cost code row from API (needs gl_account_uuid) */
  costCodeDetailsByUuid: CostCodeDetailsByUuid
  formatCurrency: (value: number) => string
}): string[] {
  const { breakdown, adjustedAmounts, metadata, costCodeDetailsByUuid, formatCurrency } = params

  const aggByAccount = new Map<string, Map<string, number>>()

  for (const [apUuid, byCc] of Object.entries(adjustedAmounts)) {
    const invNo = metadata[apUuid]?.number || '—'
    if (!byCc || typeof byCc !== 'object') continue
    for (const [ccUuid, raw] of Object.entries(byCc)) {
      const n = Number(raw)
      if (!Number.isFinite(n) || n <= 0) continue
      const gl = costCodeDetailsByUuid[ccUuid]?.gl_account_uuid
      if (!gl) continue
      if (!aggByAccount.has(gl)) aggByAccount.set(gl, new Map())
      const m = aggByAccount.get(gl)!
      m.set(invNo, (m.get(invNo) ?? 0) + n)
    }
  }

  const labelForAccount = (accountUuid: string) => {
    if (!accountUuid) return ''
    const m = aggByAccount.get(accountUuid)
    if (!m || m.size === 0) return ''
    const parts = [...m.entries()].map(([inv, sum]) => `${inv} ${formatCurrency(sum)}`)
    return parts.join(' · ')
  }

  return breakdown.map((row) => labelForAccount(String(row.accountUuid || '')))
}

/** Same mapping as labels, but one rounded dollar total per breakdown row (for per-line advance math). */
export function buildAdvanceAmountsByRow(params: {
  breakdown: BreakdownRow[]
  adjustedAmounts: Record<string, Record<string, number>>
  costCodeDetailsByUuid: CostCodeDetailsByUuid
  round2: (n: number) => number
}): number[] {
  const { breakdown, adjustedAmounts, costCodeDetailsByUuid, round2 } = params
  const aggByAccount = new Map<string, number>()

  for (const [, byCc] of Object.entries(adjustedAmounts)) {
    if (!byCc || typeof byCc !== 'object') continue
    for (const [ccUuid, raw] of Object.entries(byCc)) {
      if (isTaxAdjustmentKey(ccUuid)) continue
      const n = Number(raw)
      if (!Number.isFinite(n) || n <= 0) continue
      const gl = costCodeDetailsByUuid[ccUuid]?.gl_account_uuid
      if (!gl) continue
      const key = String(gl)
      aggByAccount.set(key, (aggByAccount.get(key) ?? 0) + n)
    }
  }

  return breakdown.map((row) => {
    const u = String(row.accountUuid || '')
    const sum = u ? aggByAccount.get(u) ?? 0 : 0
    return round2(sum)
  })
}
