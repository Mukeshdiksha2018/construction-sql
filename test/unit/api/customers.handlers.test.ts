import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockListCustomers = vi.fn()
const mockCreateCustomer = vi.fn()
const mockUpdateCustomer = vi.fn()
const mockSoftDeleteCustomer = vi.fn()
const mockUseAuth = vi.fn()

vi.mock('../../../server/utils/customers', () => ({
  listCustomers: (...args: unknown[]) => mockListCustomers(...args),
  createCustomer: (...args: unknown[]) => mockCreateCustomer(...args),
  updateCustomer: (...args: unknown[]) => mockUpdateCustomer(...args),
  softDeleteCustomer: (...args: unknown[]) => mockSoftDeleteCustomer(...args),
}))

vi.mock('../../../server/utils/use-auth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}))

function stubNuxtGlobals() {
  vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
  vi.stubGlobal(
    'createError',
    (opts: { statusCode: number, statusMessage: string }) => {
      const err = new Error(opts.statusMessage) as Error & { statusCode: number }
      err.statusCode = opts.statusCode
      return err
    },
  )
}

describe('customers API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stubNuxtGlobals()
    mockUseAuth.mockReturnValue({ session: { userID: 'user-1' } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('GET /api/customers', () => {
    it('requires corporation_uuid', async () => {
      const handler = (await import('../../../server/api/customers/index.get')).default
      vi.stubGlobal('getQuery', () => ({}))

      await expect(handler({} as never)).rejects.toMatchObject({
        statusCode: 400,
        message: 'corporation_uuid is required',
      })
    })

    it('returns customer list', async () => {
      const handler = (await import('../../../server/api/customers/index.get')).default
      mockListCustomers.mockResolvedValue([{ uuid: 'cust-1' }])
      vi.stubGlobal('getQuery', () => ({
        corporation_uuid: 'corp-1',
        project_uuid: 'proj-1',
      }))

      const result = await handler({} as never)
      expect(mockListCustomers).toHaveBeenCalledWith('corp-1', 'proj-1')
      expect(result).toEqual({ success: true, data: [{ uuid: 'cust-1' }] })
    })
  })

  describe('POST /api/customers', () => {
    it('creates customer with auth user', async () => {
      const handler = (await import('../../../server/api/customers/index.post')).default
      const body = {
        corporation_uuid: 'corp-1',
        first_name: 'Jane',
        last_name: 'Doe',
      }
      mockCreateCustomer.mockResolvedValue({ uuid: 'new-cust' })
      vi.stubGlobal('readBody', async () => body)

      const result = await handler({} as never)
      expect(mockCreateCustomer).toHaveBeenCalledWith(body, 'user-1')
      expect(result).toMatchObject({
        success: true,
        data: { uuid: 'new-cust' },
        message: 'Customer created successfully',
      })
    })
  })

  describe('PUT /api/customers', () => {
    it('requires uuid in body', async () => {
      const handler = (await import('../../../server/api/customers/index.put')).default
      vi.stubGlobal('readBody', async () => ({ corporation_uuid: 'corp-1' }))

      await expect(handler({} as never)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Customer UUID is required for update',
      })
    })

    it('updates customer', async () => {
      const handler = (await import('../../../server/api/customers/index.put')).default
      mockUpdateCustomer.mockResolvedValue({ uuid: 'cust-1', first_name: 'Janet' })
      vi.stubGlobal('readBody', async () => ({
        uuid: 'cust-1',
        corporation_uuid: 'corp-1',
        first_name: 'Janet',
        last_name: 'Doe',
      }))

      const result = await handler({} as never)
      expect(mockUpdateCustomer).toHaveBeenCalledWith(
        'cust-1',
        expect.objectContaining({ first_name: 'Janet' }),
        'user-1',
      )
      expect(result.data.first_name).toBe('Janet')
    })
  })

  describe('DELETE /api/customers', () => {
    it('requires uuid query param', async () => {
      const handler = (await import('../../../server/api/customers/index.delete')).default
      vi.stubGlobal('getQuery', () => ({}))

      await expect(handler({} as never)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Customer UUID is required for delete',
      })
    })

    it('soft-deletes customer', async () => {
      const handler = (await import('../../../server/api/customers/index.delete')).default
      vi.stubGlobal('getQuery', () => ({ uuid: 'cust-1' }))

      const result = await handler({} as never)
      expect(mockSoftDeleteCustomer).toHaveBeenCalledWith('cust-1', 'user-1')
      expect(result).toEqual({ success: true })
    })
  })
})
