import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListVendorAddresses = vi.fn()
const mockGetNimbleVendor = vi.fn()
const mockCreateVendorAddress = vi.fn()
const mockUpdateVendorAddress = vi.fn()
const mockSoftDeleteVendorAddress = vi.fn()
const mockParseVendorAddressBody = vi.fn()
const mockUseAuth = vi.fn()
const mockReadBody = vi.fn()
const mockGetRouterParam = vi.fn()

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)
vi.stubGlobal('readBody', mockReadBody)
vi.stubGlobal('getRouterParam', mockGetRouterParam)

vi.mock('../../../server/utils/nimbleVendors', () => ({
  getNimbleVendor: (...args: unknown[]) => mockGetNimbleVendor(...args),
}))

vi.mock('../../../server/utils/nimbleVendorAddresses', () => ({
  listVendorAddresses: (...args: unknown[]) => mockListVendorAddresses(...args),
  createVendorAddress: (...args: unknown[]) => mockCreateVendorAddress(...args),
  updateVendorAddress: (...args: unknown[]) => mockUpdateVendorAddress(...args),
  softDeleteVendorAddress: (...args: unknown[]) => mockSoftDeleteVendorAddress(...args),
  parseVendorAddressBody: (...args: unknown[]) => mockParseVendorAddressBody(...args),
}))

vi.mock('../../../server/utils/use-auth', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}))

const vendorId = 'a156fef05bbc45a24c33abe8e750147b0000'
const sampleAddress = {
  vendor_address_id: 42,
  vendor_id: vendorId,
  address_line_1: '123 Main',
  status: 1,
  status_label: 'active',
}

describe('nimble-vendor-addresses API handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockReturnValue({ session: { userID: 'user-hex-0000' } })
    mockGetNimbleVendor.mockResolvedValue({ vendor_id: vendorId })
    mockReadBody.mockResolvedValue({})
    mockGetRouterParam.mockImplementation((_: unknown, name: string) => {
      if (name === 'id') return vendorId
      if (name === 'addressLinkId') return '42'
      return undefined
    })
  })

  it('GET lists addresses for vendor', async () => {
    mockListVendorAddresses.mockResolvedValue([sampleAddress])
    const { default: handler } = await import('../../../server/api/nimble-vendors/[id]/addresses/index.get')

    const result = await handler({})
    expect(mockListVendorAddresses).toHaveBeenCalledWith(vendorId)
    expect(result).toEqual({ success: true, addresses: [sampleAddress] })
  })

  it('POST creates address', async () => {
    mockParseVendorAddressBody.mockReturnValue({ name: 'HQ' })
    mockCreateVendorAddress.mockResolvedValue(sampleAddress)
    const { default: handler } = await import('../../../server/api/nimble-vendors/[id]/addresses/index.post')

    const result = await handler({})
    expect(mockCreateVendorAddress).toHaveBeenCalledWith(vendorId, { name: 'HQ' })
    expect(result).toMatchObject({ success: true, message: 'Address created successfully' })
  })

  it('PUT updates address', async () => {
    mockParseVendorAddressBody.mockReturnValue({ city: 'Dallas' })
    mockUpdateVendorAddress.mockResolvedValue(sampleAddress)
    const { default: handler } = await import('../../../server/api/nimble-vendors/[id]/addresses/[addressLinkId].put')

    const result = await handler({})
    expect(mockUpdateVendorAddress).toHaveBeenCalledWith(vendorId, 42, { city: 'Dallas' })
    expect(result).toMatchObject({ success: true })
  })

  it('DELETE soft-deletes address', async () => {
    mockSoftDeleteVendorAddress.mockResolvedValue({ ...sampleAddress, status: 0 })
    const { default: handler } = await import('../../../server/api/nimble-vendors/[id]/addresses/[addressLinkId].delete')

    const result = await handler({})
    expect(mockSoftDeleteVendorAddress).toHaveBeenCalledWith(vendorId, 42)
    expect(result).toMatchObject({ success: true })
  })
})
