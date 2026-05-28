import { applyEqualAdvanceDeductionToBreakdown } from '~/utils/applyEqualAdvanceDeductionToBreakdown'

export type AdvanceBreakdownRow = { accountUuid: string; total: number }

export function applyPerRowOrEqualAdvanceToBreakdown(
  grossRows: AdvanceBreakdownRow[],
  totalAdvanceDeduction: number,
  advanceAmountsByRow: number[] | undefined,
  round2: (n: number) => number
): AdvanceBreakdownRow[] {
  const gross = grossRows.map((r) => ({ accountUuid: r.accountUuid, total: round2(Number(r.total) || 0) }))
  const n = gross.length
  const byRow = advanceAmountsByRow ?? []
  const usePerRow = byRow.length === n && byRow.some((v) => round2(Number(v) || 0) > 0)

  if (usePerRow) {
    return gross.map((r, i) => {
      const entered = round2(r.total)
      const rawAdv = round2(Math.max(0, Number(byRow[i]) || 0))
      const advApplied = round2(Math.min(rawAdv, entered))
      return { accountUuid: r.accountUuid, total: round2(Math.max(0, entered - advApplied)) }
    })
  }

  return applyEqualAdvanceDeductionToBreakdown(gross, totalAdvanceDeduction)
}

export function applyPerRowOrEqualCostAdvanceToBreakdown(
  grossRows: AdvanceBreakdownRow[],
  costAdvanceTotal: number,
  advanceAmountsByRow: number[] | undefined,
  round2: (n: number) => number
): AdvanceBreakdownRow[] {
  const cap = round2(Math.max(0, costAdvanceTotal))
  if (!grossRows.length) return []

  const gross = grossRows.map((r) => ({ accountUuid: r.accountUuid, total: round2(Number(r.total) || 0) }))
  let after = applyPerRowOrEqualAdvanceToBreakdown(grossRows, cap, advanceAmountsByRow, round2)

  if (cap <= 0) return after

  let applied = 0
  for (let i = 0; i < gross.length; i++) {
    const g = round2(Number(gross[i]?.total) || 0)
    const a = round2(Number(after[i]?.total) || 0)
    applied = round2(applied + round2(g - a))
  }

  const residual = round2(cap - applied)
  if (residual > 0.005) {
    after = applyEqualAdvanceDeductionToBreakdown(
      after.map((r) => ({ accountUuid: r.accountUuid, total: round2(Number(r.total) || 0) })),
      residual
    )
  }

  return after
}
