import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPrisma = {
  estimateMaterialItem: { findMany: vi.fn() },
  purchaseOrderForm: { findMany: vi.fn() },
  purchaseOrderItem: { findMany: vi.fn() },
}

vi.mock('../../../server/utils/prisma', () => ({
  getPrisma: () => mockPrisma,
}))

describe('buildUsedQuantitiesByItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.estimateMaterialItem.findMany.mockResolvedValue([
      { item_uuid: 'item-1', cost_code_uuid: 'cc-1' },
      { item_uuid: 'item-2', cost_code_uuid: 'cc-2' },
    ])
    mockPrisma.purchaseOrderForm.findMany.mockResolvedValue([{ uuid: 'po-1' }, { uuid: 'po-2' }])
    mockPrisma.purchaseOrderItem.findMany.mockResolvedValue([
      {
        item_uuid: 'ITEM-1',
        cost_code_uuid: 'CC-1',
        po_quantity: 4,
        source: 'estimate',
      },
      {
        item_uuid: 'item-1',
        cost_code_uuid: 'cc-1',
        po_quantity: 2,
        source: 'estimate',
      },
      {
        item_uuid: 'item-2',
        cost_code_uuid: 'cc-2',
        po_quantity: null,
        source: 'estimate',
      },
      {
        item_uuid: 'item-3',
        cost_code_uuid: 'cc-3',
        po_quantity: 10,
        source: 'estimate',
      },
      {
        item_uuid: 'item-1',
        cost_code_uuid: 'cc-1',
        po_quantity: 5,
        source: 'master',
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

  it('returns empty object when estimate has no material items', async () => {
    mockPrisma.estimateMaterialItem.findMany.mockResolvedValue([])
    const build = await loadBuilder()
    const result = await build({
      corporationUuid: 'corp-1',
      projectUuid: 'proj-1',
      estimateUuid: 'est-1',
    })
    expect(result).toEqual({})
    expect(mockPrisma.purchaseOrderForm.findMany).not.toHaveBeenCalled()
  })

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

  it('aggregates po_quantity only for lines on the given estimate', async () => {
    const build = await loadBuilder()
    const result = await build({
      corporationUuid: 'corp-1',
      projectUuid: 'proj-1',
      estimateUuid: 'est-1',
    })

    expect(result['item-1-cc-1']).toBe(6)
    expect(result['item-2-cc-2']).toBeUndefined()
    expect(result['item-3-cc-3']).toBeUndefined()
  })

  it('loads material items for the requested estimate', async () => {
    const build = await loadBuilder()
    await build({
      corporationUuid: 'corp-1',
      projectUuid: 'proj-1',
      estimateUuid: 'est-1',
    })

    expect(mockPrisma.estimateMaterialItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          estimate_uuid: 'est-1',
          project_uuid: 'proj-1',
          corporation_uuid: 'corp-1',
        }),
      }),
    )
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
