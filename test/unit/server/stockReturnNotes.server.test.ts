import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSrnCreate = vi.fn()
const mockSrnUpdate = vi.fn()
const mockSrnFindFirst = vi.fn()
const mockSrnFindMany = vi.fn()
const mockRniFindMany = vi.fn()
const mockRniDeleteMany = vi.fn()
const mockRniCreateMany = vi.fn()
const mockRniUpdateMany = vi.fn()
const mockPoItemFindMany = vi.fn()
const mockCoItemFindMany = vi.fn()
const mockPoUpdate = vi.fn()
const mockCoUpdate = vi.fn()
const mockReceiptNoteFindMany = vi.fn()

vi.mock('../../../server/utils/prisma', () => ({
  getPrisma: () => ({
    stockReturnNote: {
      create: (...a: unknown[]) => mockSrnCreate(...a),
      update: (...a: unknown[]) => mockSrnUpdate(...a),
      findFirst: (...a: unknown[]) => mockSrnFindFirst(...a),
      findMany: (...a: unknown[]) => mockSrnFindMany(...a),
    },
    returnNoteItem: {
      findMany: (...a: unknown[]) => mockRniFindMany(...a),
      deleteMany: (...a: unknown[]) => mockRniDeleteMany(...a),
      createMany: (...a: unknown[]) => mockRniCreateMany(...a),
      updateMany: (...a: unknown[]) => mockRniUpdateMany(...a),
    },
    purchaseOrderItem: {
      findMany: (...a: unknown[]) => mockPoItemFindMany(...a),
    },
    changeOrderItem: {
      findMany: (...a: unknown[]) => mockCoItemFindMany(...a),
    },
    purchaseOrderForm: {
      update: (...a: unknown[]) => mockPoUpdate(...a),
    },
    changeOrder: {
      update: (...a: unknown[]) => mockCoUpdate(...a),
    },
    stockReceiptNote: {
      findMany: (...a: unknown[]) => mockReceiptNoteFindMany(...a),
    },
    receiptNoteItem: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  }),
}))

describe('stockReturnNotes server utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSrnFindMany.mockResolvedValue([{ return_note_number: 'RTN-5' }])
    mockSrnFindFirst.mockResolvedValue(null)
    mockPoUpdate.mockResolvedValue({})
    mockCoUpdate.mockResolvedValue({})
    mockPoItemFindMany.mockResolvedValue([])
    mockCoItemFindMany.mockResolvedValue([])
    mockRniFindMany.mockResolvedValue([])
    mockRniDeleteMany.mockResolvedValue({ count: 0 })
    mockRniCreateMany.mockResolvedValue({ count: 0 })
    mockRniUpdateMany.mockResolvedValue({ count: 0 })
    mockReceiptNoteFindMany.mockResolvedValue([])
  })

  it('generateNextReturnNumber increments from existing numbers', async () => {
    const { generateNextReturnNumber } = await import('../../../server/utils/stockReturnNotes')
    const next = await generateNextReturnNumber('corp-1')
    expect(next).toBe('RTN-6')
  })

  it('createStockReturnNote persists return_items and change_order_uuid', async () => {
    mockSrnCreate.mockResolvedValue({
      id: 1n,
      uuid: 'rtn-1',
      corporation_uuid: 'corp-1',
      purchase_order_uuid: null,
      change_order_uuid: 'co-1',
      return_type: 'change_order',
      return_note_number: 'RTN-6',
      status: 'Returned',
      metadata: '{}',
      attachments: '[]',
      audit_log: '[]',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    })

    const { createStockReturnNote } = await import('../../../server/utils/stockReturnNotes')
    const result = await createStockReturnNote({
      corporation_uuid: 'corp-1',
      return_type: 'change_order',
      change_order_uuid: 'co-1',
      return_items: [{
        uuid: 'line-1',
        return_quantity: 2,
        unit_price: 10,
      }],
    })

    expect(mockSrnCreate).toHaveBeenCalled()
    expect(mockRniCreateMany).toHaveBeenCalled()
    expect(result.change_order_uuid).toBe('co-1')
    expect(result.return_number).toBe('RTN-6')
  })

  it('mapReturnNoteRow exposes return_number alias', async () => {
    mockSrnFindFirst.mockResolvedValue({
      id: 1n,
      uuid: 'rtn-2',
      corporation_uuid: 'corp-1',
      project_uuid: null,
      purchase_order_uuid: 'po-1',
      change_order_uuid: null,
      return_type: 'purchase_order',
      return_note_number: 'RTN-10',
      status: 'Returned',
      metadata: '{"financial_breakdown":{"totals":{}}}',
      attachments: '[]',
      audit_log: '[]',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    })

    const { getStockReturnNote } = await import('../../../server/utils/stockReturnNotes')
    const row = await getStockReturnNote('rtn-2')
    expect(row?.return_number).toBe('RTN-10')
    expect(row?.return_note_number).toBe('RTN-10')
  })

  it('deleteStockReturnNote soft-deactivates header and lines', async () => {
    mockSrnFindFirst.mockResolvedValue({
      uuid: 'rtn-del',
      corporation_uuid: 'corp-1',
      is_active: true,
      return_note_number: 'RTN-1',
      status: 'Returned',
      metadata: '{}',
      attachments: '[]',
      audit_log: '[]',
      created_at: new Date(),
      updated_at: new Date(),
    })
    mockSrnUpdate.mockResolvedValue({})

    const { deleteStockReturnNote } = await import('../../../server/utils/stockReturnNotes')
    const result = await deleteStockReturnNote('rtn-del')

    expect(result.is_active).toBe(false)
    expect(mockRniUpdateMany).toHaveBeenCalled()
  })
})
