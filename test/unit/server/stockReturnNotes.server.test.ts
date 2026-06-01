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
const mockReceiptItemFindMany = vi.fn()

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
      findMany: (...a: unknown[]) => mockReceiptItemFindMany(...a),
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
    mockReceiptItemFindMany.mockResolvedValue([])
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

  it('listStockReturnNotes filters by change_order_uuid', async () => {
    mockSrnFindMany.mockResolvedValue([
      {
        id: 1n,
        uuid: 'rtn-co',
        corporation_uuid: 'corp-1',
        purchase_order_uuid: null,
        change_order_uuid: 'co-1',
        return_type: 'change_order',
        return_note_number: 'RTN-1',
        status: 'Returned',
        metadata: null,
        attachments: null,
        audit_log: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ])

    const { listStockReturnNotes } = await import('../../../server/utils/stockReturnNotes')
    const rows = await listStockReturnNotes('corp-1', { changeOrderUuid: 'co-1' })

    expect(mockSrnFindMany).toHaveBeenCalled()
    expect(rows[0].change_order_uuid).toBe('co-1')
  })

  it('updateStockReturnNote replaces return_items when provided', async () => {
    mockSrnFindFirst.mockResolvedValue({
      uuid: 'rtn-upd',
      corporation_uuid: 'corp-1',
      purchase_order_uuid: 'po-1',
      change_order_uuid: null,
      return_type: 'purchase_order',
      return_note_number: 'RTN-2',
      status: 'Returned',
      metadata: '{}',
      attachments: '[]',
      audit_log: '[]',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    })
    mockSrnUpdate.mockResolvedValue({
      uuid: 'rtn-upd',
      corporation_uuid: 'corp-1',
      purchase_order_uuid: 'po-1',
      change_order_uuid: null,
      return_type: 'purchase_order',
      return_note_number: 'RTN-2',
      status: 'Returned',
      metadata: '{}',
      attachments: '[]',
      audit_log: '[]',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    })

    const { updateStockReturnNote } = await import('../../../server/utils/stockReturnNotes')
    await updateStockReturnNote('rtn-upd', {
      corporation_uuid: 'corp-1',
      return_items: [{ uuid: 'line-1', return_quantity: 3 }],
    })

    expect(mockRniDeleteMany).toHaveBeenCalled()
    expect(mockRniCreateMany).toHaveBeenCalled()
  })

  it('filters out return_items without return_quantity on create', async () => {
    mockSrnCreate.mockResolvedValue({
      id: 2n,
      uuid: 'rtn-empty',
      corporation_uuid: 'corp-1',
      purchase_order_uuid: 'po-1',
      change_order_uuid: null,
      return_type: 'purchase_order',
      return_note_number: 'RTN-7',
      status: 'Returned',
      metadata: '{}',
      attachments: '[]',
      audit_log: '[]',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    })

    const { createStockReturnNote } = await import('../../../server/utils/stockReturnNotes')
    await createStockReturnNote({
      corporation_uuid: 'corp-1',
      return_type: 'purchase_order',
      purchase_order_uuid: 'po-1',
      return_items: [
        { uuid: 'line-1', return_quantity: 2 },
        { uuid: 'line-2' },
      ],
    })

    expect(mockRniCreateMany).toHaveBeenCalledTimes(1)
    const rows = mockRniCreateMany.mock.calls[0][0].data
    expect(rows).toHaveLength(1)
    expect(rows[0].item_uuid).toBe('line-1')
    expect(rows[0].return_quantity).toBe(2)
  })

  it('marks PO Completed when received plus returned meets ordered qty', async () => {
    mockPoItemFindMany.mockResolvedValue([
      { uuid: 'poi-1', po_quantity: 10 },
    ])
    mockReceiptNoteFindMany.mockResolvedValue([{ uuid: 'grn-1' }])
    mockReceiptItemFindMany.mockResolvedValue([
      { item_uuid: 'poi-1', received_quantity: 6, receipt_note_uuid: 'grn-1' },
    ])
    mockRniFindMany.mockResolvedValue([
      { item_uuid: 'poi-1', return_quantity: 4 },
    ])
    mockSrnCreate.mockResolvedValue({
      id: 3n,
      uuid: 'rtn-comp',
      corporation_uuid: 'corp-1',
      purchase_order_uuid: 'po-1',
      change_order_uuid: null,
      return_type: 'purchase_order',
      return_note_number: 'RTN-9',
      status: 'Returned',
      metadata: '{}',
      attachments: '[]',
      audit_log: '[]',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    })

    const { createStockReturnNote } = await import('../../../server/utils/stockReturnNotes')
    await createStockReturnNote({
      corporation_uuid: 'corp-1',
      return_type: 'purchase_order',
      purchase_order_uuid: 'po-1',
      return_items: [{ uuid: 'poi-1', return_quantity: 4 }],
    })

    expect(mockPoUpdate).toHaveBeenCalledWith({
      where: { uuid: 'po-1' },
      data: { status: 'Completed' },
    })
  })

  it('stores financial_breakdown in metadata', async () => {
    mockSrnCreate.mockImplementation(({ data }: any) => {
      const meta = JSON.parse(data.metadata)
      expect(meta.financial_breakdown).toEqual({ totals: { item_total: 50 } })
      return Promise.resolve({
        id: 4n,
        uuid: 'rtn-fin',
        corporation_uuid: 'corp-1',
        purchase_order_uuid: 'po-1',
        change_order_uuid: null,
        return_type: 'purchase_order',
        return_note_number: 'RTN-11',
        status: 'Returned',
        metadata: data.metadata,
        attachments: '[]',
        audit_log: '[]',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })
    })

    const { createStockReturnNote } = await import('../../../server/utils/stockReturnNotes')
    const row = await createStockReturnNote({
      corporation_uuid: 'corp-1',
      return_type: 'purchase_order',
      purchase_order_uuid: 'po-1',
      financial_breakdown: { totals: { item_total: 50 } },
    })

    expect(row.financial_breakdown).toEqual({ totals: { item_total: 50 } })
  })

  it('replaceReturnNoteItems maps line totals from return_quantity and unit_price', async () => {
    const { replaceReturnNoteItems } = await import('../../../server/utils/stockReturnNotes')
    mockRniFindMany.mockResolvedValue([
      {
        id: 1n,
        uuid: 'rni-1',
        return_note_uuid: 'rtn-1',
        item_uuid: 'poi-1',
        return_quantity: 5,
        total: 50,
        is_active: true,
      },
    ])

    await replaceReturnNoteItems('rtn-1', 'corp-1', 'proj-1', [
      { uuid: 'poi-1', return_quantity: 5, unit_price: 10 },
    ])

    expect(mockRniCreateMany).toHaveBeenCalled()
    const rows = mockRniCreateMany.mock.calls[0][0].data
    expect(rows[0].total).toBe(50)
    expect(rows[0].return_quantity).toBe(5)
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
