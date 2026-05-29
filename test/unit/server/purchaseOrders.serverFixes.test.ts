/**
 * Tests for freight UUID persistence and financial_breakdown round-trip in
 * server/utils/purchaseOrders.ts:
 *
 * FIX 1 — freight / ship_via UUID preference on save
 *   createPurchaseOrder and updatePurchaseOrder now store freight_uuid /
 *   ship_via_uuid (master-table UUID) instead of the display name string.
 *
 * FIX 2 — financial_breakdown round-trip via mapPORow
 *   When a PO is read back, mapPORow unpacks the saved JSON into the individual
 *   charge/tax fields the form expects (freight_charges_percentage, etc.).
 *
 * FIX 3 — explicit freight_uuid / ship_via_uuid on mapped row
 *   mapPORow exposes these fields so PurchaseOrderForm select models resolve
 *   without treating the freight/ship_via columns as fallback UUIDs.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mock Prisma ───────────────────────────────────────────────────────────────
const mockPOFormCreate = vi.fn()
const mockPOFormUpdate = vi.fn()
const mockPOFormFindFirst = vi.fn()
const mockPOFormFindMany = vi.fn()
const mockPOFormCount = vi.fn()
const mockPOItemFindMany = vi.fn()
const mockLaborItemFindMany = vi.fn()
const mockLwMaterialFindMany = vi.fn()
const mockProjectFindFirst = vi.fn()
const mockProjectFindMany = vi.fn()

vi.mock('../../../server/utils/prisma', () => ({
  getPrisma: () => ({
    purchaseOrderForm: {
      create: (...a: unknown[]) => mockPOFormCreate(...a),
      update: (...a: unknown[]) => mockPOFormUpdate(...a),
      findFirst: (...a: unknown[]) => mockPOFormFindFirst(...a),
      findMany: (...a: unknown[]) => mockPOFormFindMany(...a),
      count: (...a: unknown[]) => mockPOFormCount(...a),
    },
    purchaseOrderItem: {
      findMany: (...a: unknown[]) => mockPOItemFindMany(...a),
    },
    laborPurchaseOrderItem: {
      findMany: (...a: unknown[]) => mockLaborItemFindMany(...a),
    },
    pOLocationWiseMaterialItem: {
      findMany: (...a: unknown[]) => mockLwMaterialFindMany(...a),
    },
    project: {
      findFirst: (...a: unknown[]) => mockProjectFindFirst(...a),
      findMany: (...a: unknown[]) => mockProjectFindMany(...a),
    },
  }),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const SAMPLE_FINANCIAL_BREAKDOWN = {
  charges: {
    freight: { percentage: 5, amount: 50, taxable: true },
    packing: { percentage: 2, amount: 20, taxable: false },
    custom_duties: { percentage: 0, amount: 0, taxable: false },
    other: { percentage: 1, amount: 10, taxable: true },
  },
  sales_taxes: {
    sales_tax_1: { percentage: 8, amount: 86.4 },
    sales_tax_2: { percentage: 0, amount: 0 },
  },
  totals: {
    item_total: 1000,
    charges_total: 80,
    tax_total: 86.4,
    total_po_amount: 1166.4,
  },
}

function makePrismaPORow(overrides: Record<string, unknown> = {}) {
  return {
    id: BigInt(1),
    uuid: 'po-uuid-1',
    corporation_uuid: 'corp-1',
    project_uuid: 'proj-1',
    po_number: 'PO-001',
    entry_date: new Date('2026-05-01'),
    po_type: 'MATERIAL',
    credit_days: '30',
    credit_days_id: 'cd-1',
    ship_via: 'sv-uuid-fedex',
    freight: 'fr-uuid-ups',
    shipping_instructions: null,
    estimated_delivery_date: null,
    include_items: 'IMPORT_ITEMS_FROM_ESTIMATE',
    quote_reference: null,
    terms_and_conditions: null,
    item_total: 1000,
    charges_total: 80,
    tax_total: 86.4,
    total_po_amount: 1166.4,
    vendor_uuid: 'vendor-1',
    billing_address_uuid: null,
    shipping_address_uuid: null,
    status: 'Draft',
    financial_breakdown: JSON.stringify(SAMPLE_FINANCIAL_BREAKDOWN),
    attachments: '[]',
    removed_po_items: '[]',
    audit_log: '[]',
    prepared_by: null,
    approved_by: null,
    approved_at: null,
    print_include_approved_by_vendor: null,
    print_use_entity_name: null,
    special_instruction_uuid: null,
    is_active: true,
    created_at: new Date('2026-05-01'),
    updated_at: new Date('2026-05-01'),
    ...overrides,
  }
}

async function importUtils() {
  return import('../../../server/utils/purchaseOrders')
}

// ══════════════════════════════════════════════════════════════════════════════
// createPurchaseOrder — UUID preference + financial_breakdown persistence
// ══════════════════════════════════════════════════════════════════════════════
describe('createPurchaseOrder – freight / ship_via UUID preference', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPOFormCreate.mockImplementation(async ({ data }: any) => ({
      ...makePrismaPORow(),
      ship_via: data.ship_via,
      freight: data.freight,
      financial_breakdown: data.financial_breakdown,
    }))
    mockPOItemFindMany.mockResolvedValue([])
    mockProjectFindFirst.mockResolvedValue(null)
  })

  it('stores freight_uuid when both freight_uuid and freight name are provided', async () => {
    const { createPurchaseOrder } = await importUtils()
    await createPurchaseOrder({
      corporation_uuid: 'corp-1',
      entry_date: '2026-05-01',
      freight_uuid: 'fr-uuid-ups',
      freight: 'UPS Ground',
    })

    const createArg = mockPOFormCreate.mock.calls[0][0]
    expect(createArg.data.freight).toBe('fr-uuid-ups')
  })

  it('falls back to freight name when freight_uuid is absent', async () => {
    const { createPurchaseOrder } = await importUtils()
    await createPurchaseOrder({
      corporation_uuid: 'corp-1',
      entry_date: '2026-05-01',
      freight: 'Manual Freight Name',
    })

    const createArg = mockPOFormCreate.mock.calls[0][0]
    expect(createArg.data.freight).toBe('Manual Freight Name')
  })

  it('stores ship_via_uuid when both ship_via_uuid and ship_via name are provided', async () => {
    const { createPurchaseOrder } = await importUtils()
    await createPurchaseOrder({
      corporation_uuid: 'corp-1',
      entry_date: '2026-05-01',
      ship_via_uuid: 'sv-uuid-fedex',
      ship_via: 'FedEx Ground',
    })

    const createArg = mockPOFormCreate.mock.calls[0][0]
    expect(createArg.data.ship_via).toBe('sv-uuid-fedex')
  })

  it('falls back to ship_via name when ship_via_uuid is absent', async () => {
    const { createPurchaseOrder } = await importUtils()
    await createPurchaseOrder({
      corporation_uuid: 'corp-1',
      entry_date: '2026-05-01',
      ship_via: 'Manual Ship Via',
    })

    const createArg = mockPOFormCreate.mock.calls[0][0]
    expect(createArg.data.ship_via).toBe('Manual Ship Via')
  })

  it('persists financial_breakdown as a JSON string', async () => {
    const { createPurchaseOrder } = await importUtils()
    await createPurchaseOrder({
      corporation_uuid: 'corp-1',
      entry_date: '2026-05-01',
      financial_breakdown: SAMPLE_FINANCIAL_BREAKDOWN,
    })

    const createArg = mockPOFormCreate.mock.calls[0][0]
    expect(typeof createArg.data.financial_breakdown).toBe('string')
    expect(JSON.parse(createArg.data.financial_breakdown)).toEqual(SAMPLE_FINANCIAL_BREAKDOWN)
  })

  it('returns mapped row with freight_uuid and ship_via_uuid exposed', async () => {
    mockPOFormCreate.mockResolvedValue(makePrismaPORow({
      ship_via: 'sv-uuid-fedex',
      freight: 'fr-uuid-ups',
    }))

    const { createPurchaseOrder } = await importUtils()
    const result = await createPurchaseOrder({
      corporation_uuid: 'corp-1',
      entry_date: '2026-05-01',
      freight_uuid: 'fr-uuid-ups',
      ship_via_uuid: 'sv-uuid-fedex',
    })

    expect(result.freight).toBe('fr-uuid-ups')
    expect(result.ship_via).toBe('sv-uuid-fedex')
    expect(result.freight_uuid).toBe('fr-uuid-ups')
    expect(result.ship_via_uuid).toBe('sv-uuid-fedex')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// updatePurchaseOrder — UUID preference on partial updates
// ══════════════════════════════════════════════════════════════════════════════
describe('updatePurchaseOrder – freight / ship_via UUID preference', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPOFormFindFirst.mockResolvedValue(makePrismaPORow())
    mockPOFormUpdate.mockResolvedValue(makePrismaPORow())
    mockPOItemFindMany.mockResolvedValue([])
    mockProjectFindFirst.mockResolvedValue(null)
  })

  it('prefers freight_uuid over freight display name on update', async () => {
    const { updatePurchaseOrder } = await importUtils()
    await updatePurchaseOrder('po-uuid-1', {
      freight_uuid: 'fr-new-uuid',
      freight: 'Old Display Name',
    })

    const updateArg = mockPOFormUpdate.mock.calls[0][0]
    expect(updateArg.data.freight).toBe('fr-new-uuid')
  })

  it('prefers ship_via_uuid over ship_via display name on update', async () => {
    const { updatePurchaseOrder } = await importUtils()
    await updatePurchaseOrder('po-uuid-1', {
      ship_via_uuid: 'sv-new-uuid',
      ship_via: 'Old Ship Via Name',
    })

    const updateArg = mockPOFormUpdate.mock.calls[0][0]
    expect(updateArg.data.ship_via).toBe('sv-new-uuid')
  })

  it('does not touch freight when neither freight_uuid nor freight is in payload', async () => {
    const { updatePurchaseOrder } = await importUtils()
    await updatePurchaseOrder('po-uuid-1', { status: 'Ready' })

    const updateArg = mockPOFormUpdate.mock.calls[0][0]
    expect(updateArg.data.freight).toBeUndefined()
    expect(updateArg.data.ship_via).toBeUndefined()
  })

  it('clears freight to null when freight_uuid is explicitly empty string', async () => {
    const { updatePurchaseOrder } = await importUtils()
    await updatePurchaseOrder('po-uuid-1', { freight_uuid: '', freight: '' })

    const updateArg = mockPOFormUpdate.mock.calls[0][0]
    // Empty string is falsy → falls through to null (cleared in DB)
    expect(updateArg.data.freight).toBeNull()
  })

  it('stringifies financial_breakdown on update', async () => {
    const { updatePurchaseOrder } = await importUtils()
    await updatePurchaseOrder('po-uuid-1', { financial_breakdown: SAMPLE_FINANCIAL_BREAKDOWN })

    const updateArg = mockPOFormUpdate.mock.calls[0][0]
    expect(typeof updateArg.data.financial_breakdown).toBe('string')
    expect(JSON.parse(updateArg.data.financial_breakdown)).toEqual(SAMPLE_FINANCIAL_BREAKDOWN)
  })

  it('returns null when PO does not exist', async () => {
    mockPOFormFindFirst.mockResolvedValue(null)
    const { updatePurchaseOrder } = await importUtils()
    const result = await updatePurchaseOrder('missing-uuid', { status: 'Ready' })
    expect(result).toBeNull()
    expect(mockPOFormUpdate).not.toHaveBeenCalled()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// terms_and_conditions_uuid — stored in terms_and_conditions column
// ══════════════════════════════════════════════════════════════════════════════
describe('createPurchaseOrder – terms_and_conditions_uuid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPOFormCreate.mockImplementation(async ({ data }: any) => ({
      ...makePrismaPORow(),
      terms_and_conditions: data.terms_and_conditions,
    }))
    mockPOItemFindMany.mockResolvedValue([])
    mockProjectFindFirst.mockResolvedValue(null)
  })

  it('stores terms_and_conditions_uuid in the terms_and_conditions column', async () => {
    const { createPurchaseOrder } = await importUtils()
    await createPurchaseOrder({
      corporation_uuid: 'corp-1',
      entry_date: '2026-05-01',
      terms_and_conditions_uuid: '11111111-1111-1111-1111-111111111111',
    })

    const createArg = mockPOFormCreate.mock.calls[0][0]
    expect(createArg.data.terms_and_conditions).toBe('11111111-1111-1111-1111-111111111111')
  })

  it('prefers terms_and_conditions_uuid over legacy terms_and_conditions text', async () => {
    const { createPurchaseOrder } = await importUtils()
    await createPurchaseOrder({
      corporation_uuid: 'corp-1',
      entry_date: '2026-05-01',
      terms_and_conditions_uuid: '11111111-1111-1111-1111-111111111111',
      terms_and_conditions: 'Legacy inline HTML',
    })

    const createArg = mockPOFormCreate.mock.calls[0][0]
    expect(createArg.data.terms_and_conditions).toBe('11111111-1111-1111-1111-111111111111')
  })

  it('returns terms_and_conditions_uuid on the mapped row when stored value is a UUID', async () => {
    mockPOFormCreate.mockResolvedValue(makePrismaPORow({
      terms_and_conditions: '11111111-1111-1111-1111-111111111111',
    }))

    const { createPurchaseOrder } = await importUtils()
    const result = await createPurchaseOrder({
      corporation_uuid: 'corp-1',
      entry_date: '2026-05-01',
      terms_and_conditions_uuid: '11111111-1111-1111-1111-111111111111',
    })

    expect(result.terms_and_conditions_uuid).toBe('11111111-1111-1111-1111-111111111111')
    expect(result.terms_and_conditions).toBe('11111111-1111-1111-1111-111111111111')
  })
})

describe('updatePurchaseOrder – print option flags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPOFormFindFirst.mockResolvedValue(makePrismaPORow())
    mockPOFormUpdate.mockResolvedValue(makePrismaPORow())
    mockPOItemFindMany.mockResolvedValue([])
    mockProjectFindFirst.mockResolvedValue(null)
  })

  it('persists print_include_approved_by_vendor as false (not null)', async () => {
    const { updatePurchaseOrder } = await importUtils()
    await updatePurchaseOrder('po-uuid-1', {
      print_include_approved_by_vendor: false,
    })

    const updateArg = mockPOFormUpdate.mock.calls[0][0]
    expect(updateArg.data.print_include_approved_by_vendor).toBe(false)
  })

  it('persists print_use_entity_name as true', async () => {
    const { updatePurchaseOrder } = await importUtils()
    await updatePurchaseOrder('po-uuid-1', {
      print_use_entity_name: true,
    })

    const updateArg = mockPOFormUpdate.mock.calls[0][0]
    expect(updateArg.data.print_use_entity_name).toBe(true)
  })

  it('returns print flags on mapped row after create', async () => {
    mockPOFormCreate.mockResolvedValue(makePrismaPORow({
      print_include_approved_by_vendor: true,
      print_use_entity_name: false,
    }))
    mockPOItemFindMany.mockResolvedValue([])
    mockProjectFindFirst.mockResolvedValue(null)

    const { createPurchaseOrder } = await importUtils()
    const result = await createPurchaseOrder({
      corporation_uuid: 'corp-1',
      entry_date: '2026-05-01',
      print_include_approved_by_vendor: true,
      print_use_entity_name: false,
    })

    expect(result.print_include_approved_by_vendor).toBe(true)
    expect(result.print_use_entity_name).toBe(false)
  })
})

describe('updatePurchaseOrder – terms_and_conditions_uuid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPOFormFindFirst.mockResolvedValue(makePrismaPORow())
    mockPOFormUpdate.mockResolvedValue(makePrismaPORow())
    mockPOItemFindMany.mockResolvedValue([])
    mockProjectFindFirst.mockResolvedValue(null)
  })

  it('persists terms_and_conditions_uuid when only uuid is in payload', async () => {
    const { updatePurchaseOrder } = await importUtils()
    await updatePurchaseOrder('po-uuid-1', {
      terms_and_conditions_uuid: '33333333-3333-3333-3333-333333333333',
    })

    const updateArg = mockPOFormUpdate.mock.calls[0][0]
    expect(updateArg.data.terms_and_conditions).toBe('33333333-3333-3333-3333-333333333333')
  })

  it('does not touch terms_and_conditions when uuid field is omitted', async () => {
    const { updatePurchaseOrder } = await importUtils()
    await updatePurchaseOrder('po-uuid-1', { status: 'Ready' })

    const updateArg = mockPOFormUpdate.mock.calls[0][0]
    expect(updateArg.data.terms_and_conditions).toBeUndefined()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// getPurchaseOrder / mapPORow — financial_breakdown field restoration
// ══════════════════════════════════════════════════════════════════════════════
describe('getPurchaseOrder – financial_breakdown field restoration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPOFormFindFirst.mockResolvedValue(makePrismaPORow())
    mockPOItemFindMany.mockResolvedValue([])
    mockProjectFindFirst.mockResolvedValue(null)
  })

  it('parses financial_breakdown JSON into an object', async () => {
    const { getPurchaseOrder } = await importUtils()
    const po = await getPurchaseOrder('po-uuid-1')
    expect(po?.financial_breakdown).toEqual(SAMPLE_FINANCIAL_BREAKDOWN)
  })

  it('restores freight charge fields from financial_breakdown.charges.freight', async () => {
    const { getPurchaseOrder } = await importUtils()
    const po = await getPurchaseOrder('po-uuid-1')
    expect(po?.freight_charges_percentage).toBe(5)
    expect(po?.freight_charges_amount).toBe(50)
    expect(po?.freight_charges_taxable).toBe(true)
  })

  it('restores packing charge fields from financial_breakdown.charges.packing', async () => {
    const { getPurchaseOrder } = await importUtils()
    const po = await getPurchaseOrder('po-uuid-1')
    expect(po?.packing_charges_percentage).toBe(2)
    expect(po?.packing_charges_amount).toBe(20)
    expect(po?.packing_charges_taxable).toBe(false)
  })

  it('restores custom_duties charge fields from financial_breakdown.charges.custom_duties', async () => {
    const { getPurchaseOrder } = await importUtils()
    const po = await getPurchaseOrder('po-uuid-1')
    expect(po?.custom_duties_charges_percentage).toBe(0)
    expect(po?.custom_duties_charges_amount).toBe(0)
    expect(po?.custom_duties_charges_taxable).toBe(false)
  })

  it('restores other charge fields from financial_breakdown.charges.other', async () => {
    const { getPurchaseOrder } = await importUtils()
    const po = await getPurchaseOrder('po-uuid-1')
    expect(po?.other_charges_percentage).toBe(1)
    expect(po?.other_charges_amount).toBe(10)
    expect(po?.other_charges_taxable).toBe(true)
  })

  it('restores sales tax fields from financial_breakdown.sales_taxes', async () => {
    const { getPurchaseOrder } = await importUtils()
    const po = await getPurchaseOrder('po-uuid-1')
    expect(po?.sales_tax_1_percentage).toBe(8)
    expect(po?.sales_tax_1_amount).toBe(86.4)
    expect(po?.sales_tax_2_percentage).toBe(0)
    expect(po?.sales_tax_2_amount).toBe(0)
  })

  it('returns null charge fields when financial_breakdown is null', async () => {
    mockPOFormFindFirst.mockResolvedValue(makePrismaPORow({ financial_breakdown: null }))
    const { getPurchaseOrder } = await importUtils()
    const po = await getPurchaseOrder('po-uuid-1')
    expect(po?.financial_breakdown).toBeNull()
    expect(po?.freight_charges_percentage).toBeNull()
    expect(po?.freight_charges_taxable).toBe(false)
    expect(po?.sales_tax_1_percentage).toBeNull()
  })

  it('returns null charge fields when financial_breakdown is invalid JSON', async () => {
    mockPOFormFindFirst.mockResolvedValue(makePrismaPORow({ financial_breakdown: 'not-json{{{' }))
    const { getPurchaseOrder } = await importUtils()
    const po = await getPurchaseOrder('po-uuid-1')
    expect(po?.financial_breakdown).toBeNull()
    expect(po?.freight_charges_percentage).toBeNull()
  })

  it('exposes freight_uuid and ship_via_uuid equal to stored column values', async () => {
    const { getPurchaseOrder } = await importUtils()
    const po = await getPurchaseOrder('po-uuid-1')
    expect(po?.freight_uuid).toBe('fr-uuid-ups')
    expect(po?.ship_via_uuid).toBe('sv-uuid-fedex')
  })

  it('exposes terms_and_conditions_uuid when terms_and_conditions column holds a UUID', async () => {
    mockPOFormFindFirst.mockResolvedValue(makePrismaPORow({
      terms_and_conditions: '22222222-2222-2222-2222-222222222222',
    }))
    const { getPurchaseOrder } = await importUtils()
    const po = await getPurchaseOrder('po-uuid-1')
    expect(po?.terms_and_conditions_uuid).toBe('22222222-2222-2222-2222-222222222222')
  })

  it('does not set terms_and_conditions_uuid when column holds inline HTML', async () => {
    mockPOFormFindFirst.mockResolvedValue(makePrismaPORow({
      terms_and_conditions: '<p>Inline terms</p>',
    }))
    const { getPurchaseOrder } = await importUtils()
    const po = await getPurchaseOrder('po-uuid-1')
    expect(po?.terms_and_conditions_uuid).toBeNull()
    expect(po?.terms_and_conditions).toBe('<p>Inline terms</p>')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// End-to-end round-trip: save with UUID + breakdown → read back with fields
// ══════════════════════════════════════════════════════════════════════════════
describe('PO save round-trip – freight UUID + financial breakdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPOItemFindMany.mockResolvedValue([])
    mockProjectFindFirst.mockResolvedValue(null)
  })

  it('create → getPurchaseOrder restores all charge fields and UUIDs', async () => {
    const savedRow = makePrismaPORow({
      uuid: 'po-roundtrip',
      ship_via: 'sv-uuid-dhl',
      freight: 'fr-uuid-fedex',
      financial_breakdown: JSON.stringify(SAMPLE_FINANCIAL_BREAKDOWN),
    })

    mockPOFormCreate.mockResolvedValue(savedRow)
    mockPOFormFindFirst.mockResolvedValue(savedRow)
    mockPOFormUpdate.mockResolvedValue(savedRow)

    const { createPurchaseOrder, updatePurchaseOrder, getPurchaseOrder } = await importUtils()

    const created = await createPurchaseOrder({
      corporation_uuid: 'corp-1',
      entry_date: '2026-05-01',
      freight_uuid: 'fr-uuid-fedex',
      freight: 'FedEx',
      ship_via_uuid: 'sv-uuid-dhl',
      ship_via: 'DHL',
      financial_breakdown: SAMPLE_FINANCIAL_BREAKDOWN,
      item_total: 1000,
      charges_total: 80,
      tax_total: 86.4,
      total_po_amount: 1166.4,
    })

    expect(created.freight_uuid).toBe('fr-uuid-fedex')
    expect(created.ship_via_uuid).toBe('sv-uuid-dhl')

    const updated = await updatePurchaseOrder('po-roundtrip', {
      freight_uuid: 'fr-uuid-fedex',
      financial_breakdown: SAMPLE_FINANCIAL_BREAKDOWN,
    })
    expect(updated?.freight_charges_percentage).toBe(5)
    expect(updated?.freight_charges_taxable).toBe(true)

    const fetched = await getPurchaseOrder('po-roundtrip')
    expect(fetched?.freight).toBe('fr-uuid-fedex')
    expect(fetched?.ship_via).toBe('sv-uuid-dhl')
    expect(fetched?.freight_uuid).toBe('fr-uuid-fedex')
    expect(fetched?.ship_via_uuid).toBe('sv-uuid-dhl')
    expect(fetched?.financial_breakdown?.totals?.total_po_amount).toBe(1166.4)
    expect(fetched?.freight_charges_percentage).toBe(5)
    expect(fetched?.packing_charges_percentage).toBe(2)
    expect(fetched?.sales_tax_1_percentage).toBe(8)
  })
})
