import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mock h3 globals ────────────────────────────────────────────────────────────
const mockGetQuery = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)
vi.stubGlobal('getQuery', mockGetQuery)

// ── Mock Prisma ────────────────────────────────────────────────────────────────
const mockConfigFindMany = vi.fn()
const mockItemFindMany = vi.fn()

vi.mock('../../../server/utils/prisma', () => ({
  getPrisma: () => ({
    costCodeConfiguration: { findMany: (...a: unknown[]) => mockConfigFindMany(...a) },
    costCodePreferredItem: { findMany: (...a: unknown[]) => mockItemFindMany(...a) },
  }),
}))

// ── Fixtures ───────────────────────────────────────────────────────────────────
const makeConfig = (overrides = {}) => ({
  id: BigInt(1),
  uuid: 'cc-uuid-1',
  corporation_uuid: 'corp-1',
  division_uuid: 'div-1',
  cost_code_number: '01-100',
  cost_code_name: 'Concrete',
  parent_cost_code_uuid: null,
  order_number: 1,
  gl_account_uuid: null,
  effective_from: null,
  description: null,
  update_previous_transactions: false,
  is_active: true,
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
  ...overrides,
})

const makePreferredItem = (overrides = {}) => ({
  id: BigInt(1),
  uuid: 'pi-uuid-1',
  corporation_uuid: 'corp-1',
  cost_code_configuration_uuid: 'cc-uuid-1',
  item_type_uuid: 'it-1',
  project_uuid: null,
  item_name: 'Steel Beam',
  item_sequence: 'SB-001',
  model_number: null,
  unit_price: 49.99,
  uom_uuid: 'uom-1',
  description: null,
  status: 'Active',
  is_active: true,
  location_uuid: null,
  preferred_vendor_uuid: null,
  ...overrides,
})

describe('GET /api/cost-code-configurations/project-filtered', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetQuery.mockReturnValue({ corporation_uuid: 'corp-1', project_uuid: 'proj-1' })
    mockConfigFindMany.mockResolvedValue([makeConfig()])
    mockItemFindMany.mockResolvedValue([makePreferredItem()])
  })

  it('returns configurations with preferred items', async () => {
    const { default: handler } = await import('../../../server/api/cost-code-configurations/project-filtered.get')

    const result = await handler({}) as any
    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(result.data[0].uuid).toBe('cc-uuid-1')
    expect(result.data[0].preferred_items).toHaveLength(1)
  })

  it('converts BigInt id to Number', async () => {
    const { default: handler } = await import('../../../server/api/cost-code-configurations/project-filtered.get')

    const result = await handler({}) as any
    expect(typeof result.data[0].id).toBe('number')
    expect(result.data[0].id).toBe(1)
  })

  it('converts BigInt id in preferred_items to Number', async () => {
    const { default: handler } = await import('../../../server/api/cost-code-configurations/project-filtered.get')

    const result = await handler({}) as any
    const item = result.data[0].preferred_items[0]
    expect(typeof item.id).toBe('number')
    expect(item.id).toBe(1)
  })

  it('maps preferred item fields correctly', async () => {
    const { default: handler } = await import('../../../server/api/cost-code-configurations/project-filtered.get')

    const result = await handler({}) as any
    const item = result.data[0].preferred_items[0]
    expect(item.item_name).toBe('Steel Beam')
    expect(item.unit).toBe('uom-1')
    expect(item.unit_uuid).toBe('uom-1')
    expect(item.unit_price).toBe(49.99)
    expect(item.status).toBe('Active')
  })

  it('returns empty preferred_items when none match the configuration', async () => {
    mockItemFindMany.mockResolvedValue([makePreferredItem({ cost_code_configuration_uuid: 'other-uuid' })])
    const { default: handler } = await import('../../../server/api/cost-code-configurations/project-filtered.get')

    const result = await handler({}) as any
    expect(result.data[0].preferred_items).toHaveLength(0)
  })

  it('returns empty data when no configurations found', async () => {
    mockConfigFindMany.mockResolvedValue([])
    const { default: handler } = await import('../../../server/api/cost-code-configurations/project-filtered.get')

    const result = await handler({}) as any
    expect(result.data).toHaveLength(0)
  })

  it('does not call item findMany when there are no configs', async () => {
    mockConfigFindMany.mockResolvedValue([])
    const { default: handler } = await import('../../../server/api/cost-code-configurations/project-filtered.get')

    await handler({})
    expect(mockItemFindMany).not.toHaveBeenCalled()
  })

  it('filters preferred items for both null and matching project_uuid', async () => {
    const { default: handler } = await import('../../../server/api/cost-code-configurations/project-filtered.get')

    // Verify the query used for preferred items includes the OR clause
    await handler({})
    expect(mockItemFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { project_uuid: null },
            { project_uuid: 'proj-1' },
          ]),
        }),
      }),
    )
  })

  it('throws 400 when corporation_uuid is missing', async () => {
    mockGetQuery.mockReturnValue({ project_uuid: 'proj-1' })
    const { default: handler } = await import('../../../server/api/cost-code-configurations/project-filtered.get')

    await expect(handler({})).rejects.toMatchObject({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
  })

  it('throws 400 when project_uuid is missing', async () => {
    mockGetQuery.mockReturnValue({ corporation_uuid: 'corp-1' })
    const { default: handler } = await import('../../../server/api/cost-code-configurations/project-filtered.get')

    await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('throws 500 on DB error', async () => {
    mockConfigFindMany.mockRejectedValue(new Error('Connection refused'))
    const { default: handler } = await import('../../../server/api/cost-code-configurations/project-filtered.get')

    await expect(handler({})).rejects.toMatchObject({ statusCode: 500 })
  })

  it('maps inactive items using is_active fallback for status', async () => {
    mockItemFindMany.mockResolvedValue([makePreferredItem({ status: null, is_active: false })])
    const { default: handler } = await import('../../../server/api/cost-code-configurations/project-filtered.get')

    const result = await handler({}) as any
    expect(result.data[0].preferred_items[0].status).toBe('Inactive')
  })

  it('groups multiple preferred items under correct configurations', async () => {
    const config2 = makeConfig({ id: BigInt(2), uuid: 'cc-uuid-2', cost_code_number: '02-200' })
    mockConfigFindMany.mockResolvedValue([makeConfig(), config2])
    mockItemFindMany.mockResolvedValue([
      makePreferredItem({ uuid: 'pi-1', cost_code_configuration_uuid: 'cc-uuid-1' }),
      makePreferredItem({ uuid: 'pi-2', cost_code_configuration_uuid: 'cc-uuid-1' }),
      makePreferredItem({ uuid: 'pi-3', cost_code_configuration_uuid: 'cc-uuid-2' }),
    ])
    const { default: handler } = await import('../../../server/api/cost-code-configurations/project-filtered.get')

    const result = await handler({}) as any
    expect(result.data[0].preferred_items).toHaveLength(2)
    expect(result.data[1].preferred_items).toHaveLength(1)
  })
})
