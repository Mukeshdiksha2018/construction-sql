import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListServiceTypes = vi.fn()
const mockCreateServiceType = vi.fn()
const mockUpdateServiceType = vi.fn()
const mockDeleteServiceType = vi.fn()
const mockParseServiceTypeBody = vi.fn()
const mockParseServiceTypeUpdateBody = vi.fn()
const mockUseAuth = vi.fn()
const mockReadBody = vi.fn()
const mockGetRouterParam = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getRouterParam', mockGetRouterParam)

vi.mock('../../../server/utils/service-types', () => ({
  listServiceTypes: (...args: unknown[]) => mockListServiceTypes(...args),
  createServiceType: (...args: unknown[]) => mockCreateServiceType(...args),
  updateServiceType: (...args: unknown[]) => mockUpdateServiceType(...args),
  deleteServiceType: (...args: unknown[]) => mockDeleteServiceType(...args),
  parseServiceTypeBody: (...args: unknown[]) => mockParseServiceTypeBody(...args),
  parseServiceTypeUpdateBody: (...args: unknown[]) => mockParseServiceTypeUpdateBody(...args),
}))

vi.mock('../../../server/utils/use-auth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}))

describe('service-types API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ session: { userID: 'user-1' } })
    mockReadBody.mockResolvedValue({})
    mockGetRouterParam.mockReturnValue('1')
  })

  it('GET /api/service-types returns data', async () => {
    mockListServiceTypes.mockResolvedValue([{ id: 1, name: 'Electrical' }])
    const { default: handler } = await import('../../../server/api/service-types/index.get')

    const result = await handler({})
    expect(result).toEqual({ success: true, data: [{ id: 1, name: 'Electrical' }] })
  })

  it('POST /api/service-types parses body and creates', async () => {
    mockReadBody.mockResolvedValue({ name: 'Electrical' })
    mockParseServiceTypeBody.mockReturnValue({ name: 'Electrical', isActive: true })
    mockCreateServiceType.mockResolvedValue({ id: 1, name: 'Electrical' })
    const { default: handler } = await import('../../../server/api/service-types/index.post')

    const result = await handler({})
    expect(mockCreateServiceType).toHaveBeenCalledWith({ name: 'Electrical', isActive: true }, 'user-1')
    expect(result).toEqual({ success: true, data: { id: 1, name: 'Electrical' } })
  })

  it('PUT /api/service-types/:id updates record', async () => {
    mockReadBody.mockResolvedValue({ name: 'Plumbing' })
    mockParseServiceTypeUpdateBody.mockReturnValue({ name: 'Plumbing' })
    mockUpdateServiceType.mockResolvedValue({ id: 1, name: 'Plumbing' })
    const { default: handler } = await import('../../../server/api/service-types/[id].put')

    const result = await handler({})
    expect(mockUpdateServiceType).toHaveBeenCalledWith('1', { name: 'Plumbing' }, 'user-1')
    expect(result).toEqual({ success: true, data: { id: 1, name: 'Plumbing' } })
  })

  it('PUT /api/service-types/:id returns 400 when id missing', async () => {
    mockGetRouterParam.mockReturnValue(undefined)
    const { default: handler } = await import('../../../server/api/service-types/[id].put')

    await expect(handler({})).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Service type ID is required',
    })
  })

  it('DELETE /api/service-types/:id deletes record', async () => {
    mockDeleteServiceType.mockResolvedValue(undefined)
    const { default: handler } = await import('../../../server/api/service-types/[id].delete')

    const result = await handler({})
    expect(mockDeleteServiceType).toHaveBeenCalledWith('1')
    expect(result).toEqual({ success: true, message: 'Service type deleted successfully' })
  })
})
