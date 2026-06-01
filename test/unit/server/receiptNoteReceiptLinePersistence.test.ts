import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockSrnFindFirst = vi.fn()
const mockRniFindFirst = vi.fn()
const mockRniCreate = vi.fn()
const mockRniUpdate = vi.fn()
const mockPoItemFindMany = vi.fn()
const mockPoItemUpdate = vi.fn()
const mockCoItemFindMany = vi.fn()
const mockCoItemUpdate = vi.fn()

vi.mock('../../../server/utils/prisma', () => ({
  getPrisma: () => ({
    stockReceiptNote: {
      findFirst: (...a: unknown[]) => mockSrnFindFirst(...a),
    },
    receiptNoteItem: {
      findFirst: (...a: unknown[]) => mockRniFindFirst(...a),
      create: (...a: unknown[]) => mockRniCreate(...a),
      update: (...a: unknown[]) => mockRniUpdate(...a),
    },
    purchaseOrderItem: {
      findMany: (...a: unknown[]) => mockPoItemFindMany(...a),
      update: (...a: unknown[]) => mockPoItemUpdate(...a),
    },
    changeOrderItem: {
      findMany: (...a: unknown[]) => mockCoItemFindMany(...a),
      update: (...a: unknown[]) => mockCoItemUpdate(...a),
    },
  }),
}))

describe('receiptNoteReceiptLinePersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSrnFindFirst.mockResolvedValue({
      uuid: 'rn-1',
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
      purchase_order_uuid: 'po-1',
      change_order_uuid: null,
    })
    mockRniFindFirst.mockResolvedValue(null)
    mockRniCreate.mockResolvedValue({ uuid: 'rni-new' })
    mockPoItemFindMany.mockResolvedValue([
      { uuid: 'poi-1', receipt_note_uuids: null },
      { uuid: 'poi-2', receipt_note_uuids: '["rn-other"]' },
    ])
    mockPoItemUpdate.mockResolvedValue({})
    mockCoItemFindMany.mockResolvedValue([])
    mockCoItemUpdate.mockResolvedValue({})
  })

  it('returns early when items array is empty', async () => {
    const { applyPurchaseOrderReceiptFieldsUpdate } = await import(
      '../../../server/utils/receiptNoteReceiptLinePersistence'
    )
    const result = await applyPurchaseOrderReceiptFieldsUpdate({
      receipt_note_uuid: 'rn-1',
      corporation_uuid: 'corp-1',
      items: [],
    })
    expect(result).toEqual({
      success: true,
      updated: 0,
      receipt_note_items_created: 0,
    })
    expect(mockRniCreate).not.toHaveBeenCalled()
  })

  it('throws when receipt note is missing', async () => {
    mockSrnFindFirst.mockResolvedValue(null)
    const { applyPurchaseOrderReceiptFieldsUpdate } = await import(
      '../../../server/utils/receiptNoteReceiptLinePersistence'
    )
    await expect(
      applyPurchaseOrderReceiptFieldsUpdate({
        receipt_note_uuid: 'rn-missing',
        corporation_uuid: 'corp-1',
        items: [{ uuid: 'poi-1', received_quantity: 1, unit_price: 10 }],
      }),
    ).rejects.toMatchObject({ statusCode: 404 })
  })

  it('creates PO receipt lines and appends receipt_note_uuid on PO items', async () => {
    const { applyPurchaseOrderReceiptFieldsUpdate } = await import(
      '../../../server/utils/receiptNoteReceiptLinePersistence'
    )
    const result = await applyPurchaseOrderReceiptFieldsUpdate({
      receipt_note_uuid: 'rn-1',
      corporation_uuid: 'corp-1',
      purchase_order_uuid: 'po-1',
      items: [
        { uuid: 'poi-1', received_quantity: 2, unit_price: 50, grn_total: 100 },
        { uuid: 'poi-2', received_quantity: 1, unit_price: 25, grn_total: 25 },
      ],
    })

    expect(result.success).toBe(true)
    expect(result.updated).toBe(2)
    expect(result.receipt_note_items_created).toBe(2)
    expect(mockRniCreate).toHaveBeenCalledTimes(2)
    expect(mockPoItemUpdate).toHaveBeenCalled()
    const updateArg = mockPoItemUpdate.mock.calls[0][0]
    expect(updateArg.data.receipt_note_uuids).toContain('rn-1')
  })

  it('updates existing receipt line instead of creating duplicate', async () => {
    mockRniFindFirst.mockResolvedValue({ uuid: 'rni-existing', item_uuid: 'poi-1' })
    const { applyPurchaseOrderReceiptFieldsUpdate } = await import(
      '../../../server/utils/receiptNoteReceiptLinePersistence'
    )
    const result = await applyPurchaseOrderReceiptFieldsUpdate({
      receipt_note_uuid: 'rn-1',
      corporation_uuid: 'corp-1',
      items: [{ uuid: 'poi-1', received_quantity: 5, unit_price: 10 }],
    })
    expect(mockRniUpdate).toHaveBeenCalled()
    expect(mockRniCreate).not.toHaveBeenCalled()
    expect(result.receipt_note_items_created).toBe(0)
  })

  it('persists change order receipt lines', async () => {
    mockSrnFindFirst.mockResolvedValue({
      uuid: 'rn-co',
      corporation_uuid: 'corp-1',
      purchase_order_uuid: null,
      change_order_uuid: 'co-1',
    })
    mockCoItemFindMany.mockResolvedValue([{ uuid: 'coi-1', receipt_note_uuids: null }])
    const { applyChangeOrderReceiptFieldsUpdate } = await import(
      '../../../server/utils/receiptNoteReceiptLinePersistence'
    )
    const result = await applyChangeOrderReceiptFieldsUpdate({
      receipt_note_uuid: 'rn-co',
      corporation_uuid: 'corp-1',
      change_order_uuid: 'co-1',
      items: [{ uuid: 'coi-1', received_quantity: 3, unit_price: 20, grn_total: 60 }],
    })
    expect(result.updated).toBe(1)
    expect(mockRniCreate).toHaveBeenCalled()
    expect(mockCoItemUpdate).toHaveBeenCalled()
  })
})
