import type { MaybeRefOrGetter } from 'vue'

type AdvancePaymentCostCodeRow = {
  gl_account_uuid?: string | null
  gl_account_uuid_from_db?: string | null
  advanceAmount?: number | string | null
  advance_amount?: number | string | null
  cost_code_label?: string
  cost_code_number?: string
  cost_code_name?: string
  cost_code_uuid?: string
}

export function buildAdvancePaymentCOABreakdown(params: {
  rows: AdvancePaymentCostCodeRow[]
  formatCurrency: (value: number) => string
  round2?: (value: number) => number
}): {
  itemBreakdownByAccount: { accountUuid: string; total: number }[]
  advanceAppliedLabelsByRow: string[]
} {
  const { rows, formatCurrency, round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100 } = params

  const order: string[] = []
  const totalsByGl = new Map<string, number>()
  const labelPartsByGl = new Map<string, string[]>()

  for (const row of rows) {
    const gl = (row.gl_account_uuid ?? row.gl_account_uuid_from_db ?? '') as string
    if (!gl) continue

    const rawAdvance = row.advanceAmount ?? row.advance_amount
    const advance = typeof rawAdvance === 'string' ? parseFloat(rawAdvance) : Number(rawAdvance ?? 0)
    const adv = Number.isFinite(advance) ? advance : 0
    if (!(adv > 0)) continue

    if (!totalsByGl.has(gl)) {
      order.push(gl)
      totalsByGl.set(gl, 0)
      labelPartsByGl.set(gl, [])
    }

    totalsByGl.set(gl, (totalsByGl.get(gl) ?? 0) + adv)

    const ccLabel =
      row.cost_code_label ||
      (row.cost_code_number && row.cost_code_name ? `${row.cost_code_number} - ${row.cost_code_name}` : '') ||
      (row.cost_code_number ?? row.cost_code_name ?? row.cost_code_uuid ?? '')

    const label = `${ccLabel} ${formatCurrency(adv)}`.trim()
    labelPartsByGl.get(gl)!.push(label)
  }

  const itemBreakdownByAccount = order.map((accountUuid) => ({
    accountUuid,
    total: round2(totalsByGl.get(accountUuid) ?? 0),
  }))

  const advanceAppliedLabelsByRow = order.map((accountUuid) => {
    const parts = labelPartsByGl.get(accountUuid) ?? []
    return parts.join(' · ')
  })

  return { itemBreakdownByAccount, advanceAppliedLabelsByRow }
}

