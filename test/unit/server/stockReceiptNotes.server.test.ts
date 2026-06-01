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
})
