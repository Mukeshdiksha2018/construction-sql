import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockPrisma = {
  project: { findFirst: vi.fn() },
  estimate: { findMany: vi.fn() },
  itemType: { findMany: vi.fn() },
  location: { findMany: vi.fn() },
  estimateLineItem: { findMany: vi.fn() },
  estimateMaterialItem: { findMany: vi.fn() },
  costCodePreferredItem: { findMany: vi.fn() },
  purchaseOrderForm: { findMany: vi.fn() },
  purchaseOrderItem: { findMany: vi.fn() },
}

vi.mock('../../../server/utils/prisma', () => ({
  getPrisma: () => mockPrisma,
}))

const testLocationUuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

describe('buildProjectItemsSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.project.findFirst.mockResolvedValue({
      uuid: 'proj-1',
      project_name: 'Tower A',
      project_id: '100',
    })
    mockPrisma.estimate.findMany.mockResolvedValue([{ uuid: 'est-1' }])
    mockPrisma.itemType.findMany.mockResolvedValue([])
    mockPrisma.location.findMany.mockResolvedValue([
      { uuid: testLocationUuid, location_name: 'Warehouse' },
    ])
    mockPrisma.estimateLineItem.findMany.mockResolvedValue([
      {
        uuid: 'eli-1',
        cost_code_uuid: 'cc-1',
        cost_code_number: '03',
        cost_code_name: 'Concrete',
        division_name: 'Division 3',
      },
    ])
    mockPrisma.costCodePreferredItem.findMany.mockResolvedValue([
      {
        uuid: 'item-1',
        item_sequence: '001',
        preferred_vendor_uuid: 'vendor-1',
      },
    ])
    mockPrisma.purchaseOrderForm.findMany.mockResolvedValue([])
    mockPrisma.purchaseOrderItem.findMany.mockResolvedValue([])
  })

  async function loadBuilder() {
    vi.resetModules()
    const { buildProjectItemsSummary } = await import('../../../server/utils/projectItemsSummary')
    return buildProjectItemsSummary
  }

  it('returns empty array when project is not found', async () => {
    mockPrisma.project.findFirst.mockResolvedValue(null)
    const build = await loadBuilder()
    const result = await build({
      corporationUuid: 'corp-1',
      projectUuid: 'proj-1',
    })
    expect(result).toEqual([])
  })

  it('computes budget, po, and pending quantities per estimate line', async () => {
    mockPrisma.estimateMaterialItem.findMany.mockResolvedValue([
      {
        uuid: 'emi-1',
        estimate_line_item_uuid: 'eli-1',
        cost_code_uuid: 'cc-1',
        item_type_uuid: null,
        item_uuid: 'item-1',
        preferred_vendor_uuid: 'vendor-1',
        item_division_uuid: null,
        location_uuid: testLocationUuid,
        category: 'Material',
        name: 'Concrete mix',
        description: 'Ready mix',
        model_number: null,
        unit_price: 50,
        quantity: 10,
        uom_uuid: null,
        sequence: 1,
        metadata: null,
      },
    ])
    mockPrisma.purchaseOrderForm.findMany.mockResolvedValue([
      { uuid: 'po-1', vendor_uuid: 'vendor-1' },
    ])
    mockPrisma.purchaseOrderItem.findMany.mockResolvedValue([
      {
        purchase_order_uuid: 'po-1',
        cost_code_uuid: 'cc-1',
        item_uuid: 'item-1',
        quantity: 4,
        po_quantity: 4,
      },
    ])

    const build = await loadBuilder()
    const result = await build({
      corporationUuid: 'corp-1',
      projectUuid: 'proj-1',
    })

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      item_uuid: 'item-1',
      cost_code_uuid: 'cc-1',
      budget_qty: 10,
      po_qty: 4,
      pending_qty: 6,
      status: 'Partial',
      location: 'Warehouse',
      preferred_vendor_uuid: 'vendor-1',
    })
  })

  it('marks rows Complete when po_qty meets budget', async () => {
    mockPrisma.estimateMaterialItem.findMany.mockResolvedValue([
      {
        uuid: 'emi-1',
        estimate_line_item_uuid: 'eli-1',
        cost_code_uuid: 'cc-1',
        item_type_uuid: null,
        item_uuid: 'item-1',
        preferred_vendor_uuid: null,
        item_division_uuid: null,
        location_uuid: null,
        category: 'Material',
        name: 'Done item',
        description: '',
        model_number: null,
        unit_price: 1,
        quantity: 5,
        uom_uuid: null,
        sequence: 1,
        metadata: null,
      },
    ])
    mockPrisma.purchaseOrderForm.findMany.mockResolvedValue([
      { uuid: 'po-1', vendor_uuid: null },
    ])
    mockPrisma.purchaseOrderItem.findMany.mockResolvedValue([
      {
        purchase_order_uuid: 'po-1',
        cost_code_uuid: 'cc-1',
        item_uuid: 'item-1',
        quantity: 5,
        po_quantity: 5,
      },
    ])

    const build = await loadBuilder()
    const result = await build({
      corporationUuid: 'corp-1',
      projectUuid: 'proj-1',
    })

    expect(result[0]?.status).toBe('Complete')
    expect(result[0]?.pending_qty).toBe(0)
  })

  it('filters rows by preferred vendor when vendor_uuid is provided', async () => {
    mockPrisma.estimateMaterialItem.findMany.mockResolvedValue([
      {
        uuid: 'emi-1',
        estimate_line_item_uuid: 'eli-1',
        cost_code_uuid: 'cc-1',
        item_type_uuid: null,
        item_uuid: 'item-1',
        preferred_vendor_uuid: 'vendor-1',
        item_division_uuid: null,
        location_uuid: null,
        category: 'Material',
        name: 'A',
        description: '',
        model_number: null,
        unit_price: 1,
        quantity: 5,
        uom_uuid: null,
        sequence: 1,
        metadata: null,
      },
      {
        uuid: 'emi-2',
        estimate_line_item_uuid: 'eli-1',
        cost_code_uuid: 'cc-2',
        item_type_uuid: null,
        item_uuid: 'item-2',
        preferred_vendor_uuid: 'vendor-2',
        item_division_uuid: null,
        location_uuid: null,
        category: 'Material',
        name: 'B',
        description: '',
        model_number: null,
        unit_price: 1,
        quantity: 3,
        uom_uuid: null,
        sequence: 2,
        metadata: null,
      },
    ])

    const build = await loadBuilder()
    const result = await build({
      corporationUuid: 'corp-1',
      projectUuid: 'proj-1',
      vendorUuid: 'vendor-1',
    })

    expect(result).toHaveLength(1)
    expect(result[0].item_uuid).toBe('item-1')
  })
})
