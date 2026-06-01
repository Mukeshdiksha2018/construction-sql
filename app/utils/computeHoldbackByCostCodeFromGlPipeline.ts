import { allocateGlobalHoldbackProportionally } from '@/utils/allocateGlobalHoldbackProportionally';
import {
  pipelineCoaModalItemAfterAdvances,
  type CoaGrossRow,
} from '@/utils/pipelineCoaModalItemAfterAdvances';

export type GlCostLine = { costCodeUuid: string; amount: number };

/**
 * Pure mirror of the main path in VendorInvoiceForm `buildHoldbackCoaBreakdownForSave`:
 * same GL gross rows + advance/tax pipeline as Configure COA, one global holdback H split across GLs,
 * then each GL’s holdback split across cost-code lines by invoice amount.
 *
 * Returns merged holdback per cost code (multiple GLs contributing to the same code are summed).
 */
export function computeHoldbackByCostCodeFromGlPipeline(
  grossRows: CoaGrossRow[],
  advanceDeduction: number,
  advanceAmountsByRow: number[] | undefined,
  taxOffsetTotal: number,
  totalHoldbackH: number,
  glAccountToCostLines: ReadonlyMap<string, GlCostLine[]>,
  round2: (n: number) => number
): Map<string, number> {
  const { afterTaxShare } = pipelineCoaModalItemAfterAdvances(
    grossRows,
    advanceDeduction,
    advanceAmountsByRow,
    taxOffsetTotal,
    round2
  );

  const itemGross = afterTaxShare.map((r) => round2(Number(r.total) || 0));
  const { holdAmounts } = allocateGlobalHoldbackProportionally(itemGross, totalHoldbackH, round2);

  const retainageMap = new Map<string, number>();

  for (let i = 0; i < afterTaxShare.length; i++) {
    const glAccountUuid = String(afterTaxShare[i]?.accountUuid || '').trim();
    const holdForGl = holdAmounts[i] ?? 0;
    if (holdForGl <= 0 || !glAccountUuid) continue;

    const lines = glAccountToCostLines.get(glAccountUuid) || [];
    if (lines.length === 0) continue;

    const subGross = lines.map((l) => round2(l.amount));
    const { holdAmounts: perCc } = allocateGlobalHoldbackProportionally(subGross, holdForGl, round2);

    lines.forEach((line, j) => {
      const hb = perCc[j] ?? 0;
      if (hb <= 0) return;
      const prev = retainageMap.get(line.costCodeUuid) ?? 0;
      retainageMap.set(line.costCodeUuid, round2(prev + hb));
    });
  }

  return retainageMap;
}
