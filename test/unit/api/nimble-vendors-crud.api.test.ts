import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListNimbleVendors = vi.fn()
const mockGetNimbleVendor = vi.fn()
const mockCreateNimbleVendor = vi.fn()
const mockUpdateNimbleVendor = vi.fn()
const mockSoftDeleteNimbleVendor = vi.fn()
const mockParseNimbleVendorBody = vi.fn()
const mockUseAuth = vi.fn()
const mockReadBody = vi.fn()
const mockGetRouterParam = vi.fn()
const mockGetQuery = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getRouterParam', mockGetRouterParam)
vi.stubGlobal('getQuery', mockGetQuery)

vi.mock('../../../server/utils/nimbleVendors', () => ({
  listNimbleVendors: (...args: unknown[]) => mockListNimbleVendors(...args),
  getNimbleVendor: (...args: unknown[]) => mockGetNimbleVendor(...args),
  createNimbleVendor: (...args: unknown[]) => mockCreateNimbleVendor(...args),
  updateNimbleVendor: (...args: unknown[]) => mockUpdateNimbleVendor(...args),
  softDeleteNimbleVendor: (...args: unknown[]) => mockSoftDeleteNimbleVendor(...args),
  parseNimbleVendorBody: (...args: unknown[]) => mockParseNimbleVendorBody(...args),
}))

vi.mock('../../../server/utils/use-auth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}))

const sampleVendor = {
  vendor_id: 'a156fef05bbc45a24c33abe8e750147b0000',
  name: 'Acme',
  status: 1,
  status_label: 'active',
}

describe('nimble-vendors SQL API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ session: { userID: 'user-hex-0000' } })
    mockReadBody.mockResolvedValue({})
    mockGetRouterParam.mockReturnValue(sampleVendor.vendor_id)
    mockGetQuery.mockReturnValue({ corporation_uuid: 'corp-1' })
  })

  it('GET /api/nimble-vendors lists vendors', async () => {
    mockListNimbleVendors.mockResolvedValue([sampleVendor])
    const { default: handler } = await import('../../../server/api/nimble-vendors/index.get')

    const result = await handler({})
    expect(mockListNimbleVendors).toHaveBeenCalledWith({
      corporationId: 'corp-1',
      status: undefined,
      includeDeleted: false,
    })
    expect(result).toEqual({ success: true, vendors: [sampleVendor] })
  })

  it('POST /api/nimble-vendors creates vendor', async () => {
    mockParseNimbleVendorBody.mockReturnValue({ name: 'Acme', corporation_id: 'corp-1' })
    mockCreateNimbleVendor.mockResolvedValue(sampleVendor)
    const { default: handler } = await import('../../../server/api/nimble-vendors/index.post')

    const result = await handler({})
    expect(mockCreateNimbleVendor).toHaveBeenCalledWith(
      { name: 'Acme', corporation_id: 'corp-1' },
      'user-hex-0000',
    )
    expect(result).toMatchObject({ success: true, message: 'Vendor created successfully' })
  })

  it('GET /api/nimble-vendors/:id returns vendor', async () => {
    mockGetNimbleVendor.mockResolvedValue(sampleVendor)
    const { default: handler } = await import('../../../server/api/nimble-vendors/[id].get')

    const result = await handler({})
    expect(result).toEqual({ success: true, vendor: sampleVendor })
  })

  it('PUT /api/nimble-vendors/:id updates vendor', async () => {
    mockParseNimbleVendorBody.mockReturnValue({ name: 'Updated' })
    mockUpdateNimbleVendor.mockResolvedValue({ ...sampleVendor, name: 'Updated' })
    const { default: handler } = await import('../../../server/api/nimble-vendors/[id].put')

    const result = await handler({})
    expect(mockUpdateNimbleVendor).toHaveBeenCalledWith(
      sampleVendor.vendor_id,
      { name: 'Updated' },
      'user-hex-0000',
    )
    expect(result).toMatchObject({ success: true, message: 'Vendor updated successfully' })
  })

  it('DELETE /api/nimble-vendors/:id soft-deletes vendor', async () => {
    mockSoftDeleteNimbleVendor.mockResolvedValue({ ...sampleVendor, status: 3, status_label: 'deleted' })
    const { default: handler } = await import('../../../server/api/nimble-vendors/[id].delete')

    const result = await handler({})
    expect(mockSoftDeleteNimbleVendor).toHaveBeenCalledWith(sampleVendor.vendor_id, 'user-hex-0000')
    expect(result).toMatchObject({ success: true, message: 'Vendor deleted successfully' })
  })
})
