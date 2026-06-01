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
  }),
}))

describe('stockReceiptNotes server utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    mockSrnCreate.mockResolvedValue({
      id: 1n,
      uuid: 'srn-1',
      corporation_uuid: 'corp-1',
      purchase_order_uuid: null,
      change_order_uuid: 'co-1',
      receipt_type: 'change_order',
      grn_number: 'GRN-6',
      status: 'Shipment',
      metadata: '{}',
      attachments: '[]',
      audit_log: '[]',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    })
    mockSrnFindFirst.mockResolvedValue({
      uuid: 'srn-1',
      corporation_uuid: 'corp-1',
      change_order_uuid: 'co-1',
      purchase_order_uuid: null,
      project_uuid: null,
      is_active: true,
    })
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
    expect(mockRniCreate).toHaveBeenCalled()
    expect(result.change_order_uuid).toBe('co-1')
  })

  it('createStockReceiptNote sets Partially_Received on PO when save_as_open_po', async () => {
    mockPoUpdate.mockImplementation(() => Promise.resolve({}))
    mockSrnCreate.mockResolvedValue({
      id: 2n,
      uuid: 'rn-po',
      corporation_uuid: 'corp-1',
      purchase_order_uuid: 'po-1',
      change_order_uuid: null,
      receipt_type: 'purchase_order',
      grn_number: 'GRN-7',
      status: 'Shipment',
      metadata: '{}',
      attachments: '[]',
      audit_log: '[]',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    })
    mockSrnFindFirst.mockResolvedValue({
      uuid: 'rn-po',
      corporation_uuid: 'corp-1',
      purchase_order_uuid: 'po-1',
      change_order_uuid: null,
      is_active: true,
    })

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
      {
        id: 1n,
        uuid: 'rn-co',
        corporation_uuid: 'corp-1',
        purchase_order_uuid: null,
        change_order_uuid: 'co-1',
        receipt_type: 'change_order',
        grn_number: 'GRN-1',
        status: 'Shipment',
        metadata: null,
        attachments: null,
        audit_log: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])

    const { listStockReceiptNotes } = await import('../../../server/utils/stockReceiptNotes')
    const rows = await listStockReceiptNotes('corp-1', { changeOrderUuid: 'co-1' })

    expect(mockSrnFindMany).toHaveBeenCalled()
    expect(rows[0].change_order_uuid).toBe('co-1')
  })

  it('deleteStockReceiptNote soft-deactivates header and lines', async () => {
    mockSrnFindFirst.mockResolvedValue({
      uuid: 'rn-del',
      corporation_uuid: 'corp-1',
      is_active: true,
      metadata: '{}',
      attachments: '[]',
      audit_log: '[]',
      grn_number: 'GRN-1',
      status: 'Shipment',
      created_at: new Date(),
      updated_at: new Date(),
    })
    mockSrnUpdate.mockResolvedValue({})

    const { deleteStockReceiptNote } = await import('../../../server/utils/stockReceiptNotes')
    const result = await deleteStockReceiptNote('rn-del')

    expect(result.is_active).toBe(false)
    expect(mockSrnUpdate).toHaveBeenCalled()
  })

  it('stores financial breakdown fields in metadata', async () => {
    mockPoItemFindMany.mockResolvedValue([])
    mockRniFindMany.mockResolvedValue([])
    mockSrnFindMany.mockResolvedValue([])
    mockSrnCreate.mockImplementation(({ data }: any) => {
      const meta = JSON.parse(data.metadata)
      expect(meta.item_total).toBe(100)
      expect(meta.grn_total_with_charges_taxes).toBe(118)
      return Promise.resolve({
        id: 3n,
        uuid: 'rn-fin',
        corporation_uuid: 'corp-1',
        purchase_order_uuid: 'po-1',
        change_order_uuid: null,
        receipt_type: 'purchase_order',
        grn_number: 'GRN-8',
        status: 'Shipment',
        metadata: data.metadata,
        attachments: '[]',
        audit_log: '[]',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
    })

    const { createStockReceiptNote } = await import('../../../server/utils/stockReceiptNotes')
    const row = await createStockReceiptNote({
      corporation_uuid: 'corp-1',
      receipt_type: 'purchase_order',
      purchase_order_uuid: 'po-1',
      item_total: 100,
      grn_total_with_charges_taxes: 118,
    })

    expect(row.item_total).toBe(100)
    expect(row.grn_total_with_charges_taxes).toBe(118)
  })
})
