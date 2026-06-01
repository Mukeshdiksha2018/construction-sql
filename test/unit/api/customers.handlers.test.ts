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

  it('GET /api/customers requires corporation_uuid', async () => {
    const handler = (await import('../../../server/api/customers/index.get')).default
    vi.stubGlobal('getQuery', () => ({}))

    await expect(handler({} as never)).rejects.toMatchObject({
      statusCode: 400,
      message: 'corporation_uuid is required',
    })
  })

  it('GET /api/customers returns list', async () => {
    const handler = (await import('../../../server/api/customers/index.get')).default
    mockListCustomers.mockResolvedValue([{ uuid: 'cust-1' }])
    vi.stubGlobal('getQuery', () => ({ corporation_uuid: 'corp-1' }))

    const result = await handler({} as never)
    expect(mockListCustomers).toHaveBeenCalledWith('corp-1', null)
    expect(result).toEqual({ success: true, data: [{ uuid: 'cust-1' }] })
  })

  it('POST /api/customers creates customer', async () => {
    const handler = (await import('../../../server/api/customers/index.post')).default
    mockCreateCustomer.mockResolvedValue({ uuid: 'new-cust' })
    vi.stubGlobal('readBody', async () => ({
      corporation_uuid: 'corp-1',
      first_name: 'Jane',
      last_name: 'Doe',
    }))

    const result = await handler({} as never)
    expect(mockCreateCustomer).toHaveBeenCalled()
    expect(result.data).toEqual({ uuid: 'new-cust' })
  })
})
