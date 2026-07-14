import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSrnCreate = vi.fn()
const mockSrnUpdate = vi.fn()
const mockSrnFindFirst = vi.fn()
const mockSrnFindMany = vi.fn()
const mockRniFindMany = vi.fn()
const mockRniFindFirst = vi.fn()
const mockRniCreate = vi.fn()
const mockRniUpdate = vi.fn()
const mockPoItemFindMany = vi.fn()
const mockPoItemUpdate = vi.fn()
const mockCoItemFindMany = vi.fn()
const mockCoItemUpdate = vi.fn()
const mockPoUpdate = vi.fn()
const mockCoUpdate = vi.fn()
const mockEmptyFindMany = vi.fn()
const mockEmptyDeleteMany = vi.fn()
const mockEmptyCreateMany = vi.fn()

function emptyChildDelegate() {
  return {
    findMany: (...a: unknown[]) => mockEmptyFindMany(...a),
    deleteMany: (...a: unknown[]) => mockEmptyDeleteMany(...a),
    createMany: (...a: unknown[]) => mockEmptyCreateMany(...a),
  }
}

function stubNormalizedChildren() {
  mockEmptyFindMany.mockResolvedValue([])
  mockEmptyDeleteMany.mockResolvedValue({ count: 0 })
  mockEmptyCreateMany.mockResolvedValue({ count: 0 })
}

vi.mock('../../../server/utils/prisma', () => ({
  getPrisma: () => ({
    stockReceiptNote: {
      create: (...a: unknown[]) => mockSrnCreate(...a),
      update: (...a: unknown[]) => mockSrnUpdate(...a),
      findFirst: (...a: unknown[]) => mockSrnFindFirst(...a),
      findMany: (...a: unknown[]) => mockSrnFindMany(...a),
    },
    receiptNoteItem: {
      findMany: (...a: unknown[]) => mockRniFindMany(...a),
      findFirst: (...a: unknown[]) => mockRniFindFirst(...a),
      create: (...a: unknown[]) => mockRniCreate(...a),
      update: (...a: unknown[]) => mockRniUpdate(...a),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    purchaseOrderItem: {
      findMany: (...a: unknown[]) => mockPoItemFindMany(...a),
      update: (...a: unknown[]) => mockPoItemUpdate(...a),
    },
    changeOrderItem: {
      findMany: (...a: unknown[]) => mockCoItemFindMany(...a),
      update: (...a: unknown[]) => mockCoItemUpdate(...a),
    },
    purchaseOrderForm: {
      update: (...a: unknown[]) => mockPoUpdate(...a),
    },
    changeOrder: {
      update: (...a: unknown[]) => mockCoUpdate(...a),
    },
    returnNoteItem: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    grnFinancialCharge: emptyChildDelegate(),
    grnFinancialTax: emptyChildDelegate(),
    grnAttachment: emptyChildDelegate(),
    grnAuditEvent: emptyChildDelegate(),
  }),
}))

function makeSrnRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1n,
    uuid: 'srn-1',
    corporation_uuid: 'corp-1',
    purchase_order_uuid: null,
    change_order_uuid: null,
    receipt_type: 'purchase_order',
    grn_number: 'GRN-6',
    status: 'Shipment',
    metadata: '{}',
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  }
}

describe('stockReceiptNotes server utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNormalizedChildren()
    mockSrnFindMany.mockResolvedValue([{ grn_number: 'GRN-5' }])
    mockSrnFindFirst.mockResolvedValue(null)
    mockPoUpdate.mockResolvedValue({})
    mockCoUpdate.mockResolvedValue({})
    mockPoItemFindMany.mockResolvedValue([])
    mockCoItemFindMany.mockResolvedValue([])
    mockRniFindMany.mockResolvedValue([])
  })

  it('generateNextGrnNumber increments from existing numbers', async () => {
    const { generateNextGrnNumber } = await import('../../../server/utils/stockReceiptNotes')
    const next = await generateNextGrnNumber('corp-1')
    expect(next).toBe('GRN-6')
  })

  it('createStockReceiptNote persists change_order header and receipt_items', async () => {
    const created = makeSrnRow({
      uuid: 'srn-1',
      change_order_uuid: 'co-1',
      purchase_order_uuid: null,
      receipt_type: 'change_order',
    })
    mockSrnCreate.mockResolvedValue(created)
    mockSrnFindFirst.mockResolvedValue(created)
    mockRniFindFirst.mockResolvedValue(null)
    mockRniFindMany.mockResolvedValue([])
    mockCoItemFindMany
      .mockResolvedValueOnce([{ uuid: 'line-1', receipt_note_uuids: null }])
      .mockResolvedValueOnce([{ uuid: 'line-1', co_quantity: 2 }])
    mockSrnFindMany.mockResolvedValue([{ uuid: 'srn-1' }])

    const { createStockReceiptNote } = await import('../../../server/utils/stockReceiptNotes')
    const result = await createStockReceiptNote({
      corporation_uuid: 'corp-1',
      receipt_type: 'change_order',
      change_order_uuid: 'co-1',
      grn_number: 'GRN-6',
      receipt_items: [{
        uuid: 'line-1',
        received_quantity: 2,
        unit_price: 10,
        grn_total: 20,
      }],
    })

    expect(mockSrnCreate).toHaveBeenCalled()
    const createArg = mockSrnCreate.mock.calls[0][0].data
    expect(createArg.change_order_uuid).toBe('co-1')
    expect(createArg.purchase_order_uuid).toBeNull()
    expect(createArg.attachments).toBeUndefined()
    expect(createArg.audit_log).toBeUndefined()
    expect(mockRniCreate).toHaveBeenCalled()
    expect(result.change_order_uuid).toBe('co-1')
  })

  it('createStockReceiptNote sets Partially_Received on PO when save_as_open_po', async () => {
    mockPoUpdate.mockImplementation(() => Promise.resolve({}))
    const created = makeSrnRow({
      id: 2n,
      uuid: 'rn-po',
      purchase_order_uuid: 'po-1',
      receipt_type: 'purchase_order',
      grn_number: 'GRN-7',
    })
    mockSrnCreate.mockResolvedValue(created)
    mockSrnFindFirst.mockResolvedValue(created)

    const { createStockReceiptNote } = await import('../../../server/utils/stockReceiptNotes')
    await createStockReceiptNote({
      corporation_uuid: 'corp-1',
      receipt_type: 'purchase_order',
      purchase_order_uuid: 'po-1',
      save_as_open_po: true,
    })

    expect(mockPoUpdate).toHaveBeenCalledWith({
      where: { uuid: 'po-1' },
      data: { status: 'Partially_Received' },
    })
  })

  it('listStockReceiptNotes filters by change_order_uuid', async () => {
    mockSrnFindMany.mockResolvedValue([
      makeSrnRow({
        uuid: 'rn-co',
        purchase_order_uuid: null,
        change_order_uuid: 'co-1',
        receipt_type: 'change_order',
        grn_number: 'GRN-1',
        metadata: null,
      }),
    ])

    const { listStockReceiptNotes } = await import('../../../server/utils/stockReceiptNotes')
    const rows = await listStockReceiptNotes('corp-1', { changeOrderUuid: 'co-1' })

    expect(mockSrnFindMany).toHaveBeenCalled()
    expect(rows[0].change_order_uuid).toBe('co-1')
  })

  it('deleteStockReceiptNote soft-deactivates header and lines', async () => {
    mockSrnFindFirst.mockResolvedValue(makeSrnRow({
      uuid: 'rn-del',
      grn_number: 'GRN-1',
    }))
    mockSrnUpdate.mockResolvedValue({})

    const { deleteStockReceiptNote } = await import('../../../server/utils/stockReceiptNotes')
    const result = await deleteStockReceiptNote('rn-del')

    expect(result.is_active).toBe(false)
    expect(mockSrnUpdate).toHaveBeenCalled()
  })

  it('stores scalar totals in metadata and financial rows in child tables', async () => {
    mockPoItemFindMany.mockResolvedValue([])
    mockRniFindMany.mockResolvedValue([])
    mockSrnFindMany.mockResolvedValue([])
    mockSrnCreate.mockImplementation(({ data }: any) => {
      const meta = JSON.parse(data.metadata)
      expect(meta.item_total).toBe(100)
      expect(meta.grn_total_with_charges_taxes).toBe(118)
      expect(meta.financial_breakdown).toBeUndefined()
      expect(data.attachments).toBeUndefined()
      expect(data.audit_log).toBeUndefined()
      const row = makeSrnRow({
        id: 3n,
        uuid: 'rn-fin',
        purchase_order_uuid: 'po-1',
        grn_number: 'GRN-8',
        metadata: data.metadata,
      })
      mockSrnFindFirst.mockResolvedValue(row)
      return Promise.resolve(row)
    })

    const { createStockReceiptNote } = await import('../../../server/utils/stockReceiptNotes')
    const row = await createStockReceiptNote({
      corporation_uuid: 'corp-1',
      receipt_type: 'purchase_order',
      purchase_order_uuid: 'po-1',
      item_total: 100,
      grn_total_with_charges_taxes: 118,
    })

    expect(mockEmptyCreateMany).toHaveBeenCalled()
    expect(row.item_total).toBe(100)
    expect(row.grn_total_with_charges_taxes).toBe(118)
  })
})
