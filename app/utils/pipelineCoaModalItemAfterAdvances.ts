import { applyPerRowOrEqualCostAdvanceToBreakdown } from '~/utils/applyPerRowOrEqualAdvanceToBreakdown'
import { applyEqualAdvanceDeductionToBreakdown } from '~/utils/applyEqualAdvanceDeductionToBreakdown'

export type CoaGrossRow = { accountUuid: string; total: number }

export function pipelineCoaModalItemAfterAdvances(
  grossRows: CoaGrossRow[],
  advanceDeduction: number,
  advanceAmountsByRow: number[] | undefined,
  taxOffsetTotal: number,
  round2: (n: number) => number
): { afterCostAdvance: CoaGrossRow[]; afterTaxShare: CoaGrossRow[] } {
  const fullAdv = round2(advanceDeduction ?? 0)
  const taxT = round2(Math.max(0, taxOffsetTotal))
  const costAdvanceTotal = round2(Math.max(0, fullAdv - taxT))

  const afterCostAdvance = applyPerRowOrEqualCostAdvanceToBreakdown(grossRows, costAdvanceTotal, advanceAmountsByRow, round2)
  const taxTotal = round2(Math.max(0, taxOffsetTotal))
  const afterTaxShare =
    taxTotal > 0 && afterCostAdvance.length > 0
      ? applyEqualAdvanceDeductionToBreakdown(afterCostAdvance.map((r) => ({ accountUuid: r.accountUuid, total: round2(Number(r.total) || 0) })), taxTotal)
      : afterCostAdvance.map((r) => ({ ...r, total: round2(Number(r.total) || 0) }))

  return { afterCostAdvance, afterTaxShare }
}
