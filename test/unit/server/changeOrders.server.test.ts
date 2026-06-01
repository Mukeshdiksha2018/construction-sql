/**
 * MSSQL / Prisma change order server utilities (server/utils/changeOrders.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCOCreate = vi.fn()
const mockCOUpdate = vi.fn()
const mockCOFindFirst = vi.fn()
const mockCOFindMany = vi.fn()
const mockCOCount = vi.fn()
const mockCOItemFindMany = vi.fn()
const mockCOItemDeleteMany = vi.fn()
const mockCOItemCreateMany = vi.fn()
const mockLaborCOFindMany = vi.fn()
const mockLaborCODeleteMany = vi.fn()
const mockLaborCOCreateMany = vi.fn()
const mockLwFindMany = vi.fn()
const mockLwDeleteMany = vi.fn()
const mockLwCreateMany = vi.fn()
const mockPOItemFindMany = vi.fn()
const mockPOFormFindFirst = vi.fn()
const mockPOFormFindMany = vi.fn()
const mockProjectFindFirst = vi.fn()
const mockProjectFindMany = vi.fn()

vi.mock('../../../server/utils/prisma', () => ({
  getPrisma: () => ({
    changeOrder: {
      create: (...a: unknown[]) => mockCOCreate(...a),
      update: (...a: unknown[]) => mockCOUpdate(...a),
      findFirst: (...a: unknown[]) => mockCOFindFirst(...a),
      findMany: (...a: unknown[]) => mockCOFindMany(...a),
      count: (...a: unknown[]) => mockCOCount(...a),
    },
    changeOrderItem: {
      findMany: (...a: unknown[]) => mockCOItemFindMany(...a),
      deleteMany: (...a: unknown[]) => mockCOItemDeleteMany(...a),
      createMany: (...a: unknown[]) => mockCOItemCreateMany(...a),
    },
    laborChangeOrderItem: {
      findMany: (...a: unknown[]) => mockLaborCOFindMany(...a),
      deleteMany: (...a: unknown[]) => mockLaborCODeleteMany(...a),
      createMany: (...a: unknown[]) => mockLaborCOCreateMany(...a),
    },
    cOLocationWiseMaterialItem: {
      findMany: (...a: unknown[]) => mockLwFindMany(...a),
      deleteMany: (...a: unknown[]) => mockLwDeleteMany(...a),
      createMany: (...a: unknown[]) => mockLwCreateMany(...a),
    },
    purchaseOrderItem: {
      findMany: (...a: unknown[]) => mockPOItemFindMany(...a),
    },
    purchaseOrderForm: {
      findFirst: (...a: unknown[]) => mockPOFormFindFirst(...a),
      findMany: (...a: unknown[]) => mockPOFormFindMany(...a),
    },
    project: {
      findFirst: (...a: unknown[]) => mockProjectFindFirst(...a),
      findMany: (...a: unknown[]) => mockProjectFindMany(...a),
    },
  }),
}))

vi.mock('../../../server/utils/appUserOrNimbleUserId', () => ({
  normalizeAppUserUuidOrNimbleUserId: (val: unknown) => {
    const s = String(val ?? '').trim()
    if (/^[0-9a-f-]{36}$/i.test(s)) return { appUserUuid: s, nimbleUserId: null }
    if (s) return { appUserUuid: null, nimbleUserId: s }
    return { appUserUuid: null, nimbleUserId: null }
  },
}))

const SAMPLE_BREAKDOWN = {
  charges: {
    freight: { percentage: 5, amount: 25, taxable: true },
    packing: { percentage: 0, amount: 0, taxable: false },
    custom_duties: { percentage: 0, amount: 0, taxable: false },
    other: { percentage: 0, amount: 0, taxable: false },
  },
  sales_taxes: {
    sales_tax_1: { percentage: 8, amount: 40 },
    sales_tax_2: { percentage: 0, amount: 0 },
  },
  totals: {
    item_total: 500,
    charges_total: 25,
    tax_total: 40,
    total_co_amount: 565,
    total_po_amount: 565,
  },
}

function makeCORow(overrides: Record<string, unknown> = {}) {
  return {
    id: BigInt(1),
    uuid: 'co-uuid-1',
    corporation_uuid: 'corp-1',
    project_uuid: 'proj-1',
    vendor_uuid: 'vendor-1',
    original_purchase_order_uuid: 'po-uuid-1',
    co_number: 'CO-1',
    created_date: new Date('2026-05-01'),
    credit_days: '30',
    credit_days_id: null,
    estimated_delivery_date: null,
    requested_by: null,
    nimble_requested_by_user_id: null,
    co_type: 'MATERIAL',
    ship_via_uuid: 'ship-via-uuid',
    freight_uuid: 'freight-uuid',
    shipping_instructions: null,
    quote_reference: null,
    reason: null,
    reason_uuid: null,
    shipping_address_uuid: null,
    terms_and_conditions_uuid: null,
    special_instruction_uuid: null,
    financial_breakdown: JSON.stringify(SAMPLE_BREAKDOWN),
    attachments: '[]',
    removed_co_items: '[]',
    audit_log: '[]',
    prepared_by: 'Test User',
    status: 'Draft',
    print_include_approved_by_vendor: null,
    print_use_entity_name: null,
    is_revised: false,
    revision_number: null,
    revision_notes: null,
    revision_date: null,
    is_active: true,
    created_at: new Date('2026-05-01'),
    updated_at: new Date('2026-05-01'),
    ...overrides,
  }
}

async function importUtils() {
  vi.resetModules()
  return import('../../../server/utils/changeOrders')
}

describe('changeOrders server utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProjectFindMany.mockResolvedValue([])
    mockPOFormFindMany.mockResolvedValue([])
    mockCOItemDeleteMany.mockResolvedValue({ count: 0 })
    mockCOItemCreateMany.mockResolvedValue({ count: 0 })
    mockLaborCODeleteMany.mockResolvedValue({ count: 0 })
    mockLaborCOCreateMany.mockResolvedValue({ count: 0 })
    mockLwDeleteMany.mockResolvedValue({ count: 0 })
    mockLwCreateMany.mockResolvedValue({ count: 0 })
    mockLwFindMany.mockResolvedValue([])
  })

  describe('generateNextCoNumber', () => {
    it('increments from existing CO numbers in corporation', async () => {
      mockCOFindMany.mockResolvedValue([
        { co_number: 'CO-7' },
        { co_number: 'MANUAL-CO-12X' },
      ])
      const { generateNextCoNumber } = await importUtils()
      const next = await generateNextCoNumber('corp-1')
      expect(next).toBe('CO-13')
    })

    it('prefixes project id when provided', async () => {
      mockCOFindMany.mockResolvedValue([{ co_number: 'PRJ-CO-2' }])
      const { generateNextCoNumber } = await importUtils()
      const next = await generateNextCoNumber('corp-1', 'PRJ')
      expect(next).toBe('PRJ-CO-3')
    })
  })

  describe('createChangeOrder', () => {
    it('stores ship_via and freight UUIDs and builds financial_breakdown', async () => {
      const row = makeCORow({ uuid: 'co-new' })
      mockCOFindMany.mockResolvedValue([])
      mockCOCreate.mockResolvedValue(row)
      mockCOFindFirst.mockResolvedValue(row)
      mockCOItemFindMany.mockResolvedValue([])
      mockProjectFindFirst.mockResolvedValue({ project_name: 'P1', project_id: 'P-1' })
      mockPOFormFindFirst.mockResolvedValue({ po_number: 'PO-99' })

      const { createChangeOrder } = await importUtils()
      await createChangeOrder({
        corporation_uuid: 'corp-1',
        co_type: 'MATERIAL',
        ship_via_uuid: 'sv-uuid-1',
        freight_uuid: 'fr-uuid-1',
        item_total: 500,
        freight_charges_percentage: 5,
        freight_charges_amount: 25,
        freight_charges_taxable: true,
        sales_tax_1_percentage: 8,
        sales_tax_1_amount: 40,
        total_co_amount: 565,
        user_name: 'Alice',
        user_email: 'alice@test.com',
      })

      const createArg = mockCOCreate.mock.calls[0][0].data
      expect(createArg.ship_via_uuid).toBe('sv-uuid-1')
      expect(createArg.freight_uuid).toBe('fr-uuid-1')
      expect(JSON.parse(String(createArg.financial_breakdown))).toMatchObject({
        totals: expect.objectContaining({ item_total: 500 }),
      })
      const audit = JSON.parse(String(createArg.audit_log))
      expect(audit[0].action).toBe('created')
    })

    it('auto-generates co_number when requested', async () => {
      const row = makeCORow({ uuid: 'co-auto', co_number: 'CO-2' })
      mockCOFindMany.mockResolvedValue([{ co_number: 'CO-1' }])
      mockCOCreate.mockImplementation(async ({ data }) => ({ ...row, ...data }))
      mockCOFindFirst.mockResolvedValue({ ...row, co_number: 'CO-2' })
      mockCOItemFindMany.mockResolvedValue([])
      mockProjectFindFirst.mockResolvedValue(null)
      mockPOFormFindFirst.mockResolvedValue(null)

      const { createChangeOrder } = await importUtils()
      await createChangeOrder({
        corporation_uuid: 'corp-1',
        auto_generate_co_number: true,
        co_type: 'MATERIAL',
      })

      expect(mockCOCreate.mock.calls[0][0].data.co_number).toBe('CO-2')
    })
  })

  describe('getChangeOrder', () => {
    it('loads material line items and decorates financial fields', async () => {
      const row = makeCORow({ co_type: 'MATERIAL' })
      mockCOFindFirst.mockResolvedValue(row)
      mockCOItemFindMany.mockResolvedValue([
        {
          id: BigInt(1),
          uuid: 'item-1',
          corporation_uuid: 'corp-1',
          project_uuid: 'proj-1',
          change_order_uuid: 'co-uuid-1',
          order_index: 0,
          source: null,
          cost_code_uuid: null,
          cost_code_label: '',
          cost_code_number: '',
          cost_code_name: '',
          division_name: '',
          category: null,
          item_division_uuid: null,
          item_type_uuid: null,
          item_type_label: '',
          item_uuid: 'it-1',
          item_name: 'Widget',
          description: '',
          model_number: '',
          location_uuid: null,
          location_label: '',
          storage_location_uuid: null,
          storage_location_label: '',
          unit_uuid: null,
          unit_label: '',
          quantity: 2,
          unit_price: 100,
          co_quantity: 2,
          co_unit_price: 100,
          co_total: 200,
          total: 200,
          approval_checks_uuids: '[]',
          configuration_name: null,
          metadata: '{}',
          is_active: true,
        },
      ])
      mockLwFindMany.mockResolvedValue([])
      mockProjectFindFirst.mockResolvedValue({ project_name: 'Proj', project_id: 'PRJ' })
      mockPOFormFindFirst.mockResolvedValue({ po_number: 'PO-1' })

      const { getChangeOrder } = await importUtils()
      const co = await getChangeOrder('co-uuid-1')

      expect(co?.co_items).toHaveLength(1)
      expect(co?.freight_charges_percentage).toBe(5)
      expect(co?.total_co_amount).toBe(565)
      expect(co?.project_name).toBe('Proj')
      expect(co?.po_number).toBe('PO-1')
    })

    it('loads labor line items for LABOR type', async () => {
      const row = makeCORow({ co_type: 'LABOR' })
      mockCOFindFirst.mockResolvedValue(row)
      mockLaborCOFindMany.mockResolvedValue([
        {
          id: BigInt(1),
          uuid: 'labor-1',
          corporation_uuid: 'corp-1',
          project_uuid: 'proj-1',
          purchase_order_uuid: 'po-uuid-1',
          change_order_uuid: 'co-uuid-1',
          order_index: 0,
          cost_code_uuid: 'cc-1',
          cost_code_number: '01',
          cost_code_name: 'Labor',
          cost_code_label: '01 Labor',
          division_name: '',
          location_uuid: null,
          location_label: null,
          po_amount: 1000,
          co_amount: 200,
          description: null,
          metadata: '{}',
          is_active: true,
        },
      ])
      mockProjectFindFirst.mockResolvedValue(null)
      mockPOFormFindFirst.mockResolvedValue(null)

      const { getChangeOrder } = await importUtils()
      const co = await getChangeOrder('co-uuid-1')

      expect(co?.labor_co_items).toHaveLength(1)
      expect(co?.labor_co_items?.[0].co_amount).toBe(200)
    })
  })

  describe('listChangeOrders', () => {
    it('returns paginated list with project and PO enrichment', async () => {
      mockCOCount.mockResolvedValue(1)
      mockCOFindMany.mockResolvedValue([makeCORow()])
      mockProjectFindMany.mockResolvedValue([
        { uuid: 'proj-1', project_name: 'Alpha', project_id: 'A-1' },
      ])
      mockPOFormFindMany.mockResolvedValue([{ uuid: 'po-uuid-1', po_number: 'PO-100' }])

      const { listChangeOrders } = await importUtils()
      const result = await listChangeOrders('corp-1', { page: 1, pageSize: 10 })

      expect(result.data).toHaveLength(1)
      expect(result.data[0].project_name).toBe('Alpha')
      expect(result.data[0].po_number).toBe('PO-100')
      expect(result.pagination.totalRecords).toBe(1)
    })
  })

  describe('deleteChangeOrder', () => {
    it('soft-deletes active change order', async () => {
      const row = makeCORow()
      mockCOFindFirst.mockResolvedValue(row)
      mockCOUpdate.mockResolvedValue({ ...row, is_active: false })

      const { deleteChangeOrder } = await importUtils()
      const result = await deleteChangeOrder('co-uuid-1')

      expect(mockCOUpdate).toHaveBeenCalledWith({
        where: { uuid: 'co-uuid-1' },
        data: { is_active: false },
      })
      expect(result?.uuid).toBe('co-uuid-1')
    })
  })

  describe('attachments', () => {
    it('uploadChangeOrderAttachments stores PDF as data URL in JSON', async () => {
      mockCOFindFirst.mockResolvedValue({
        uuid: 'co-uuid-1',
        attachments: '[]',
      })
      mockCOUpdate.mockResolvedValue({})

      const { uploadChangeOrderAttachments } = await importUtils()
      const pdfBase64 = Buffer.from('%PDF-1.4').toString('base64')
      const result = await uploadChangeOrderAttachments('co-uuid-1', [
        {
          name: 'doc.pdf',
          type: 'application/pdf',
          size: 100,
          fileData: `data:application/pdf;base64,${pdfBase64}`,
        },
      ])

      expect(result?.success).toBe(true)
      expect(result?.attachments).toHaveLength(1)
      expect(result?.attachments[0].file_url).toMatch(/^data:application\/pdf;base64,/)
      expect(mockCOUpdate).toHaveBeenCalled()
    })

    it('removeChangeOrderAttachment removes by uuid', async () => {
      const existing = [
        { uuid: 'att-1', document_name: 'a.pdf' },
        { uuid: 'att-2', document_name: 'b.pdf' },
      ]
      mockCOFindFirst.mockResolvedValue({
        uuid: 'co-uuid-1',
        attachments: JSON.stringify(existing),
      })
      mockCOUpdate.mockResolvedValue({})

      const { removeChangeOrderAttachment } = await importUtils()
      const result = await removeChangeOrderAttachment('co-uuid-1', 'att-1')

      expect(result?.attachments).toHaveLength(1)
      expect(result?.attachments[0].uuid).toBe('att-2')
    })
  })

  describe('getChangeOrderInvoiceSummary', () => {
    it('computes balance from line items', async () => {
      mockCOFindFirst.mockResolvedValue({
        uuid: 'co-uuid-1',
        financial_breakdown: JSON.stringify(SAMPLE_BREAKDOWN),
      })
      mockCOItemFindMany.mockResolvedValue([
        { uuid: 'i1', co_quantity: 2, co_unit_price: 100, unit_price: 100 },
        { uuid: 'i2', co_quantity: 1, co_unit_price: 50, unit_price: 50 },
      ])

      const { getChangeOrderInvoiceSummary } = await importUtils()
      const summary = await getChangeOrderInvoiceSummary('co-uuid-1')

      expect(summary?.balance_to_be_invoiced).toBe(250)
      expect(summary?.total_co_quantity).toBe(3)
      expect(summary?.advance_paid).toBe(0)
    })
  })
})
