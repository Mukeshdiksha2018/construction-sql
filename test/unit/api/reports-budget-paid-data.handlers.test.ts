import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetBudgetPaidData = vi.fn()

vi.mock('../../../server/utils/reports/budgetPaidData', () => ({
  getBudgetPaidData: (...args: unknown[]) => mockGetBudgetPaidData(...args),
}))

function stubNuxtGlobals() {
  vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
  vi.stubGlobal(
    'createError',
    (opts: { statusCode: number; statusMessage: string }) => {
      const err = new Error(opts.statusMessage) as Error & { statusCode: number }
      err.statusCode = opts.statusCode
      return err
    },
  )
}

describe('reports/budget-paid-data API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNuxtGlobals()
    mockGetBudgetPaidData.mockResolvedValue({
      invoices: [],
      po_invoice_items: [],
      co_invoice_items: [],
      labor_invoice_items: [],
      direct_line_items: [],
      advance_payment_cost_codes: [],
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns bundled paid invoice data', async () => {
    vi.stubGlobal('getQuery', () => ({
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
    }))

    const handler = (await import('../../../server/api/reports/budget-paid-data.get')).default
    const result = await handler({} as any)

    expect(mockGetBudgetPaidData).toHaveBeenCalledWith({
      corporationUuid: 'corp-1',
      projectUuid: 'proj-1',
      billDateFrom: undefined,
      billDateTo: undefined,
    })
    expect(result.data.invoices).toEqual([])
  })
})
