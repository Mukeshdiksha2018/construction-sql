/**
 * Apply the same holdback percentage to each line independently (amounts are already net of advance).
 * Example: 10% on $100 → $10 retained, $90 net on that line; repeated for every row.
 * Each line’s holdback is rounded to the nearest cent on that line only; remainder cents are not
 * reallocated to other GL rows.
 */
export function applyPerLinePercentHoldbackToBreakdown(
  breakdown: { accountUuid: string; total: number }[],
  holdbackPercent: number | string | null | undefined
): { accountUuid: string; total: number }[] {
  let pct = 0
  if (holdbackPercent === null || holdbackPercent === undefined || holdbackPercent === '') {
    pct = 0
  } else if (typeof holdbackPercent === 'number') {
    pct = Number.isFinite(holdbackPercent) ? Math.max(0, holdbackPercent) : 0
  } else {
    const s = String(holdbackPercent).replace(/,/g, '').replace(/%/g, '').trim()
    const n = Number(s)
    pct = Number.isFinite(n) ? Math.max(0, n) : 0
  }

  if (!breakdown.length || pct <= 0) {
    return breakdown.map((r) => ({ accountUuid: r.accountUuid, total: r.total }))
  }

  const round2FromCents = (cents: number) => Math.round(cents) / 100
  const toCents = (n: number) =>
    Math.max(0, Math.round((Number.isFinite(n) ? n : 0) * 100))

  return breakdown.map((r) => {
    const grossC = toCents(r.total)
    const hbC = Math.min(grossC, Math.round((grossC * pct) / 100))
    const netC = grossC - hbC
    return { accountUuid: r.accountUuid, total: round2FromCents(netC) }
  })
}
