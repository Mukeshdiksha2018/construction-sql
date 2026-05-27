import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListProjectAddresses = vi.fn()
const mockCreateProjectAddress = vi.fn()
const mockUpdateProjectAddress = vi.fn()
const mockSoftDeleteProjectAddress = vi.fn()
const mockCheckAddressUsage = vi.fn()
const mockReadBody = vi.fn()
const mockGetQuery = vi.fn()
const mockGetRouterParam = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getQuery', mockGetQuery)
vi.stubGlobal('getRouterParam', mockGetRouterParam)

vi.mock('../../../server/utils/projectAddresses', () => ({
  listProjectAddresses: (...args: unknown[]) => mockListProjectAddresses(...args),
  createProjectAddress: (...args: unknown[]) => mockCreateProjectAddress(...args),
  updateProjectAddress: (...args: unknown[]) => mockUpdateProjectAddress(...args),
  softDeleteProjectAddress: (...args: unknown[]) => mockSoftDeleteProjectAddress(...args),
  checkAddressUsage: (...args: unknown[]) => mockCheckAddressUsage(...args),
}))

const makeAddress = (overrides = {}) => ({
  id: 1,
  uuid: 'addr-uuid-1',
  project_uuid: 'proj-uuid-1',
  address_type: 'shipment',
  contact_person: 'John',
  email: 'john@test.com',
  phone: '123',
  address_line_1: '742 Mission St',
  address_line_2: null,
  city: 'San Francisco',
  state: 'CA',
  zip_code: '94103',
  country: 'US',
  is_primary: true,
  is_active: true,
  copied_from_billing_address_uuid: null,
  created_at: '2026-05-08T09:16:34.000Z',
  updated_at: '2026-05-08T09:16:34.000Z',
  ...overrides,
})

describe('project addresses API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReadBody.mockResolvedValue({})
    mockGetQuery.mockReturnValue({})
    mockGetRouterParam.mockReturnValue('addr-uuid-1')
  })

  describe('GET /api/projects/addresses', () => {
    it('returns addresses for a project', async () => {
      mockGetQuery.mockReturnValue({ project_uuid: 'proj-uuid-1' })
      mockListProjectAddresses.mockResolvedValue([makeAddress()])
      const { default: handler } = await import('../../../server/api/projects/addresses/index.get')

      const result = await handler({})
      expect(mockListProjectAddresses).toHaveBeenCalledWith('proj-uuid-1')
      expect(result).toEqual({ data: [makeAddress()] })
    })

    it('returns 400 when project_uuid missing', async () => {
      mockGetQuery.mockReturnValue({})
      const { default: handler } = await import('../../../server/api/projects/addresses/index.get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  describe('POST /api/projects/addresses', () => {
    it('creates an address', async () => {
      const body = {
        project_uuid: 'proj-uuid-1',
        address_type: 'shipment',
        address_line_1: '742 Mission St',
        is_primary: true,
      }
      mockReadBody.mockResolvedValue(body)
      mockCreateProjectAddress.mockResolvedValue(makeAddress())
      const { default: handler } = await import('../../../server/api/projects/addresses/index.post')

      const result = await handler({})
      expect(mockCreateProjectAddress).toHaveBeenCalledWith(expect.objectContaining({
        project_uuid: 'proj-uuid-1',
        address_type: 'shipment',
        address_line_1: '742 Mission St',
      }))
      expect(result).toHaveProperty('data')
    })

    it('returns 400 when project_uuid missing', async () => {
      mockReadBody.mockResolvedValue({ address_type: 'shipment', address_line_1: 'Line 1' })
      const { default: handler } = await import('../../../server/api/projects/addresses/index.post')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400, statusMessage: 'project_uuid is required' })
    })

    it('returns 400 when address_type missing', async () => {
      mockReadBody.mockResolvedValue({ project_uuid: 'proj-1', address_line_1: 'Line 1' })
      const { default: handler } = await import('../../../server/api/projects/addresses/index.post')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400, statusMessage: 'address_type is required' })
    })

    it('returns 400 when address_line_1 missing', async () => {
      mockReadBody.mockResolvedValue({ project_uuid: 'proj-1', address_type: 'shipment' })
      const { default: handler } = await import('../../../server/api/projects/addresses/index.post')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400, statusMessage: 'address_line_1 is required' })
    })
  })

  describe('PUT /api/projects/addresses/:uuid', () => {
    it('updates an address', async () => {
      mockGetRouterParam.mockReturnValue('addr-uuid-1')
      mockReadBody.mockResolvedValue({ city: 'Oakland' })
      mockUpdateProjectAddress.mockResolvedValue(makeAddress({ city: 'Oakland' }))
      const { default: handler } = await import('../../../server/api/projects/addresses/[uuid].put')

      const result = await handler({})
      expect(mockUpdateProjectAddress).toHaveBeenCalledWith('addr-uuid-1', expect.objectContaining({ city: 'Oakland' }))
      expect(result).toHaveProperty('data')
    })

    it('returns 400 when uuid missing', async () => {
      mockGetRouterParam.mockReturnValue(undefined)
      const { default: handler } = await import('../../../server/api/projects/addresses/[uuid].put')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })

    it('returns 404 when address not found', async () => {
      mockGetRouterParam.mockReturnValue('missing')
      mockUpdateProjectAddress.mockResolvedValue(null)
      const { default: handler } = await import('../../../server/api/projects/addresses/[uuid].put')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 404 })
    })
  })

  describe('DELETE /api/projects/addresses/:uuid', () => {
    it('soft-deletes an address', async () => {
      mockGetRouterParam.mockReturnValue('addr-uuid-1')
      mockSoftDeleteProjectAddress.mockResolvedValue(true)
      const { default: handler } = await import('../../../server/api/projects/addresses/[uuid].delete')

      const result = await handler({})
      expect(mockSoftDeleteProjectAddress).toHaveBeenCalledWith('addr-uuid-1')
      expect(result).toEqual({ success: true })
    })

    it('returns 400 when uuid missing', async () => {
      mockGetRouterParam.mockReturnValue(undefined)
      const { default: handler } = await import('../../../server/api/projects/addresses/[uuid].delete')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })
  })

  describe('GET /api/projects/addresses/:uuid/usage', () => {
    it('returns usage info', async () => {
      mockGetRouterParam.mockReturnValue('addr-uuid-1')
      mockCheckAddressUsage.mockResolvedValue({ in_use: false })
      const { default: handler } = await import('../../../server/api/projects/addresses/[uuid]/usage.get')

      const result = await handler({})
      expect(mockCheckAddressUsage).toHaveBeenCalledWith('addr-uuid-1')
      expect(result).toEqual({ data: { in_use: false } })
    })

    it('returns 400 when uuid missing', async () => {
      mockGetRouterParam.mockReturnValue(undefined)
      const { default: handler } = await import('../../../server/api/projects/addresses/[uuid]/usage.get')

      await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
    })
  })
})
