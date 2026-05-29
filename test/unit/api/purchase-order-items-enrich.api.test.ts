import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)

const mockGetItems = vi.fn()
const mockEnrich = vi.fn()

const mockGetQuery = vi.fn()

vi.stubGlobal('getQuery', mockGetQuery)

vi.mock('../../../server/utils/purchaseOrders', () => ({
  getPurchaseOrderItems: (...args: unknown[]) => mockGetItems(...args),
}))

vi.mock('../../../server/utils/enrichPoItemsUom', () => ({
  enrichPoItemsWithUomLabels: (...args: unknown[]) => mockEnrich(...args),
}))

describe('GET /api/purchase-order-items with UOM enrichment', () => {
  const mockEvent = { path: '/api/purchase-order-items' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetQuery.mockReturnValue({ purchase_order_uuid: 'po-uuid-1' })
    mockGetItems.mockResolvedValue([
      { item_name: 'Y', unit_uuid: 'uom-1', unit_label: '' },
    ])
    mockEnrich.mockImplementation(async (items) =>
      items.map((item: Record<string, unknown>) => ({
        ...item,
        unit_label: 'EA',
        uom: 'EA',
      })),
    )
  })

  async function loadHandler() {
    vi.resetModules()
    const { default: handler } = await import('../../../server/api/purchase-order-items/index.get')
    return handler as (event: unknown) => Promise<{ data: unknown[] }>
  }

  it('enriches items with UOM labels before returning', async () => {
    const handler = await loadHandler()
    const result = await handler(mockEvent)

    expect(mockGetItems).toHaveBeenCalledWith('po-uuid-1')
    expect(mockEnrich).toHaveBeenCalled()
    expect(result.data[0]).toMatchObject({ unit_label: 'EA', uom: 'EA' })
  })
})
