import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeCustomerRow } from '../../helpers/customers'

const mockFindMany = vi.fn()
const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockMssqlQueryParams = vi.fn()

vi.mock('../../../server/utils/prisma', () => ({
  getPrisma: () => ({
    customer: {
      findMany: mockFindMany,
      create: mockCreate,
      update: mockUpdate,
    },
  }),
}))

vi.mock('../../../server/utils/mssql', () => ({
  mssqlQueryParams: (...args: unknown[]) => mockMssqlQueryParams(...args),
}))

function h3Error(message: string, statusCode = 400) {
  const err = new Error(message) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}

vi.mock('h3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    createError: (opts: { statusCode: number, statusMessage: string }) =>
      h3Error(opts.statusMessage, opts.statusCode),
  }
})

describe('server/utils/customers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMssqlQueryParams.mockResolvedValue([{ uuid: 'project-1' }])
  })

  describe('mapCustomerRow', () => {
    it('normalizes UUIDs to lowercase and maps fields', async () => {
      const { mapCustomerRow } = await import('../../../server/utils/customers')
      const mapped = mapCustomerRow(makeCustomerRow({
        uuid: 'ABC-DEF',
        corporation_uuid: 'CORP-UPPER',
        project_uuid: 'PROJ-1',
      }))

      expect(mapped.uuid).toBe('abc-def')
      expect(mapped.corporation_uuid).toBe('corp-upper')
      expect(mapped.project_uuid).toBe('proj-1')
      expect(mapped.first_name).toBe('Jane')
      expect(mapped.is_active).toBe(true)
    })
  })

  describe('listCustomers', () => {
    it('lists active customers for corporation', async () => {
      mockFindMany.mockResolvedValue([makeCustomerRow()])
      const { listCustomers } = await import('../../../server/utils/customers')

      const rows = await listCustomers('CORP-UUID-1')
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            corporation_uuid: 'corp-uuid-1',
            is_active: true,
          }),
        }),
      )
      expect(rows).toHaveLength(1)
      expect(rows[0].uuid).toBe('cust-uuid-1')
    })

    it('includes corp-wide customers when project filter is set', async () => {
      mockFindMany.mockResolvedValue([])
      const { listCustomers } = await import('../../../server/utils/customers')

      await listCustomers('corp-1', 'project-1')
      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ project_uuid: null }, { project_uuid: 'project-1' }],
          }),
        }),
      )
    })
  })

  describe('createCustomer', () => {
    it('creates customer with normalized payload', async () => {
      mockCreate.mockResolvedValue(makeCustomerRow({ uuid: 'new-1' }))
      const { createCustomer } = await import('../../../server/utils/customers')

      const result = await createCustomer({
        corporation_uuid: 'CORP-1',
        first_name: 'John',
        last_name: 'Smith',
        customer_email: 'john@test.com',
        customer_country: 'US',
      }, 'user-1')

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            corporation_uuid: 'corp-1',
            first_name: 'John',
            last_name: 'Smith',
            customer_country: 'US',
            created_by: 'user-1',
          }),
        }),
      )
      expect(result.uuid).toBe('new-1')
    })

    it('requires corporation_uuid', async () => {
      const { createCustomer } = await import('../../../server/utils/customers')
      await expect(createCustomer({
        corporation_uuid: '',
        first_name: 'A',
        last_name: 'B',
      })).rejects.toMatchObject({ statusCode: 400 })
    })

    it('requires first and last name', async () => {
      const { createCustomer } = await import('../../../server/utils/customers')
      await expect(createCustomer({
        corporation_uuid: 'corp-1',
        first_name: '',
        last_name: 'B',
      })).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining('first_name'),
      })
    })

    it('rejects invalid email', async () => {
      const { createCustomer } = await import('../../../server/utils/customers')
      await expect(createCustomer({
        corporation_uuid: 'corp-1',
        first_name: 'A',
        last_name: 'B',
        customer_email: 'not-an-email',
      })).rejects.toMatchObject({ statusCode: 400, message: /email/i })
    })

    it('validates project belongs to corporation', async () => {
      mockMssqlQueryParams.mockResolvedValueOnce([])
      const { createCustomer } = await import('../../../server/utils/customers')

      await expect(createCustomer({
        corporation_uuid: 'corp-1',
        project_uuid: 'bad-project',
        first_name: 'A',
        last_name: 'B',
      })).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining('project'),
      })
    })
  })

  describe('updateCustomer', () => {
    it('updates existing customer', async () => {
      mockUpdate.mockResolvedValue(makeCustomerRow({ first_name: 'Janet' }))
      const { updateCustomer } = await import('../../../server/utils/customers')

      const result = await updateCustomer('CUST-UUID-1', {
        corporation_uuid: 'corp-1',
        first_name: 'Janet',
        last_name: 'Doe',
      }, 'user-2')

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { uuid: 'cust-uuid-1' },
        }),
      )
      expect(result.first_name).toBe('Janet')
    })
  })

  describe('softDeleteCustomer', () => {
    it('sets is_active false', async () => {
      mockUpdate.mockResolvedValue(makeCustomerRow({ is_active: false }))
      const { softDeleteCustomer } = await import('../../../server/utils/customers')

      await softDeleteCustomer('cust-1', 'user-1')
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ is_active: false }),
        }),
      )
    })
  })
})
