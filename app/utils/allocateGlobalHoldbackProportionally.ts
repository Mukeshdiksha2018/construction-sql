export function allocateGlobalHoldbackProportionally(
  grossLines: number[],
  totalHoldback: number,
  round2: (n: number) => number
): { holdAmounts: number[]; netAmounts: number[] } {
  const n = grossLines.length
  if (n === 0) return { holdAmounts: [], netAmounts: [] }

  const gross = grossLines.map((g) => round2(Math.max(0, Number(g) || 0)))
  const sumG = round2(gross.reduce((a, b) => round2(a + b), 0))
  let H = round2(Math.max(0, totalHoldback))

  if (sumG <= 0 || H <= 0) return { holdAmounts: gross.map(() => 0), netAmounts: [...gross] }

  H = round2(Math.min(H, sumG))
  const toC = (x: number) => Math.max(0, Math.round((Number(x) + Number.EPSILON) * 100))
  const fromC = (c: number) => Math.round(c) / 100

  const gC = gross.map(toC)
  const sumGC = gC.reduce((a, b) => a + b, 0)
  const HC = Math.min(toC(H), sumGC)

  if (sumGC <= 0 || HC <= 0) return { holdAmounts: gross.map(() => 0), netAmounts: [...gross] }

  const ideal = gC.map((gi) => (HC * gi) / sumGC)
  const hC = ideal.map((x) => Math.floor(x))
  let allocated = hC.reduce((a, b) => a + b, 0)
  let rem = HC - allocated

  const order = ideal.map((x, i) => ({ i, frac: x - Math.floor(x) })).sort((a, b) => b.frac - a.frac)

  while (rem > 0) {
    let progressed = false
    for (const { i } of order) {
      if (rem <= 0) break
      if (hC[i]! < gC[i]!) { hC[i]!++; rem--; progressed = true }
    }
    if (!progressed) break
  }

  const holdAmounts = hC.map((c, i) => round2(fromC(Math.min(c, gC[i]!))))
  const netAmounts = gC.map((gCi, i) => round2(fromC(gCi - hC[i]!)))
  return { holdAmounts, netAmounts }
}
