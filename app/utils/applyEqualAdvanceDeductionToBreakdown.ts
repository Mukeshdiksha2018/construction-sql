export function applyEqualAdvanceDeductionToBreakdown(
  breakdown: { accountUuid: string; total: number }[],
  deduction: number
): { accountUuid: string; total: number }[] {
  const round2 = (cents: number) => Math.round(cents) / 100
  if (!breakdown.length) return []

  const toCents = (n: number) => Math.max(0, Math.round((Number.isFinite(n) ? n : 0) * 100))
  const amountsCents = breakdown.map((r) => toCents(r.total))
  const sumTotals = amountsCents.reduce((a, b) => a + b, 0)
  let remaining = Math.min(toCents(deduction), sumTotals)

  while (remaining > 0) {
    const active = amountsCents.map((a, i) => (a > 0 ? i : -1)).filter((i): i is number => i >= 0)
    if (active.length === 0) break

    const n = active.length
    const base = Math.floor(remaining / n)
    let rem = remaining % n
    let applied = 0

    for (const i of active) {
      let take = base + (rem > 0 ? 1 : 0)
      if (rem > 0) rem--
      take = Math.min(amountsCents[i]!, take)
      amountsCents[i]! -= take
      applied += take
    }

    remaining -= applied
    if (applied === 0) break
  }

  return breakdown.map((r, i) => ({ accountUuid: r.accountUuid, total: round2(amountsCents[i]!) }))
}
