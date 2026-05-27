import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListLocation = vi.fn()
const mockCreateLocation = vi.fn()
const mockUpdateLocation = vi.fn()
const mockDeleteLocation = vi.fn()
const mockParseLocationBody = vi.fn()
const mockParseLocationUpdateBody = vi.fn()
const mockUseAuth = vi.fn()
const mockReadBody = vi.fn()
const mockGetRouterParam = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getRouterParam', mockGetRouterParam)

vi.mock('../../../server/utils/location', () => ({
  listLocation: () => mockListLocation(),
  createLocation: (...args: unknown[]) => mockCreateLocation(...args),
  updateLocation: (...args: unknown[]) => mockUpdateLocation(...args),
  deleteLocation: (...args: unknown[]) => mockDeleteLocation(...args),
  parseLocationBody: (...args: unknown[]) => mockParseLocationBody(...args),
  parseLocationUpdateBody: (...args: unknown[]) => mockParseLocationUpdateBody(...args),
}))

vi.mock('../../../server/utils/use-auth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}))

describe('location API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ session: { userID: 'user-1' } })
    mockReadBody.mockResolvedValue({})
    mockGetRouterParam.mockReturnValue('uuid-1')
  })

  it('GET /api/location returns data', async () => {
    mockListLocation.mockResolvedValue([{ uuid: 'uuid-1' }])
    const { default: handler } = await import('../../../server/api/location/index.get')

    const result = await handler({})
    expect(result).toEqual({ success: true, data: [{ uuid: 'uuid-1' }] })
  })

  it('GET /api/location maps errors', async () => {
    mockListLocation.mockRejectedValue({ statusCode: 500, statusMessage: 'Failed' })
    const { default: handler } = await import('../../../server/api/location/index.get')

    await expect(handler({})).rejects.toMatchObject({ statusCode: 500, statusMessage: 'Failed' })
  })

  it('POST /api/location parses body and creates location', async () => {
    mockReadBody.mockResolvedValue({ location_name: 'Main Warehouse', active: true })
    mockParseLocationBody.mockReturnValue({ location_name: 'Main Warehouse', active: true })
    mockCreateLocation.mockResolvedValue({ uuid: 'uuid-1' })
    const { default: handler } = await import('../../../server/api/location/index.post')

    const result = await handler({})
    expect(mockCreateLocation).toHaveBeenCalledWith({ location_name: 'Main Warehouse', active: true }, 'user-1')
    expect(result).toMatchObject({ success: true, message: 'Location created successfully' })
  })

  it('PUT /api/location/:uuid updates location', async () => {
    mockReadBody.mockResolvedValue({ location_name: 'Yard', active: false })
    mockParseLocationUpdateBody.mockReturnValue({ location_name: 'Yard', active: false })
    mockUpdateLocation.mockResolvedValue({ uuid: 'uuid-1' })
    const { default: handler } = await import('../../../server/api/location/[uuid].put')

    const result = await handler({})
    expect(mockUpdateLocation).toHaveBeenCalledWith('uuid-1', { location_name: 'Yard', active: false }, 'user-1')
    expect(result).toMatchObject({ success: true, message: 'Location updated successfully' })
  })

  it('PUT /api/location/:uuid returns 400 when uuid missing', async () => {
    mockGetRouterParam.mockReturnValue(undefined)
    const { default: handler } = await import('../../../server/api/location/[uuid].put')

    await expect(handler({})).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: 'Location UUID is required',
    })
  })

  it('DELETE /api/location/:uuid deletes location', async () => {
    mockDeleteLocation.mockResolvedValue(undefined)
    const { default: handler } = await import('../../../server/api/location/[uuid].delete')

    const result = await handler({})
    expect(mockDeleteLocation).toHaveBeenCalledWith('uuid-1')
    expect(result).toEqual({ success: true, message: 'Location deleted successfully' })
  })
})
