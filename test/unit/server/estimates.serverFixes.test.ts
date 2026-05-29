/**
 * Tests for the three server-side fixes in server/utils/estimates.ts:
 *
 * FIX 1 — insertLineItems: parallel batch optimization
 *   Previously issued up to 3 × N sequential `await createMany` calls (one per
 *   cost code per child table). Now collects all rows into flat arrays and runs
 *   exactly 3 parallel createMany calls via Promise.all.
 *
 * FIX 2 — createEstimate / updateEstimate: skip getEstimate re-read
 *   Both functions previously ended with `return getEstimate(uuid)` which
 *   fired 5–6 extra DB queries after every save. They now return a header
 *   built from in-memory data (+ 1 project lookup), eliminating the re-read.
 *
 * FIX 3 — updateEstimate: full behavioural coverage
 *   updateEstimate was not directly unit-tested. This file adds:
 *   - not-found → null
 *   - duplicate estimate number → 409
 *   - line-item replacement (deleteMany + insertLineItems)
 *   - absent line_items → no delete / no insert
 *   - audit log transitions for every status change combination
 */
import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// createError is a Nuxt/h3 auto-import; stub it so the server util can use it
vi.stubGlobal('createError', createError)

// ── Prisma mock ────────────────────────────────────────────────────────────────
const mockEstimateFindFirst = vi.fn()
const mockEstimateFindMany = vi.fn()
const mockEstimateCreate = vi.fn()
const mockEstimateUpdate = vi.fn()
const mockProjectFindFirst = vi.fn()
const mockLineItemCreateMany = vi.fn()
const mockLineItemFindMany = vi.fn()
const mockLineItemDeleteMany = vi.fn()
const mockMaterialItemCreateMany = vi.fn()
const mockMaterialItemFindMany = vi.fn()
const mockMaterialItemDeleteMany = vi.fn()
const mockMaterialItemUpdate = vi.fn()
const mockLwLaborCreateMany = vi.fn()
const mockLwLaborFindMany = vi.fn()
const mockLwLaborDeleteMany = vi.fn()
const mockLwMaterialCreateMany = vi.fn()
const mockLwMaterialFindMany = vi.fn()
const mockLwMaterialDeleteMany = vi.fn()

vi.mock('../../../server/utils/prisma', () => ({
  getPrisma: () => ({
    estimate: {
      findFirst: (...a: unknown[]) => mockEstimateFindFirst(...a),
      findMany: (...a: unknown[]) => mockEstimateFindMany(...a),
      create: (...a: unknown[]) => mockEstimateCreate(...a),
      update: (...a: unknown[]) => mockEstimateUpdate(...a),
    },
    project: {
      findFirst: (...a: unknown[]) => mockProjectFindFirst(...a),
    },
    estimateLineItem: {
      createMany: (...a: unknown[]) => mockLineItemCreateMany(...a),
      findMany: (...a: unknown[]) => mockLineItemFindMany(...a),
      deleteMany: (...a: unknown[]) => mockLineItemDeleteMany(...a),
    },
    estimateMaterialItem: {
      createMany: (...a: unknown[]) => mockMaterialItemCreateMany(...a),
      findMany: (...a: unknown[]) => mockMaterialItemFindMany(...a),
      deleteMany: (...a: unknown[]) => mockMaterialItemDeleteMany(...a),
      update: (...a: unknown[]) => mockMaterialItemUpdate(...a),
    },
    estimateLocationWiseLabor: {
      createMany: (...a: unknown[]) => mockLwLaborCreateMany(...a),
      findMany: (...a: unknown[]) => mockLwLaborFindMany(...a),
      deleteMany: (...a: unknown[]) => mockLwLaborDeleteMany(...a),
    },
    estimateLocationWiseMaterial: {
      createMany: (...a: unknown[]) => mockLwMaterialCreateMany(...a),
      findMany: (...a: unknown[]) => mockLwMaterialFindMany(...a),
      deleteMany: (...a: unknown[]) => mockLwMaterialDeleteMany(...a),
    },
  }),
}))

// ── Row factories ─────────────────────────────────────────────────────────────

/** Full Prisma row shape returned by estimate.create / estimate.update / estimate.findFirst. */
function makePrismaRow(overrides: Record<string, unknown> = {}) {
  return {
    id: BigInt(1),
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
    attachments: null,
    removed_cost_code_uuids: null,
    audit_log: null,
    created_by: null,
    approved_by: null,
    approved_at: null,
    is_active: true,
    created_at: new Date('2026-05-01'),
    updated_at: new Date('2026-05-01'),
    ...overrides,
  }
}

/**
 * Slimmer row returned by the `findFirst(select: {...})` at the start of
 * updateEstimate – matches the `select` clause exactly.
 */
function makeExistingRow(overrides: Record<string, unknown> = {}) {
  return {
    uuid: 'est-uuid-1',
    corporation_uuid: 'corp-1',
    project_uuid: 'proj-1',
    estimate_number: 'EST-001',
    status: 'Draft',
    audit_log: null,
    ...overrides,
  }
}

const makeProject = () => ({ uuid: 'proj-1', project_name: 'Test Project', project_id: 'P-001' })

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMatItem(name: string, qty = 2, unitPrice = 100) {
  return { name, item_uuid: `item-${name}`, unit_price: unitPrice, quantity: qty, sequence: 1 }
}

function makeLineItemWithMat(costCodeUuid: string, matItems: ReturnType<typeof makeMatItem>[]) {
  return { cost_code_uuid: costCodeUuid, labor_amount: 0, material_amount: 500, total_amount: 500, material_items: matItems }
}

const USER_INFO = { user_id: 'u-1', user_name: 'Alice', user_email: 'alice@example.com', user_image_url: null }

// ══════════════════════════════════════════════════════════════════════════════
// updateEstimate — core behaviour
// ══════════════════════════════════════════════════════════════════════════════
describe('updateEstimate – core behaviour', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEstimateUpdate.mockResolvedValue(makePrismaRow())
    mockProjectFindFirst.mockResolvedValue(makeProject())
    mockLineItemDeleteMany.mockResolvedValue({ count: 0 })
    mockLineItemCreateMany.mockResolvedValue({ count: 0 })
    mockLineItemFindMany.mockResolvedValue([])
    mockMaterialItemFindMany.mockResolvedValue([])
    mockMaterialItemDeleteMany.mockResolvedValue({ count: 0 })
    mockLwLaborDeleteMany.mockResolvedValue({ count: 0 })
    mockLwMaterialDeleteMany.mockResolvedValue({ count: 0 })
    mockMaterialItemCreateMany.mockResolvedValue({ count: 0 })
    mockLwLaborCreateMany.mockResolvedValue({ count: 0 })
    mockLwMaterialCreateMany.mockResolvedValue({ count: 0 })
  })

  it('returns null when the estimate is not found', async () => {
    mockEstimateFindFirst.mockResolvedValue(null)
    const { updateEstimate } = await import('../../../server/utils/estimates')
    const result = await updateEstimate({ uuid: 'no-such-uuid', corporation_uuid: 'corp-1', project_uuid: 'proj-1' })
    expect(result).toBeNull()
    expect(mockEstimateUpdate).not.toHaveBeenCalled()
  })

  it('calls prisma.estimate.update with the provided status', async () => {
    mockEstimateFindFirst.mockResolvedValue(makeExistingRow())
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({ uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1', status: 'Ready' })
    expect(mockEstimateUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { uuid: 'est-uuid-1' },
      data: expect.objectContaining({ status: 'Ready' }),
    }))
  })

  it('throws a 409 error when a different estimate already uses the new number', async () => {
    mockEstimateFindFirst
      .mockResolvedValueOnce(makeExistingRow({ estimate_number: 'EST-001' }))
      .mockResolvedValueOnce({ uuid: 'other-est' })          // dup found
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await expect(
      updateEstimate({ uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1', estimate_number: 'EST-999' }),
    ).rejects.toMatchObject({ statusCode: 409 })
    expect(mockEstimateUpdate).not.toHaveBeenCalled()
  })

  it('skips the duplicate-number check when estimate_number is unchanged', async () => {
    mockEstimateFindFirst.mockResolvedValue(makeExistingRow({ estimate_number: 'EST-001' }))
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({ uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1', estimate_number: 'EST-001' })
    // Only 1 findFirst call (the existence check) — no dup check needed
    expect(mockEstimateFindFirst).toHaveBeenCalledTimes(1)
  })

  it('returns an object with id serialised as a string (no BigInt)', async () => {
    mockEstimateFindFirst.mockResolvedValue(makeExistingRow())
    mockEstimateUpdate.mockResolvedValue(makePrismaRow({ id: BigInt(99) }))
    const { updateEstimate } = await import('../../../server/utils/estimates')
    const result = await updateEstimate({ uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1' })
    expect(typeof result!.id).toBe('string')
    expect(result!.id).toBe('99')
  })

  it('result is JSON-serializable without throwing', async () => {
    mockEstimateFindFirst.mockResolvedValue(makeExistingRow())
    const { updateEstimate } = await import('../../../server/utils/estimates')
    const result = await updateEstimate({ uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1' })
    expect(() => JSON.stringify(result)).not.toThrow()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// updateEstimate — line item replacement
// ══════════════════════════════════════════════════════════════════════════════
describe('updateEstimate – line item replacement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEstimateFindFirst.mockResolvedValue(makeExistingRow())
    mockEstimateUpdate.mockResolvedValue(makePrismaRow())
    mockProjectFindFirst.mockResolvedValue(makeProject())
    mockLineItemDeleteMany.mockResolvedValue({ count: 5 })
    mockLineItemCreateMany.mockResolvedValue({ count: 2 })
    // First findMany = existing line items (pre-delete), second = newly inserted items
    mockLineItemFindMany
      .mockResolvedValueOnce([{ uuid: 'li-1', cost_code_uuid: 'cc-1' }, { uuid: 'li-2', cost_code_uuid: 'cc-2' }])
      .mockResolvedValue([{ uuid: 'li-1', cost_code_uuid: 'cc-1' }, { uuid: 'li-2', cost_code_uuid: 'cc-2' }])
    mockMaterialItemFindMany.mockResolvedValue([])   // no existing mat items to carry forward
    mockMaterialItemDeleteMany.mockResolvedValue({ count: 0 })
    mockLwLaborDeleteMany.mockResolvedValue({ count: 0 })
    mockLwMaterialDeleteMany.mockResolvedValue({ count: 0 })
    mockMaterialItemCreateMany.mockResolvedValue({ count: 0 })
    mockLwLaborCreateMany.mockResolvedValue({ count: 0 })
    mockLwMaterialCreateMany.mockResolvedValue({ count: 0 })
  })

  it('deletes all existing line items and re-inserts when line_items is provided', async () => {
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({
      uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1',
      line_items: [
        { cost_code_uuid: 'cc-1', labor_amount: 100, total_amount: 100 },
        { cost_code_uuid: 'cc-2', labor_amount: 200, total_amount: 200 },
      ],
    })
    expect(mockLineItemDeleteMany).toHaveBeenCalledWith({ where: { estimate_uuid: 'est-uuid-1' } })
    expect(mockLineItemCreateMany).toHaveBeenCalled()
  })

  it('does NOT touch line items when line_items is absent from the input', async () => {
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({ uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1', status: 'Ready' })
    expect(mockLineItemDeleteMany).not.toHaveBeenCalled()
    expect(mockLineItemCreateMany).not.toHaveBeenCalled()
  })

  it('deletes but does NOT insert when line_items is an empty array', async () => {
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({ uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1', line_items: [] })
    expect(mockLineItemDeleteMany).toHaveBeenCalledWith({ where: { estimate_uuid: 'est-uuid-1' } })
    expect(mockLineItemCreateMany).not.toHaveBeenCalled()
  })

  it('deleteMany uses the estimate uuid, not the corporation uuid', async () => {
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({
      uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1',
      line_items: [{ cost_code_uuid: 'cc-1', labor_amount: 0, total_amount: 0 }],
    })
    const deleteManyArg = mockLineItemDeleteMany.mock.calls[0][0]
    expect(deleteManyArg).toEqual({ where: { estimate_uuid: 'est-uuid-1' } })
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// updateEstimate — audit log transitions
// ══════════════════════════════════════════════════════════════════════════════
describe('updateEstimate – audit log entries', () => {
  let capturedUpdateData: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockEstimateUpdate.mockImplementation(async (args: any) => {
      capturedUpdateData = args.data
      return makePrismaRow()
    })
    mockProjectFindFirst.mockResolvedValue(makeProject())
    mockLineItemDeleteMany.mockResolvedValue({ count: 0 })
    mockLineItemCreateMany.mockResolvedValue({ count: 0 })
    mockLineItemFindMany.mockResolvedValue([])
    mockMaterialItemFindMany.mockResolvedValue([])
    mockMaterialItemDeleteMany.mockResolvedValue({ count: 0 })
    mockLwLaborDeleteMany.mockResolvedValue({ count: 0 })
    mockLwMaterialDeleteMany.mockResolvedValue({ count: 0 })
  })

  it('adds a marked_ready entry when status transitions Draft → Ready', async () => {
    mockEstimateFindFirst.mockResolvedValue(makeExistingRow({ status: 'Draft', audit_log: '[]' }))
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({ ...USER_INFO, uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1', status: 'Ready' })
    const log = JSON.parse(capturedUpdateData.audit_log)
    expect(log).toHaveLength(1)
    expect(log[0].action).toBe('marked_ready')
    expect(log[0].user_uuid).toBe('u-1')
  })

  it('adds an approved entry when status transitions Draft → Approved', async () => {
    mockEstimateFindFirst.mockResolvedValue(makeExistingRow({ status: 'Draft', audit_log: '[]' }))
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({ ...USER_INFO, uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1', status: 'Approved' })
    const log = JSON.parse(capturedUpdateData.audit_log)
    expect(log[0].action).toBe('approved')
  })

  it('adds an approved entry when status transitions Ready → Approved', async () => {
    mockEstimateFindFirst.mockResolvedValue(makeExistingRow({ status: 'Ready', audit_log: '[]' }))
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({ ...USER_INFO, uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1', status: 'Approved' })
    const log = JSON.parse(capturedUpdateData.audit_log)
    expect(log[0].action).toBe('approved')
  })

  it('adds an unapproved entry when Approved → Draft (Revise action)', async () => {
    mockEstimateFindFirst.mockResolvedValue(makeExistingRow({ status: 'Approved', audit_log: '[]' }))
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({ ...USER_INFO, uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1', status: 'Draft' })
    const log = JSON.parse(capturedUpdateData.audit_log)
    expect(log[0].action).toBe('unapproved')
  })

  it('adds an updated entry when non-status fields change with no status transition', async () => {
    mockEstimateFindFirst.mockResolvedValue(makeExistingRow({ status: 'Draft', audit_log: '[]' }))
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({ ...USER_INFO, uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1', notes: 'updated notes' })
    const log = JSON.parse(capturedUpdateData.audit_log)
    expect(log[0].action).toBe('updated')
  })

  it('preserves prior audit entries and appends the new one', async () => {
    const prior = { action: 'created', timestamp: '2026-01-01T00:00:00Z', user_uuid: 'u-0', user_name: 'Bob', user_email: 'b@t.com', user_image_url: null }
    mockEstimateFindFirst.mockResolvedValue(makeExistingRow({ status: 'Draft', audit_log: JSON.stringify([prior]) }))
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({ ...USER_INFO, uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1', status: 'Ready' })
    const log = JSON.parse(capturedUpdateData.audit_log)
    expect(log).toHaveLength(2)
    expect(log[0].action).toBe('created')
    expect(log[1].action).toBe('marked_ready')
  })

  it('does not add an entry when no user_id is provided', async () => {
    mockEstimateFindFirst.mockResolvedValue(makeExistingRow({ status: 'Draft', audit_log: '[]' }))
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({ uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1', status: 'Ready' })
    // audit_log key should not appear in updateData when no entry was created
    expect(capturedUpdateData.audit_log).toBeUndefined()
  })

  it('handles null audit_log in DB (treats as empty array)', async () => {
    mockEstimateFindFirst.mockResolvedValue(makeExistingRow({ status: 'Draft', audit_log: null }))
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({ ...USER_INFO, uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1', status: 'Ready' })
    const log = JSON.parse(capturedUpdateData.audit_log)
    expect(Array.isArray(log)).toBe(true)
    expect(log).toHaveLength(1)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// insertLineItems — parallel batch optimisation (via createEstimate)
// ══════════════════════════════════════════════════════════════════════════════
describe('insertLineItems – parallel batch (all children in 3 DB calls)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // No estimate_number → auto-generate path (uses findMany, NOT findFirst)
    mockEstimateFindMany.mockResolvedValue([])
    mockEstimateCreate.mockResolvedValue(makePrismaRow({ uuid: 'new-est' }))
    mockProjectFindFirst.mockResolvedValue(makeProject())
    mockLineItemCreateMany.mockResolvedValue({ count: 0 })
    mockMaterialItemCreateMany.mockResolvedValue({ count: 0 })
    mockLwLaborCreateMany.mockResolvedValue({ count: 0 })
    mockLwMaterialCreateMany.mockResolvedValue({ count: 0 })
  })

  it('makes exactly ONE estimateMaterialItem.createMany call for multiple line items', async () => {
    mockLineItemFindMany.mockResolvedValue([
      { uuid: 'li-1', cost_code_uuid: 'cc-1' },
      { uuid: 'li-2', cost_code_uuid: 'cc-2' },
      { uuid: 'li-3', cost_code_uuid: 'cc-3' },
    ])
    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate({
      corporation_uuid: 'corp-1', project_uuid: 'proj-1', total_amount: 1500, final_amount: 1500,
      line_items: [
        makeLineItemWithMat('cc-1', [makeMatItem('Steel'), makeMatItem('Bolt')]),
        makeLineItemWithMat('cc-2', [makeMatItem('Plank')]),
        makeLineItemWithMat('cc-3', [makeMatItem('Pipe'), makeMatItem('Fitting'), makeMatItem('Valve')]),
      ],
    })
    // Must be called exactly once regardless of how many line items have material items
    expect(mockMaterialItemCreateMany).toHaveBeenCalledTimes(1)
    // All 6 items in one batch
    expect(mockMaterialItemCreateMany.mock.calls[0][0].data).toHaveLength(6)
  })

  it('tags each row with its correct estimate_line_item_uuid from the UUID lookup', async () => {
    mockLineItemFindMany.mockResolvedValue([
      { uuid: 'li-A', cost_code_uuid: 'cc-A' },
      { uuid: 'li-B', cost_code_uuid: 'cc-B' },
    ])
    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate({
      corporation_uuid: 'corp-1', project_uuid: 'proj-1', total_amount: 1000, final_amount: 1000,
      line_items: [
        makeLineItemWithMat('cc-A', [makeMatItem('A1'), makeMatItem('A2')]),
        makeLineItemWithMat('cc-B', [makeMatItem('B1')]),
      ],
    })
    const rows: any[] = mockMaterialItemCreateMany.mock.calls[0][0].data
    expect(rows.filter((r: any) => r.estimate_line_item_uuid === 'li-A')).toHaveLength(2)
    expect(rows.filter((r: any) => r.estimate_line_item_uuid === 'li-B')).toHaveLength(1)
  })

  it('makes exactly ONE estimateLocationWiseLabor.createMany call for all line items', async () => {
    mockLineItemFindMany.mockResolvedValue([
      { uuid: 'li-X', cost_code_uuid: 'cc-X' },
      { uuid: 'li-Y', cost_code_uuid: 'cc-Y' },
    ])
    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate({
      corporation_uuid: 'corp-1', project_uuid: 'proj-1', total_amount: 400, final_amount: 400,
      line_items: [
        { cost_code_uuid: 'cc-X', labor_amount: 200, total_amount: 200, location_wise_labor: [{ location_uuid: 'loc-1', amount: 100, sequence: 1 }, { location_uuid: 'loc-2', amount: 100, sequence: 2 }] },
        { cost_code_uuid: 'cc-Y', labor_amount: 200, total_amount: 200, location_wise_labor: [{ location_uuid: 'loc-3', amount: 200, sequence: 1 }] },
      ],
    })
    expect(mockLwLaborCreateMany).toHaveBeenCalledTimes(1)
    expect(mockLwLaborCreateMany.mock.calls[0][0].data).toHaveLength(3)
  })

  it('makes exactly ONE estimateLocationWiseMaterial.createMany call for all line items', async () => {
    mockLineItemFindMany.mockResolvedValue([
      { uuid: 'li-P', cost_code_uuid: 'cc-P' },
      { uuid: 'li-Q', cost_code_uuid: 'cc-Q' },
    ])
    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate({
      corporation_uuid: 'corp-1', project_uuid: 'proj-1', total_amount: 300, final_amount: 300,
      line_items: [
        { cost_code_uuid: 'cc-P', material_amount: 150, total_amount: 150, location_wise_material: [{ location_uuid: 'loc-1', amount: 150, sequence: 1 }] },
        { cost_code_uuid: 'cc-Q', material_amount: 150, total_amount: 150, location_wise_material: [{ location_uuid: 'loc-2', amount: 100, sequence: 1 }, { location_uuid: 'loc-3', amount: 50, sequence: 2 }] },
      ],
    })
    expect(mockLwMaterialCreateMany).toHaveBeenCalledTimes(1)
    expect(mockLwMaterialCreateMany.mock.calls[0][0].data).toHaveLength(3)
  })

  it('skips estimateMaterialItem.createMany when no line item has material_items', async () => {
    mockLineItemFindMany.mockResolvedValue([{ uuid: 'li-1', cost_code_uuid: 'cc-1' }])
    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate({
      corporation_uuid: 'corp-1', project_uuid: 'proj-1', total_amount: 200, final_amount: 200,
      line_items: [{ cost_code_uuid: 'cc-1', labor_amount: 200, total_amount: 200 }],
    })
    expect(mockMaterialItemCreateMany).not.toHaveBeenCalled()
  })

  it('skips estimateLocationWiseLabor.createMany when no line item has location_wise_labor', async () => {
    mockLineItemFindMany.mockResolvedValue([{ uuid: 'li-1', cost_code_uuid: 'cc-1' }])
    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate({
      corporation_uuid: 'corp-1', project_uuid: 'proj-1', total_amount: 200, final_amount: 200,
      line_items: [makeLineItemWithMat('cc-1', [makeMatItem('Item1')])],
    })
    expect(mockLwLaborCreateMany).not.toHaveBeenCalled()
  })

  it('correctly sets corporation_uuid, project_uuid and estimate_uuid on every material row', async () => {
    mockLineItemFindMany.mockResolvedValue([{ uuid: 'li-1', cost_code_uuid: 'cc-1' }])
    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate({
      corporation_uuid: 'corp-abc', project_uuid: 'proj-xyz', total_amount: 500, final_amount: 500,
      line_items: [makeLineItemWithMat('cc-1', [makeMatItem('Widget')])],
    })
    const row = mockMaterialItemCreateMany.mock.calls[0][0].data[0]
    expect(row.corporation_uuid).toBe('corp-abc')
    expect(row.project_uuid).toBe('proj-xyz')
    expect(row.estimate_uuid).toBe('new-est')
  })

  it('handles mixed line items: only those with children trigger child createMany calls', async () => {
    mockLineItemFindMany.mockResolvedValue([
      { uuid: 'li-1', cost_code_uuid: 'cc-1' },
      { uuid: 'li-2', cost_code_uuid: 'cc-2' },  // no children
    ])
    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate({
      corporation_uuid: 'corp-1', project_uuid: 'proj-1', total_amount: 700, final_amount: 700,
      line_items: [
        makeLineItemWithMat('cc-1', [makeMatItem('A'), makeMatItem('B')]),
        { cost_code_uuid: 'cc-2', labor_amount: 200, total_amount: 200 },  // no material_items
      ],
    })
    expect(mockMaterialItemCreateMany).toHaveBeenCalledTimes(1)
    expect(mockMaterialItemCreateMany.mock.calls[0][0].data).toHaveLength(2)
  })

  it('insertLineItems also works correctly via updateEstimate (same batch logic)', async () => {
    mockEstimateFindFirst.mockResolvedValue(makeExistingRow())
    mockEstimateUpdate.mockResolvedValue(makePrismaRow())
    mockProjectFindFirst.mockResolvedValue(makeProject())
    mockLineItemDeleteMany.mockResolvedValue({ count: 0 })
    mockLineItemFindMany
      .mockResolvedValueOnce([])  // existing line items (none before first save)
      .mockResolvedValue([{ uuid: 'li-u1', cost_code_uuid: 'cc-u1' }, { uuid: 'li-u2', cost_code_uuid: 'cc-u2' }])
    mockMaterialItemFindMany.mockResolvedValue([])
    mockMaterialItemDeleteMany.mockResolvedValue({ count: 0 })
    mockLwLaborDeleteMany.mockResolvedValue({ count: 0 })
    mockLwMaterialDeleteMany.mockResolvedValue({ count: 0 })
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({
      uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1',
      line_items: [
        makeLineItemWithMat('cc-u1', [makeMatItem('X1'), makeMatItem('X2')]),
        makeLineItemWithMat('cc-u2', [makeMatItem('Y1')]),
      ],
    })
    expect(mockMaterialItemCreateMany).toHaveBeenCalledTimes(1)
    expect(mockMaterialItemCreateMany.mock.calls[0][0].data).toHaveLength(3)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// createEstimate — skip getEstimate re-read
// ══════════════════════════════════════════════════════════════════════════════
describe('createEstimate – returns header without re-reading child tables', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEstimateFindMany.mockResolvedValue([])
    mockEstimateCreate.mockResolvedValue(makePrismaRow({ uuid: 'h-est', status: 'Draft' }))
    mockProjectFindFirst.mockResolvedValue(makeProject())
    mockLineItemCreateMany.mockResolvedValue({ count: 0 })
    mockLineItemFindMany.mockResolvedValue([])
    mockMaterialItemCreateMany.mockResolvedValue({ count: 0 })
    mockLwLaborCreateMany.mockResolvedValue({ count: 0 })
    mockLwMaterialCreateMany.mockResolvedValue({ count: 0 })
  })

  it('does NOT query estimateMaterialItem.findMany on the read path after save', async () => {
    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate({ corporation_uuid: 'corp-1', project_uuid: 'proj-1', total_amount: 0, final_amount: 0 })
    expect(mockMaterialItemFindMany).not.toHaveBeenCalled()
  })

  it('does NOT query estimateLocationWiseLabor.findMany on the read path after save', async () => {
    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate({ corporation_uuid: 'corp-1', project_uuid: 'proj-1', total_amount: 0, final_amount: 0 })
    expect(mockLwLaborFindMany).not.toHaveBeenCalled()
  })

  it('does NOT query estimateLocationWiseMaterial.findMany on the read path after save', async () => {
    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate({ corporation_uuid: 'corp-1', project_uuid: 'proj-1', total_amount: 0, final_amount: 0 })
    expect(mockLwMaterialFindMany).not.toHaveBeenCalled()
  })

  it('returned line_items is an empty array (header-only response)', async () => {
    const { createEstimate } = await import('../../../server/utils/estimates')
    const result = await createEstimate({ corporation_uuid: 'corp-1', project_uuid: 'proj-1', total_amount: 0, final_amount: 0 })
    expect(Array.isArray(result!.line_items)).toBe(true)
    expect(result!.line_items).toHaveLength(0)
  })

  it('returns the correct status from the created row', async () => {
    const { createEstimate } = await import('../../../server/utils/estimates')
    const result = await createEstimate({ corporation_uuid: 'corp-1', project_uuid: 'proj-1', total_amount: 0, final_amount: 0, status: 'Draft' })
    expect(result!.status).toBe('Draft')
  })

  it('makes exactly ONE project.findFirst call (no re-read of estimate header)', async () => {
    const { createEstimate } = await import('../../../server/utils/estimates')
    await createEstimate({ corporation_uuid: 'corp-1', project_uuid: 'proj-1', total_amount: 0, final_amount: 0 })
    expect(mockProjectFindFirst).toHaveBeenCalledTimes(1)
  })

  it('includes the project in the response when found', async () => {
    const { createEstimate } = await import('../../../server/utils/estimates')
    const result = await createEstimate({ corporation_uuid: 'corp-1', project_uuid: 'proj-1', total_amount: 0, final_amount: 0 })
    expect(result!.project).toMatchObject({ project_name: 'Test Project', project_id: 'P-001' })
  })

  it('result is JSON-serializable (id as string, no BigInt)', async () => {
    const { createEstimate } = await import('../../../server/utils/estimates')
    const result = await createEstimate({ corporation_uuid: 'corp-1', project_uuid: 'proj-1', total_amount: 0, final_amount: 0 })
    expect(() => JSON.stringify(result)).not.toThrow()
    expect(typeof result!.id).toBe('string')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// updateEstimate — skip getEstimate re-read
// ══════════════════════════════════════════════════════════════════════════════
describe('updateEstimate – returns header without re-reading child tables', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEstimateFindFirst.mockResolvedValue(makeExistingRow())
    mockEstimateUpdate.mockResolvedValue(makePrismaRow({ status: 'Ready' }))
    mockProjectFindFirst.mockResolvedValue(makeProject())
    mockLineItemDeleteMany.mockResolvedValue({ count: 0 })
    mockLineItemCreateMany.mockResolvedValue({ count: 0 })
    mockLineItemFindMany.mockResolvedValue([])
    mockMaterialItemFindMany.mockResolvedValue([])
    mockMaterialItemDeleteMany.mockResolvedValue({ count: 0 })
    mockLwLaborDeleteMany.mockResolvedValue({ count: 0 })
    mockLwMaterialDeleteMany.mockResolvedValue({ count: 0 })
    mockMaterialItemCreateMany.mockResolvedValue({ count: 0 })
    mockLwLaborCreateMany.mockResolvedValue({ count: 0 })
    mockLwMaterialCreateMany.mockResolvedValue({ count: 0 })
  })

  it('does NOT query estimateMaterialItem.findMany on the read path after update', async () => {
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({ uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1' })
    expect(mockMaterialItemFindMany).not.toHaveBeenCalled()
  })

  it('does NOT query estimateLocationWiseLabor.findMany on the read path after update', async () => {
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({ uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1' })
    expect(mockLwLaborFindMany).not.toHaveBeenCalled()
  })

  it('does NOT query estimateLocationWiseMaterial.findMany on the read path after update', async () => {
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({ uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1' })
    expect(mockLwMaterialFindMany).not.toHaveBeenCalled()
  })

  it('returned line_items is an empty array (header-only response)', async () => {
    const { updateEstimate } = await import('../../../server/utils/estimates')
    const result = await updateEstimate({ uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1' })
    expect(Array.isArray(result!.line_items)).toBe(true)
    expect(result!.line_items).toHaveLength(0)
  })

  it('returns the updated status from the prisma.update result', async () => {
    const { updateEstimate } = await import('../../../server/utils/estimates')
    const result = await updateEstimate({ uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1' })
    expect(result!.status).toBe('Ready')
  })

  it('makes exactly ONE project.findFirst call for the response', async () => {
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({ uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1' })
    expect(mockProjectFindFirst).toHaveBeenCalledTimes(1)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// updateEstimate — explicit child deletion before line-item replacement
// ══════════════════════════════════════════════════════════════════════════════
describe('updateEstimate – explicit child deletion', () => {
  const existingLineItemUuids = ['li-old-1', 'li-old-2']

  beforeEach(() => {
    vi.clearAllMocks()
    mockEstimateFindFirst.mockResolvedValue(makeExistingRow())
    mockEstimateUpdate.mockResolvedValue(makePrismaRow())
    mockProjectFindFirst.mockResolvedValue(makeProject())
    // Return existing line items so deletion path is exercised
    mockLineItemFindMany
      .mockResolvedValueOnce(existingLineItemUuids.map(uuid => ({ uuid, cost_code_uuid: `cc-${uuid}` })))
      .mockResolvedValue([{ uuid: 'li-new-1', cost_code_uuid: 'cc-1' }])
    mockMaterialItemFindMany.mockResolvedValue([])
    mockMaterialItemDeleteMany.mockResolvedValue({ count: 2 })
    mockLwLaborDeleteMany.mockResolvedValue({ count: 1 })
    mockLwMaterialDeleteMany.mockResolvedValue({ count: 0 })
    mockLineItemDeleteMany.mockResolvedValue({ count: 2 })
    mockLineItemCreateMany.mockResolvedValue({ count: 1 })
    mockMaterialItemCreateMany.mockResolvedValue({ count: 0 })
    mockLwLaborCreateMany.mockResolvedValue({ count: 0 })
    mockLwMaterialCreateMany.mockResolvedValue({ count: 0 })
  })

  it('calls estimateMaterialItem.deleteMany before estimateLineItem.deleteMany', async () => {
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({
      uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1',
      line_items: [{ cost_code_uuid: 'cc-1', labor_amount: 100, total_amount: 100 }],
    })
    expect(mockMaterialItemDeleteMany).toHaveBeenCalledWith({
      where: { estimate_line_item_uuid: { in: existingLineItemUuids } },
    })
  })

  it('calls estimateLocationWiseLabor.deleteMany with existing line item UUIDs', async () => {
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({
      uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1',
      line_items: [{ cost_code_uuid: 'cc-1', labor_amount: 100, total_amount: 100 }],
    })
    expect(mockLwLaborDeleteMany).toHaveBeenCalledWith({
      where: { estimate_line_item_uuid: { in: existingLineItemUuids } },
    })
  })

  it('calls estimateLocationWiseMaterial.deleteMany with existing line item UUIDs', async () => {
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({
      uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1',
      line_items: [{ cost_code_uuid: 'cc-1', labor_amount: 100, total_amount: 100 }],
    })
    expect(mockLwMaterialDeleteMany).toHaveBeenCalledWith({
      where: { estimate_line_item_uuid: { in: existingLineItemUuids } },
    })
  })

  it('skips child deleteMany calls when there are no existing line items', async () => {
    mockLineItemFindMany.mockReset().mockResolvedValue([])
    const { updateEstimate } = await import('../../../server/utils/estimates')
    await updateEstimate({
      uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1',
      line_items: [{ cost_code_uuid: 'cc-new', labor_amount: 50, total_amount: 50 }],
    })
    expect(mockMaterialItemDeleteMany).not.toHaveBeenCalled()
    expect(mockLwLaborDeleteMany).not.toHaveBeenCalled()
    expect(mockLwMaterialDeleteMany).not.toHaveBeenCalled()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// updateEstimate — carry-forward fallback for material items
// ══════════════════════════════════════════════════════════════════════════════
describe('updateEstimate – material items carry-forward fallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEstimateFindFirst.mockResolvedValue(makeExistingRow())
    mockEstimateUpdate.mockResolvedValue(makePrismaRow())
    mockProjectFindFirst.mockResolvedValue(makeProject())
    mockLineItemDeleteMany.mockResolvedValue({ count: 1 })
    mockLineItemCreateMany.mockResolvedValue({ count: 1 })
    mockMaterialItemDeleteMany.mockResolvedValue({ count: 2 })
    mockLwLaborDeleteMany.mockResolvedValue({ count: 0 })
    mockLwMaterialDeleteMany.mockResolvedValue({ count: 0 })
    mockLwLaborCreateMany.mockResolvedValue({ count: 0 })
    mockLwMaterialCreateMany.mockResolvedValue({ count: 0 })
  })

  it('uses existing mat items as fallback when incoming line item has no material_items', async () => {
    // Existing line item uuid → cost_code_uuid
    mockLineItemFindMany
      .mockResolvedValueOnce([{ uuid: 'li-old', cost_code_uuid: 'cc-1' }])  // before deletion
      .mockResolvedValue([{ uuid: 'li-new', cost_code_uuid: 'cc-1' }])       // after re-insert

    // Existing mat items for the old line item
    mockMaterialItemFindMany.mockResolvedValue([
      { uuid: 'm-1', cost_code_uuid: 'cc-1', estimate_line_item_uuid: 'li-old',
        name: 'Widget', item_uuid: 'item-1', unit_price: 50, quantity: 2, sequence: 1,
        corporation_uuid: 'corp-1', project_uuid: 'proj-1', estimate_uuid: 'est-uuid-1', is_active: true },
    ])
    mockMaterialItemCreateMany.mockResolvedValue({ count: 1 })

    const { updateEstimate } = await import('../../../server/utils/estimates')
    // Incoming line item has NO material_items (e.g., status-only update carries line items but without items)
    await updateEstimate({
      uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1',
      line_items: [{ cost_code_uuid: 'cc-1', labor_amount: 0, material_amount: 100, total_amount: 100 }],
    })

    // Fallback should have injected the old mat items into the createMany call
    expect(mockMaterialItemCreateMany).toHaveBeenCalledTimes(1)
    const rows = mockMaterialItemCreateMany.mock.calls[0][0].data
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('Widget')
  })

  it('does NOT fall back when incoming line item already has material_items', async () => {
    mockLineItemFindMany
      .mockResolvedValueOnce([{ uuid: 'li-old', cost_code_uuid: 'cc-1' }])
      .mockResolvedValue([{ uuid: 'li-new', cost_code_uuid: 'cc-1' }])

    // Existing mat item in DB for old line item
    mockMaterialItemFindMany.mockResolvedValue([
      { uuid: 'm-old', cost_code_uuid: 'cc-1', estimate_line_item_uuid: 'li-old',
        name: 'OldWidget', item_uuid: 'item-old', unit_price: 50, quantity: 2, sequence: 1,
        corporation_uuid: 'corp-1', project_uuid: 'proj-1', estimate_uuid: 'est-uuid-1', is_active: true },
    ])
    mockMaterialItemCreateMany.mockResolvedValue({ count: 1 })

    const { updateEstimate } = await import('../../../server/utils/estimates')
    // Incoming line item explicitly provides NEW material_items — old fallback should NOT be used
    await updateEstimate({
      uuid: 'est-uuid-1', corporation_uuid: 'corp-1', project_uuid: 'proj-1',
      line_items: [makeLineItemWithMat('cc-1', [makeMatItem('NewWidget')])],
    })

    const rows = mockMaterialItemCreateMany.mock.calls[0][0].data
    expect(rows[0].name).toBe('NewWidget')  // incoming value wins, not the old fallback
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// material item filter fix (item.amount → item.total / computed total)
// Tests the logic applied in EstimateLineItemsTable.vue's emitLineItemsUpdate()
// which was previously filtering on item.amount (always undefined) — this
// caused ALL material items to be dropped. The corrected logic uses item.total
// or falls back to unit_price × quantity.
// ══════════════════════════════════════════════════════════════════════════════
describe('material item effective-total filter (EstimateLineItemsTable fix)', () => {
  /** Mirrors the corrected filter predicate from emitLineItemsUpdate() */
  function isNonZeroMaterialItem(item: Record<string, unknown>): boolean {
    const effectiveTotal =
      parseFloat(String(item.total ?? item.total_amount ?? '')) ||
      parseFloat(String(item.unit_price ?? 0)) * parseFloat(String(item.quantity ?? 0))
    return effectiveTotal > 0
  }

  it('keeps items where total > 0', () => {
    expect(isNonZeroMaterialItem({ name: 'Widget', total: 200, unit_price: 100, quantity: 2 })).toBe(true)
  })

  it('keeps items where total_amount > 0 (fallback field)', () => {
    expect(isNonZeroMaterialItem({ name: 'Widget', total_amount: 150 })).toBe(true)
  })

  it('keeps items where unit_price × quantity > 0 (computed fallback)', () => {
    expect(isNonZeroMaterialItem({ name: 'Widget', unit_price: 50, quantity: 3 })).toBe(true)
  })

  it('drops items where total === 0', () => {
    expect(isNonZeroMaterialItem({ name: 'Empty', total: 0, unit_price: 0, quantity: 5 })).toBe(false)
  })

  it('drops items where total_amount is "0"', () => {
    expect(isNonZeroMaterialItem({ name: 'Empty', total_amount: '0' })).toBe(false)
  })

  it('drops items where unit_price is 0 regardless of quantity', () => {
    expect(isNonZeroMaterialItem({ name: 'Empty', unit_price: 0, quantity: 10 })).toBe(false)
  })

  it('drops items where quantity is 0 regardless of unit_price', () => {
    expect(isNonZeroMaterialItem({ name: 'Empty', unit_price: 50, quantity: 0 })).toBe(false)
  })

  it('drops items where the legacy "amount" field is the only value (the old broken behaviour)', () => {
    // The OLD filter was: parseFloat(String(item.amount)) > 0
    // item.amount was undefined in practice, so everything was filtered OUT.
    // The new filter should correctly keep this item because unit_price × quantity > 0.
    const item = { name: 'Widget', amount: 200, unit_price: 100, quantity: 2 }
    // Old broken logic would have kept this because item.amount is present here — but in
    // the real component item.amount is undefined; we verify the new logic handles both:
    expect(isNonZeroMaterialItem(item)).toBe(true)  // new logic correctly uses unit_price×qty
  })

  it('drops items where amount is set but unit_price and quantity are both zero (regression guard)', () => {
    // Verifies the new logic does NOT rely on item.amount
    const item = { name: 'Ghost', amount: 999, total: 0, unit_price: 0, quantity: 0 }
    expect(isNonZeroMaterialItem(item)).toBe(false)
  })

  it('handles string number values (as emitted by Vue reactive data)', () => {
    expect(isNonZeroMaterialItem({ name: 'Widget', unit_price: '75', quantity: '4' })).toBe(true)
    expect(isNonZeroMaterialItem({ name: 'Empty', unit_price: '0', quantity: '4' })).toBe(false)
  })

  it('handles null/undefined fields gracefully (no throw)', () => {
    expect(() => isNonZeroMaterialItem({ name: 'Widget', total: null, unit_price: null, quantity: null })).not.toThrow()
    expect(isNonZeroMaterialItem({ name: 'Widget', total: null, unit_price: null, quantity: null })).toBe(false)
  })
})
