import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFindMany = vi.fn()
const mockFindUnique = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

vi.mock('../../../server/utils/prisma', () => ({
  getPrisma: () => ({
    costCodePreferredItem: {
      findMany: (...a: unknown[]) => mockFindMany(...a),
      findUnique: (...a: unknown[]) => mockFindUnique(...a),
      create: (...a: unknown[]) => mockCreate(...a),
      update: (...a: unknown[]) => mockUpdate(...a),
      delete: (...a: unknown[]) => mockDelete(...a),
    },
  }),
}))

vi.stubGlobal('createError', createError)

const {
  listPreferredItems,
  getPreferredItemsByProjectAndItemType,
} = await import('../../../server/utils/preferredItems')

const now = new Date()

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: BigInt(1),
  uuid: 'ITEM-UUID-1',
  corporation_uuid: 'CORP-1',
  project_uuid: 'PROJ-1',
  cost_code_configuration_uuid: 'CFG-UUID-1',
  item_type_uuid: 'IT-1',
  category: 'construction',
  item_name: 'Bolt',
  item_sequence: 'B-001',
  model_number: null,
  unit_price: 1.5,
  uom_uuid: null,
  location_uuid: null,
  preferred_vendor_uuid: null,
  initial_quantity: null,
  as_of_date: null,
  reorder_point: null,
  maximum_limit: null,
  description: null,
  status: 'Active',
  is_active: true,
  created_at: now,
  updated_at: now,
  ...overrides,
})

describe('server/utils/preferredItems', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listPreferredItems', () => {
    it('filters by corporation and optional project', async () => {
      mockFindMany.mockResolvedValue([makeRow()])

      await listPreferredItems('corp-1', 'proj-1')

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            corporation_uuid: 'corp-1',
            project_uuid: 'proj-1',
          },
        }),
      )
    })
  })

  describe('getPreferredItemsByProjectAndItemType', () => {
    it('filters by corporation, project, and item type', async () => {
      mockFindMany.mockResolvedValue([makeRow()])

      const result = await getPreferredItemsByProjectAndItemType('corp-1', 'proj-1', 'it-1')

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            corporation_uuid: 'corp-1',
            project_uuid: 'proj-1',
            item_type_uuid: 'it-1',
          },
        }),
      )
      expect(result[0]?.uuid).toBe('item-uuid-1')
      expect(result[0]?.cost_code_configuration_uuid).toBe('cfg-uuid-1')
    })

    it('adds cost_code_configuration_uuid filter when provided', async () => {
      mockFindMany.mockResolvedValue([])

      await getPreferredItemsByProjectAndItemType('corp-1', 'proj-1', 'it-1', 'CFG-UUID-2')

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            corporation_uuid: 'corp-1',
            project_uuid: 'proj-1',
            item_type_uuid: 'it-1',
            cost_code_configuration_uuid: 'cfg-uuid-2',
          },
        }),
      )
    })

    it('omits cost code filter when costCodeConfigurationUuid is empty', async () => {
      mockFindMany.mockResolvedValue([])

      await getPreferredItemsByProjectAndItemType('corp-1', 'proj-1', 'it-1', '')

      const call = mockFindMany.mock.calls[0][0] as { where: Record<string, unknown> }
      expect(call.where).not.toHaveProperty('cost_code_configuration_uuid')
    })
  })
})
