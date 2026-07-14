/**
 * Tests for the two recent bug fixes in server/utils/estimates.ts:
 *
 * FIX 1 – deleteEstimate BigInt serialization
 *   deleteEstimate used to return the raw Prisma row (BigInt id) causing
 *   "Do not know how to serialize a BigInt" errors. It now passes the row
 *   through mapEstimateRow() which converts BigInt → string.
 *
 * FIX 2 – sequence coercion in insertLineItems
 *   Material-item rows arrived from the frontend with sequence set to the
 *   item's alphanumeric spec code (e.g. "Y", "SB-001"). The DB column is
 *   INT so Prisma rejected the value. sequence is now coerced to an integer
 *   (parseInt with idx+1 fallback).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mock Prisma ────────────────────────────────────────────────────────────────
const mockEstimateFindFirst = vi.fn()
const mockEstimateFindMany = vi.fn()
const mockEstimateCreate = vi.fn()
const mockEstimateUpdate = vi.fn()
const mockEstimateCount = vi.fn()
const mockProjectFindFirst = vi.fn()
const mockProjectFindMany = vi.fn()
const mockLineItemCreateMany = vi.fn()
const mockLineItemFindMany = vi.fn()
const mockLineItemDeleteMany = vi.fn()
const mockMaterialItemCreateMany = vi.fn()
const mockMaterialItemFindMany = vi.fn()
const mockLwLaborCreateMany = vi.fn()
const mockLwMaterialCreateMany = vi.fn()
const mockLwLaborFindMany = vi.fn()
const mockLwMaterialFindMany = vi.fn()
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
    estimate: {
      findFirst: (...a: unknown[]) => mockEstimateFindFirst(...a),
      findMany: (...a: unknown[]) => mockEstimateFindMany(...a),
      create: (...a: unknown[]) => mockEstimateCreate(...a),
      update: (...a: unknown[]) => mockEstimateUpdate(...a),
      count: (...a: unknown[]) => mockEstimateCount(...a),
    },
    project: {
      findFirst: (...a: unknown[]) => mockProjectFindFirst(...a),
      findMany: (...a: unknown[]) => mockProjectFindMany(...a),
    },
    estimateLineItem: {
      createMany: (...a: unknown[]) => mockLineItemCreateMany(...a),
      findMany: (...a: unknown[]) => mockLineItemFindMany(...a),
      deleteMany: (...a: unknown[]) => mockLineItemDeleteMany(...a),
    },
    estimateMaterialItem: {
      createMany: (...a: unknown[]) => mockMaterialItemCreateMany(...a),
      findMany: (...a: unknown[]) => mockMaterialItemFindMany(...a),
    },
    estimateLocationWiseLabor: {
      createMany: (...a: unknown[]) => mockLwLaborCreateMany(...a),
      findMany: (...a: unknown[]) => mockLwLaborFindMany(...a),
    },
    estimateLocationWiseMaterial: {
      createMany: (...a: unknown[]) => mockLwMaterialCreateMany(...a),
      findMany: (...a: unknown[]) => mockLwMaterialFindMany(...a),
    },
    estimateAttachment: emptyChildDelegate(),
    estimateRemovedCostCode: emptyChildDelegate(),
    estimateAuditEvent: emptyChildDelegate(),
  }),
}))

// ── Helpers ────────────────────────────────────────────────────────────────────

/** A raw Prisma estimate row that contains a real BigInt id (simulates DB row). */
const makePrismaEstimateRow = (overrides: Record<string, unknown> = {}) => ({
  id: BigInt(42),
  uuid: 'est-uuid-1',
  corporation_uuid: 'corp-1',
  project_uuid: 'proj-1',
  estimate_number: 'EST-001',
  estimate_date: new Date('2026-05-01'),
  valid_until: null,
  status: 'Draft',
  total_amount: { toNumber: () => 1000 },
  tax_amount: { toNumber: () => 0 },
  discount_amount: { toNumber: () => 0 },
  final_amount: { toNumber: () => 1000 },
  notes: null,
  created_by: null,
  approved_by: null,
  approved_at: null,
  is_active: true,
  created_at: new Date('2026-05-01'),
  updated_at: new Date('2026-05-01'),
  ...overrides,
})

const makeCreatedEstimate = (overrides = {}) => ({
  ...makePrismaEstimateRow(),
  uuid: 'new-est-uuid',
  ...overrides,
})

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('deleteEstimate – BigInt serialization fix', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an object with id as a string, not BigInt', async () => {
    mockEstimateFindFirst.mockResolvedValue(makePrismaEstimateRow())
    mockEstimateUpdate.mockResolvedValue(undefined)

    const { deleteEstimate } = await import('../../../server/utils/estimates')
    const result = await deleteEstimate('est-uuid-1')

    expect(result).not.toBeNull()
    expect(typeof result!.id).toBe('string')
    expect(result!.id).toBe('42')
  })

  it('result can be JSON.stringify\'d without throwing', async () => {
    mockEstimateFindFirst.mockResolvedValue(makePrismaEstimateRow())
    mockEstimateUpdate.mockResolvedValue(undefined)

    const { deleteEstimate } = await import('../../../server/utils/estimates')
    const result = await deleteEstimate('est-uuid-1')

    expect(() => JSON.stringify(result)).not.toThrow()
  })

  it('result does not contain any BigInt values', async () => {
    mockEstimateFindFirst.mockResolvedValue(makePrismaEstimateRow({ id: BigInt(999) }))
    mockEstimateUpdate.mockResolvedValue(undefined)

    const { deleteEstimate } = await import('../../../server/utils/estimates')
    const result = await deleteEstimate('est-uuid-1')

    const json = JSON.stringify(result)
    const parsed = JSON.parse(json)
    expect(parsed.id).toBe('999')
    expect(typeof parsed.id).toBe('string')
  })

  it('returns null when no active estimate is found', async () => {
    mockEstimateFindFirst.mockResolvedValue(null)

    const { deleteEstimate } = await import('../../../server/utils/estimates')
    const result = await deleteEstimate('nonexistent-uuid')

    expect(result).toBeNull()
    expect(mockEstimateUpdate).not.toHaveBeenCalled()
  })

  it('calls prisma.estimate.update to soft-delete the estimate', async () => {
    mockEstimateFindFirst.mockResolvedValue(makePrismaEstimateRow())
    mockEstimateUpdate.mockResolvedValue(undefined)

    const { deleteEstimate } = await import('../../../server/utils/estimates')
    await deleteEstimate('est-uuid-1')

    expect(mockEstimateUpdate).toHaveBeenCalledWith({
      where: { uuid: 'est-uuid-1' },
      data: { is_active: false },
    })
  })

  it('maps numeric fields (Decimal) correctly via mapEstimateRow', async () => {
    mockEstimateFindFirst.mockResolvedValue(makePrismaEstimateRow())
    mockEstimateUpdate.mockResolvedValue(undefined)

    const { deleteEstimate } = await import('../../../server/utils/estimates')
    const result = await deleteEstimate('est-uuid-1')

    expect(typeof result!.total_amount).toBe('number')
    expect(typeof result!.final_amount).toBe('number')
  })
})

describe('createEstimate – sequence coercion fix', () => {
  const lineItemWithStringSequence = {
    cost_code_uuid: 'cc-uuid-1',
    cost_code_number: '01-100',
    cost_code_name: 'Concrete',
    estimation_type: 'manual',
    labor_amount: 0,
    material_amount: 500,
    total_amount: 500,
    material_items: [
      {
        name: 'Steel Beam',
        sequence: 'Y',          // alphanumeric spec code – the bug
        unit_price: 50,
        quantity: 10,
        item_uuid: 'item-1',
        item_type_uuid: 'it-1',
      },
      {
        name: 'Bolt Pack',
        sequence: 'SB-001',     // another non-numeric string
        unit_price: 5,
        quantity: 20,
        item_uuid: 'item-2',
        item_type_uuid: 'it-1',
      },
    ],
  }

  const validInput = {
    corporation_uuid: 'corp-1',
    project_uuid: 'proj-1',
    estimate_date: '2026-05-01',
    total_amount: 500,
    final_amount: 500,
    line_items: [lineItemWithStringSequence],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    stubNormalizedChildren()

    // generateEstimateNumber → findMany for recent estimates
    mockEstimateFindMany.mockResolvedValue([])

    // estimate_number conflict check → findFirst returns null (no conflict)
    const created = makePrismaEstimateRow({ uuid: 'new-est-uuid' })
    mockEstimateFindFirst
      .mockResolvedValueOnce(null)    // conflict check
      .mockResolvedValueOnce(created) // getEstimate → findFirst

    // create estimate row
    mockEstimateCreate.mockResolvedValue(makeCreatedEstimate())

    // createMany / findMany for line items
    mockLineItemCreateMany.mockResolvedValue({ count: 1 })
    mockLineItemFindMany.mockResolvedValue([
      { uuid: 'li-uuid-1', cost_code_uuid: 'cc-uuid-1' },
    ])

    // createMany for material items
    mockMaterialItemCreateMany.mockResolvedValue({ count: 2 })

    // getEstimate dependencies
    mockProjectFindFirst.mockResolvedValue(null)
    mockMaterialItemFindMany.mockResolvedValue([])
    mockLwLaborFindMany.mockResolvedValue([])
    mockLwMaterialFindMany.mockResolvedValue([])
  })

  it('converts non-numeric string sequence to idx+1 fallback integer', async () => {
    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate(validInput)

    const callArg = mockMaterialItemCreateMany.mock.calls[0][0]
    const rows: any[] = callArg.data

    expect(rows).toHaveLength(2)
    // "Y" → parseInt("Y") = NaN → falls back to idx+1 = 1
    expect(rows[0].sequence).toBe(1)
    // "SB-001" → parseInt("SB-001") = NaN → falls back to idx+1 = 2
    expect(rows[1].sequence).toBe(2)
  })

  it('sequence values passed to DB are always integers', async () => {
    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate(validInput)

    const callArg = mockMaterialItemCreateMany.mock.calls[0][0]
    const rows: any[] = callArg.data

    rows.forEach((row: any) => {
      expect(typeof row.sequence).toBe('number')
      expect(Number.isInteger(row.sequence)).toBe(true)
    })
  })

  it('preserves numeric string sequence (e.g. "3") by parsing it', async () => {
    const inputWithNumericStringSequence = {
      ...validInput,
      line_items: [{
        ...lineItemWithStringSequence,
        material_items: [{
          name: 'Widget',
          sequence: '3',    // numeric string – should become 3
          unit_price: 10,
          quantity: 5,
          item_uuid: 'item-3',
        }],
      }],
    }

    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate(inputWithNumericStringSequence)

    const rows: any[] = mockMaterialItemCreateMany.mock.calls[0][0].data
    expect(rows[0].sequence).toBe(3)
  })

  it('preserves plain number sequence unchanged', async () => {
    const inputWithNumberSequence = {
      ...validInput,
      line_items: [{
        ...lineItemWithStringSequence,
        material_items: [{
          name: 'Beam',
          sequence: 7,    // already a number
          unit_price: 20,
          quantity: 2,
          item_uuid: 'item-4',
        }],
      }],
    }

    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate(inputWithNumberSequence)

    const rows: any[] = mockMaterialItemCreateMany.mock.calls[0][0].data
    expect(rows[0].sequence).toBe(7)
  })

  it('handles float sequence by rounding to nearest integer', async () => {
    const inputWithFloatSequence = {
      ...validInput,
      line_items: [{
        ...lineItemWithStringSequence,
        material_items: [{
          name: 'Panel',
          sequence: 2.7,  // float → should round to 3
          unit_price: 15,
          quantity: 4,
          item_uuid: 'item-5',
        }],
      }],
    }

    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate(inputWithFloatSequence)

    const rows: any[] = mockMaterialItemCreateMany.mock.calls[0][0].data
    expect(rows[0].sequence).toBe(3)
  })

  it('handles missing/null/undefined sequence by using idx+1', async () => {
    const inputNoSequence = {
      ...validInput,
      line_items: [{
        ...lineItemWithStringSequence,
        material_items: [
          { name: 'A', unit_price: 10, quantity: 1, item_uuid: 'i-a' },
          { name: 'B', sequence: null, unit_price: 10, quantity: 1, item_uuid: 'i-b' },
          { name: 'C', sequence: undefined, unit_price: 10, quantity: 1, item_uuid: 'i-c' },
        ],
      }],
    }

    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate(inputNoSequence)

    const rows: any[] = mockMaterialItemCreateMany.mock.calls[0][0].data
    expect(rows[0].sequence).toBe(1)  // idx 0 → 1
    expect(rows[1].sequence).toBe(2)  // idx 1 → 2
    expect(rows[2].sequence).toBe(3)  // idx 2 → 3
  })
})

describe('location-wise sequence coercion fix', () => {
  const lwLaborItem = {
    cost_code_uuid: 'cc-uuid-lw',
    estimation_type: 'location-wise',
    labor_amount: 0,
    total_amount: 200,
    location_wise_labor: [
      { location_uuid: 'loc-1', amount: 100, sequence: 'FIRST' },   // string
      { location_uuid: 'loc-2', amount: 100, sequence: 2 },          // number
      { location_uuid: 'loc-3', amount: 0 },                         // missing
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    stubNormalizedChildren()

    // generateEstimateNumber → findMany
    mockEstimateFindMany.mockResolvedValue([])

    // conflict check then getEstimate
    const row = makePrismaEstimateRow({ uuid: 'lw-est-uuid' })
    mockEstimateFindFirst
      .mockResolvedValueOnce(null)  // conflict check
      .mockResolvedValueOnce(row)   // getEstimate

    mockEstimateCreate.mockResolvedValue(makePrismaEstimateRow({ uuid: 'lw-est-uuid' }))
    mockLineItemCreateMany.mockResolvedValue({ count: 1 })
    mockLineItemFindMany.mockResolvedValue([
      { uuid: 'li-lw-1', cost_code_uuid: 'cc-uuid-lw' },
    ])
    mockLwLaborCreateMany.mockResolvedValue({ count: 3 })
    mockLwMaterialCreateMany.mockResolvedValue({ count: 0 })
    mockProjectFindFirst.mockResolvedValue(null)
    mockMaterialItemFindMany.mockResolvedValue([])
    mockLwLaborFindMany.mockResolvedValue([])
    mockLwMaterialFindMany.mockResolvedValue([])
  })

  it('converts string sequence in location_wise_labor to integer', async () => {
    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate({
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
      estimate_date: '2026-05-01',
      total_amount: 200,
      final_amount: 200,
      line_items: [lwLaborItem],
    })

    const rows: any[] = mockLwLaborCreateMany.mock.calls[0][0].data
    expect(rows).toHaveLength(3)
    // 'FIRST' → parseInt('FIRST') = NaN → idx+1 = 1
    expect(rows[0].sequence).toBe(1)
    expect(Number.isInteger(rows[0].sequence)).toBe(true)
    // 2 (number) → stays 2
    expect(rows[1].sequence).toBe(2)
    // missing → idx+1 = 3
    expect(rows[2].sequence).toBe(3)
  })

  it('all location_wise_labor sequence values are integers', async () => {
    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate({
      corporation_uuid: 'corp-1',
      project_uuid: 'proj-1',
      estimate_date: '2026-05-01',
      total_amount: 200,
      final_amount: 200,
      line_items: [lwLaborItem],
    })

    const rows: any[] = mockLwLaborCreateMany.mock.calls[0][0].data
    rows.forEach((row: any) => {
      expect(Number.isInteger(row.sequence)).toBe(true)
    })
  })
})
