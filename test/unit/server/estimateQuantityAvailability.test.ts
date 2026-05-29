import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPrisma = {
  purchaseOrderForm: { findMany: vi.fn() },
  purchaseOrderItem: { findMany: vi.fn() },
}

vi.mock('../../../server/utils/prisma', () => ({
  getPrisma: () => mockPrisma,
}))

describe('buildUsedQuantitiesByItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.purchaseOrderForm.findMany.mockResolvedValue([{ uuid: 'po-1' }, { uuid: 'po-2' }])
    mockPrisma.purchaseOrderItem.findMany.mockResolvedValue([
      {
        item_uuid: 'ITEM-1',
        cost_code_uuid: 'CC-1',
        po_quantity: 4,
        quantity: null,
      },
      {
        item_uuid: 'item-1',
        cost_code_uuid: 'cc-1',
        po_quantity: 2,
        quantity: null,
      },
      {
        item_uuid: 'item-2',
        cost_code_uuid: 'cc-2',
        po_quantity: null,
        quantity: 3,
      },
    ])
  })

  async function loadBuilder() {
    vi.resetModules()
    const { buildUsedQuantitiesByItem } = await import(
      '../../../server/utils/estimateQuantityAvailability'
    )
    return buildUsedQuantitiesByItem
  }

  it('returns empty object when no import-from-estimate POs exist', async () => {
    mockPrisma.purchaseOrderForm.findMany.mockResolvedValue([])
    const build = await loadBuilder()
    const result = await build({
      corporationUuid: 'corp-1',
      projectUuid: 'proj-1',
      estimateUuid: 'est-1',
    })
    expect(result).toEqual({})
    expect(mockPrisma.purchaseOrderItem.findMany).not.toHaveBeenCalled()
  })

  it('aggregates po_quantity by item_uuid-cost_code_uuid composite key', async () => {
    const build = await loadBuilder()
    const result = await build({
      corporationUuid: 'corp-1',
      projectUuid: 'proj-1',
      estimateUuid: 'est-1',
    })

    expect(result['item-1-cc-1']).toBe(6)
    expect(result['item-2-cc-2']).toBe(3)
  })

  it('excludes the current PO when excludePoUuid is set', async () => {
    const build = await loadBuilder()
    await build({
      corporationUuid: 'corp-1',
      projectUuid: 'proj-1',
      estimateUuid: 'est-1',
      excludePoUuid: 'po-edit',
    })

    expect(mockPrisma.purchaseOrderForm.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          uuid: { not: 'po-edit' },
        }),
      }),
    )
  })
})
