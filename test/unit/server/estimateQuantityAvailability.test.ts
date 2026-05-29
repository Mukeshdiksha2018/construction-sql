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

  describe('estimate-scoped remaining qty (regression)', () => {
    it('queries only IMPORT_ITEMS_FROM_ESTIMATE purchase orders', async () => {
      const build = await loadBuilder()
      await build({
        corporationUuid: 'corp-1',
        projectUuid: 'proj-1',
        estimateUuid: 'est-1',
      })

      expect(mockPrisma.purchaseOrderForm.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            include_items: 'IMPORT_ITEMS_FROM_ESTIMATE',
            corporation_uuid: 'corp-1',
            project_uuid: 'proj-1',
            is_active: true,
          }),
        }),
      )
    })

    it('excludes master-sourced lines even when on an estimate-import PO', async () => {
      mockPrisma.purchaseOrderItem.findMany.mockResolvedValue([
        { item_uuid: 'item-1', cost_code_uuid: 'cc-1', po_quantity: 3, source: 'estimate' },
        { item_uuid: 'item-1', cost_code_uuid: 'cc-1', po_quantity: 99, source: 'master' },
      ])
      const build = await loadBuilder()
      const result = await build({
        corporationUuid: 'corp-1',
        projectUuid: 'proj-1',
        estimateUuid: 'est-1',
      })
      expect(result['item-1-cc-1']).toBe(3)
    })

    it('includes legacy PO lines with null or empty source', async () => {
      mockPrisma.purchaseOrderItem.findMany.mockResolvedValue([
        { item_uuid: 'item-1', cost_code_uuid: 'cc-1', po_quantity: 7, source: null },
        { item_uuid: 'item-1', cost_code_uuid: 'cc-1', po_quantity: 1, source: '' },
      ])
      const build = await loadBuilder()
      const result = await build({
        corporationUuid: 'corp-1',
        projectUuid: 'proj-1',
        estimateUuid: 'est-1',
      })
      expect(result['item-1-cc-1']).toBe(8)
    })

    it('does not count budget quantity when po_quantity is null or zero', async () => {
      mockPrisma.estimateMaterialItem.findMany.mockResolvedValue([
        { item_uuid: 'item-2', cost_code_uuid: 'cc-2' },
      ])
      mockPrisma.purchaseOrderItem.findMany.mockResolvedValue([
        { item_uuid: 'item-2', cost_code_uuid: 'cc-2', po_quantity: null, source: 'estimate' },
        { item_uuid: 'item-2', cost_code_uuid: 'cc-2', po_quantity: 0, source: 'estimate' },
      ])
      const build = await loadBuilder()
      const result = await build({
        corporationUuid: 'corp-1',
        projectUuid: 'proj-1',
        estimateUuid: 'est-1',
      })
      expect(result).toEqual({})
    })

    it('ignores PO lines that are not on the requested estimate material list', async () => {
      mockPrisma.estimateMaterialItem.findMany.mockResolvedValue([
        { item_uuid: 'item-1', cost_code_uuid: 'cc-1' },
      ])
      mockPrisma.purchaseOrderItem.findMany.mockResolvedValue([
        {
          item_uuid: 'item-other',
          cost_code_uuid: 'cc-other',
          po_quantity: 50,
          source: 'estimate',
        },
        { item_uuid: 'item-1', cost_code_uuid: 'cc-1', po_quantity: 2, source: 'estimate' },
      ])
      const build = await loadBuilder()
      const result = await build({
        corporationUuid: 'corp-1',
        projectUuid: 'proj-1',
        estimateUuid: 'est-1',
      })
      expect(result).toEqual({ 'item-1-cc-1': 2 })
      expect(result['item-other-cc-other']).toBeUndefined()
    })

    it('uses a different material allowlist per estimate on the same project', async () => {
      mockPrisma.estimateMaterialItem.findMany.mockImplementation(
        async (args: { where: { estimate_uuid: string } }) => {
          if (args.where.estimate_uuid === 'est-a') {
            return [{ item_uuid: 'item-a', cost_code_uuid: 'cc-a' }]
          }
          return [{ item_uuid: 'item-b', cost_code_uuid: 'cc-b' }]
        },
      )
      mockPrisma.purchaseOrderItem.findMany.mockResolvedValue([
        { item_uuid: 'item-a', cost_code_uuid: 'cc-a', po_quantity: 5, source: 'estimate' },
        { item_uuid: 'item-b', cost_code_uuid: 'cc-b', po_quantity: 8, source: 'estimate' },
      ])
      const build = await loadBuilder()

      const resultA = await build({
        corporationUuid: 'corp-1',
        projectUuid: 'proj-1',
        estimateUuid: 'est-a',
      })
      const resultB = await build({
        corporationUuid: 'corp-1',
        projectUuid: 'proj-1',
        estimateUuid: 'est-b',
      })

      expect(resultA).toEqual({ 'item-a-cc-a': 5 })
      expect(resultB).toEqual({ 'item-b-cc-b': 8 })
    })

    it('aggregates po_quantity across multiple estimate-import POs', async () => {
      mockPrisma.purchaseOrderForm.findMany.mockResolvedValue([
        { uuid: 'po-1' },
        { uuid: 'po-2' },
        { uuid: 'po-3' },
      ])
      mockPrisma.purchaseOrderItem.findMany.mockResolvedValue([
        { item_uuid: 'item-1', cost_code_uuid: 'cc-1', po_quantity: 1.5, source: 'estimate' },
        { item_uuid: 'item-1', cost_code_uuid: 'cc-1', po_quantity: 2.5, source: 'estimate' },
      ])
      const build = await loadBuilder()
      const result = await build({
        corporationUuid: 'corp-1',
        projectUuid: 'proj-1',
        estimateUuid: 'est-1',
      })
      expect(result['item-1-cc-1']).toBe(4)
    })

    it('skips estimate material rows missing item_uuid or cost_code_uuid', async () => {
      mockPrisma.estimateMaterialItem.findMany.mockResolvedValue([
        { item_uuid: null, cost_code_uuid: 'cc-1' },
        { item_uuid: 'item-1', cost_code_uuid: null },
        { item_uuid: 'item-1', cost_code_uuid: 'cc-1' },
      ])
      mockPrisma.purchaseOrderItem.findMany.mockResolvedValue([
        { item_uuid: 'item-1', cost_code_uuid: 'cc-1', po_quantity: 4, source: 'estimate' },
      ])
      const build = await loadBuilder()
      const result = await build({
        corporationUuid: 'corp-1',
        projectUuid: 'proj-1',
        estimateUuid: 'est-1',
      })
      expect(result).toEqual({ 'item-1-cc-1': 4 })
    })
  })
})
