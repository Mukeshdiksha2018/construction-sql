import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListFreight = vi.fn()
const mockCreateFreight = vi.fn()
const mockUpdateFreight = vi.fn()
const mockDeleteFreight = vi.fn()
const mockParseFreightBody = vi.fn()
const mockParseFreightUpdateBody = vi.fn()
const mockUseAuth = vi.fn()
const mockReadBody = vi.fn()
const mockGetRouterParam = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getRouterParam', mockGetRouterParam)

vi.mock('../../../server/utils/freight', () => ({
  listFreight: () => mockListFreight(),
  createFreight: (...args: unknown[]) => mockCreateFreight(...args),
  updateFreight: (...args: unknown[]) => mockUpdateFreight(...args),
  deleteFreight: (...args: unknown[]) => mockDeleteFreight(...args),
  parseFreightBody: (...args: unknown[]) => mockParseFreightBody(...args),
  parseFreightUpdateBody: (...args: unknown[]) => mockParseFreightUpdateBody(...args),
}))

vi.mock('../../../server/utils/use-auth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}))

describe('freight API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ session: { userID: 'user-1' } })
    mockReadBody.mockResolvedValue({})
    mockGetRouterParam.mockReturnValue('uuid-1')
  })

  it('GET /api/freight returns data', async () => {
    mockListFreight.mockResolvedValue([{ uuid: 'uuid-1' }])
    const { default: handler } = await import('../../../server/api/freight/index.get')

    const result = await handler({})
    expect(result).toEqual({ success: true, data: [{ uuid: 'uuid-1' }] })
  })

  it('GET /api/freight maps errors', async () => {
    mockListFreight.mockRejectedValue({ statusCode: 503, statusMessage: 'DB down' })
    const { default: handler } = await import('../../../server/api/freight/index.get')

    await expect(handler({})).rejects.toMatchObject({ statusCode: 503, statusMessage: 'DB down' })
  })

  it('POST /api/freight parses body and creates freight', async () => {
    mockReadBody.mockResolvedValue({ freight_name: 'FedEx', active: true })
    mockParseFreightBody.mockReturnValue({ freight_name: 'FedEx', active: true })
    mockCreateFreight.mockResolvedValue({ uuid: 'uuid-1' })
    const { default: handler } = await import('../../../server/api/freight/index.post')

    const result = await handler({})
    expect(mockCreateFreight).toHaveBeenCalledWith({ freight_name: 'FedEx', active: true }, 'user-1')
    expect(result).toMatchObject({ success: true, message: 'Freight created successfully' })
  })

  it('PUT /api/freight/:uuid updates freight', async () => {
    mockReadBody.mockResolvedValue({ freight_name: 'UPS', active: false })
    mockParseFreightUpdateBody.mockReturnValue({ freight_name: 'UPS', active: false })
    mockUpdateFreight.mockResolvedValue({ uuid: 'uuid-1' })
    const { default: handler } = await import('../../../server/api/freight/[uuid].put')

    const result = await handler({})
    expect(mockUpdateFreight).toHaveBeenCalledWith('uuid-1', { freight_name: 'UPS', active: false }, 'user-1')
    expect(result).toMatchObject({ success: true, message: 'Freight updated successfully' })
  })

  it('PUT /api/freight/:uuid returns 400 when uuid missing', async () => {
    mockGetRouterParam.mockReturnValue(undefined)
    const { default: handler } = await import('../../../server/api/freight/[uuid].put')

    await expect(handler({})).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Freight UUID is required',
    })
  })

  it('DELETE /api/freight/:uuid deletes freight', async () => {
    mockDeleteFreight.mockResolvedValue(undefined)
    const { default: handler } = await import('../../../server/api/freight/[uuid].delete')

    const result = await handler({})
    expect(mockDeleteFreight).toHaveBeenCalledWith('uuid-1')
    expect(result).toEqual({ success: true, message: 'Freight deleted successfully' })
  })
})
