/**
 * Unit tests for server/utils/itemTypes.ts
 * Tests validation branches that don't require a live Prisma connection.
 * The Prisma client is mocked at the module level.
 */
import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ── Mock Prisma ──────────────────────────────────────────────────────────────
const mockFindFirst = vi.fn()
const mockFindUnique = vi.fn()
const mockFindMany = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

vi.mock('../../../server/utils/prisma', () => ({
  getPrisma: () => ({
    itemType: {
      findMany: (...a: unknown[]) => mockFindMany(...a),
      findFirst: (...a: unknown[]) => mockFindFirst(...a),
      findUnique: (...a: unknown[]) => mockFindUnique(...a),
      create: (...a: unknown[]) => mockCreate(...a),
      update: (...a: unknown[]) => mockUpdate(...a),
      delete: (...a: unknown[]) => mockDelete(...a),
    },
  }),
}))

vi.stubGlobal('createError', createError)

// Import after mocking
const { createItemType, updateItemType, deleteItemType, listItemTypes, getItemTypeByUuid } = await import('../../../server/utils/itemTypes')

const now = new Date()
const makeRow = (overrides = {}) => ({
  id: BigInt(1),
  uuid: 'it-uuid-1',
  corporation_uuid: 'corp-1',
  category: 'construction',
  spec_type: 'Structural',
  item_division_uuid: null,
  item_type: 'Steel Beam',
  description: null,
  is_active: true,
  created_at: now,
  updated_at: now,
  ...overrides,
})

describe('server/utils/itemTypes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── listItemTypes ──────────────────────────────────────────────────────────
  describe('listItemTypes', () => {
    it('fetches all item types when no corporation uuid provided', async () => {
      const row = makeRow()
      mockFindMany.mockResolvedValue([row])

      const result = await listItemTypes()

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      )
      expect(result).toHaveLength(1)
      expect(result[0]?.item_type).toBe('Steel Beam')
    })

    it('includes OR filter for corporation uuid and null', async () => {
      mockFindMany.mockResolvedValue([])

      await listItemTypes('corp-1')

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { corporation_uuid: 'corp-1' },
              { corporation_uuid: null },
            ],
          },
        }),
      )
    })

    it('maps BigInt id to Number', async () => {
      mockFindMany.mockResolvedValue([makeRow({ id: BigInt(99) })])

      const result = await listItemTypes()
      expect(result[0]?.id).toBe(99)
      expect(typeof result[0]?.id).toBe('number')
    })

    it('returns uuid in lowercase', async () => {
      mockFindMany.mockResolvedValue([makeRow({ uuid: 'IT-UUID-UPPER' })])

      const result = await listItemTypes()
      expect(result[0]?.uuid).toBe('it-uuid-upper')
    })
  })

  // ── getItemTypeByUuid ──────────────────────────────────────────────────────
  describe('getItemTypeByUuid', () => {
    it('returns null when not found', async () => {
      mockFindUnique.mockResolvedValue(null)

      const result = await getItemTypeByUuid('missing-uuid')
      expect(result).toBeNull()
    })

    it('returns mapped item type when found', async () => {
      mockFindUnique.mockResolvedValue(makeRow())

      const result = await getItemTypeByUuid('it-uuid-1')
      expect(result?.item_type).toBe('Steel Beam')
      expect(result?.is_active).toBe(true)
    })

    it('normalizes uuid to lowercase before query', async () => {
      mockFindUnique.mockResolvedValue(null)

      await getItemTypeByUuid('IT-UUID-UPPER')
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { uuid: 'it-uuid-upper' },
      })
    })
  })

  // ── createItemType ─────────────────────────────────────────────────────────
  describe('createItemType', () => {
    it('throws 400 for invalid category', async () => {
      await expect(createItemType({
        category: 'invalid',
        spec_type: 'Structural',
        item_type: 'Steel Beam',
      })).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Category must be procurement or construction',
      })
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('throws 400 for empty spec_type', async () => {
      await expect(createItemType({
        category: 'construction',
        spec_type: '   ',
        item_type: 'Steel Beam',
      })).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Spec Type is required',
      })
    })

    it('throws 400 for empty item_type name', async () => {
      await expect(createItemType({
        category: 'construction',
        spec_type: 'Structural',
        item_type: '',
      })).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Item Type name is required',
      })
    })

    it('throws 409 for duplicate item type', async () => {
      mockFindFirst.mockResolvedValue(makeRow())

      await expect(createItemType({
        category: 'construction',
        spec_type: 'Structural',
        item_type: 'Steel Beam',
      })).rejects.toMatchObject({
        statusCode: 409,
        statusMessage: 'Item type with this name already exists for this category, spec type, and division',
      })
      expect(mockCreate).not.toHaveBeenCalled()
    })

    it('creates item type when valid and no duplicate', async () => {
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue(makeRow())

      const result = await createItemType({
        category: 'construction',
        spec_type: 'Structural',
        item_type: 'Steel Beam',
      })

      expect(result.item_type).toBe('Steel Beam')
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            category: 'construction',
            spec_type: 'Structural',
            item_type: 'Steel Beam',
            is_active: true,
          }),
        }),
      )
    })

    it('accepts procurement as valid category', async () => {
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue(makeRow({ category: 'procurement' }))

      const result = await createItemType({
        category: 'procurement',
        spec_type: 'Plumbing',
        item_type: 'PVC Pipe',
      })

      expect(result.category).toBe('procurement')
    })

    it('normalizes category to lowercase', async () => {
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue(makeRow({ category: 'construction' }))

      await createItemType({
        category: 'CONSTRUCTION',
        spec_type: 'Structural',
        item_type: 'Bolt',
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ category: 'construction' }),
        }),
      )
    })

    it('stores corporation_uuid as lowercase', async () => {
      mockFindFirst.mockResolvedValue(null)
      mockCreate.mockResolvedValue(makeRow())

      await createItemType({
        category: 'construction',
        spec_type: 'Structural',
        item_type: 'Bolt',
        corporation_uuid: 'CORP-UPPER',
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ corporation_uuid: 'corp-upper' }),
        }),
      )
    })
  })

  // ── updateItemType ─────────────────────────────────────────────────────────
  describe('updateItemType', () => {
    it('throws 404 when item type not found', async () => {
      mockFindUnique.mockResolvedValue(null)

      await expect(updateItemType('missing-uuid', { item_type: 'New Name' })).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Item type not found',
      })
    })

    it('throws 400 for invalid category on update', async () => {
      mockFindUnique.mockResolvedValue(makeRow())

      await expect(updateItemType('it-uuid-1', { category: 'invalid-cat' })).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Category must be procurement or construction',
      })
    })

    it('checks for duplicates when fields change', async () => {
      mockFindUnique.mockResolvedValue(makeRow())
      mockFindFirst.mockResolvedValue(makeRow({ uuid: 'other-uuid' }))

      await expect(updateItemType('it-uuid-1', { item_type: 'Different Name' })).rejects.toMatchObject({
        statusCode: 409,
      })
    })

    it('skips duplicate check when nothing changed', async () => {
      const existing = makeRow()
      mockFindUnique.mockResolvedValue(existing)
      mockUpdate.mockResolvedValue(existing)

      await updateItemType('it-uuid-1', {
        item_type: existing.item_type,
        spec_type: existing.spec_type,
        category: existing.category,
      })

      expect(mockFindFirst).not.toHaveBeenCalled()
    })

    it('updates when valid', async () => {
      const existing = makeRow()
      const updated = { ...existing, item_type: 'Updated Beam' }
      mockFindUnique.mockResolvedValue(existing)
      mockFindFirst.mockResolvedValue(null)
      mockUpdate.mockResolvedValue(updated)

      const result = await updateItemType('it-uuid-1', { item_type: 'Updated Beam' })

      expect(result.item_type).toBe('Updated Beam')
      expect(mockUpdate).toHaveBeenCalled()
    })
  })

  // ── deleteItemType ─────────────────────────────────────────────────────────
  describe('deleteItemType', () => {
    it('deletes successfully', async () => {
      mockDelete.mockResolvedValue(undefined)

      await expect(deleteItemType('it-uuid-1')).resolves.toBeUndefined()
      expect(mockDelete).toHaveBeenCalledWith({ where: { uuid: 'it-uuid-1' } })
    })

    it('normalizes uuid to lowercase', async () => {
      mockDelete.mockResolvedValue(undefined)

      await deleteItemType('IT-UUID-UPPER')
      expect(mockDelete).toHaveBeenCalledWith({ where: { uuid: 'it-uuid-upper' } })
    })

    it('throws 404 when Prisma P2025 error occurs', async () => {
      const prismaErr = Object.assign(new Error('Not found'), {
        constructor: { name: 'PrismaClientKnownRequestError' },
        code: 'P2025',
      })

      const { Prisma } = await import('@prisma/client')
      const p2025 = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '6.0.0',
      })

      mockDelete.mockRejectedValue(p2025)

      await expect(deleteItemType('it-uuid-1')).rejects.toMatchObject({
        statusCode: 404,
        statusMessage: 'Item type not found',
      })
    })
  })
})
