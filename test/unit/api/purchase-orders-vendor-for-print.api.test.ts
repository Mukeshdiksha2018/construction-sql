import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
vi.stubGlobal('createError', createError)
const mockGetQuery = vi.fn()
vi.stubGlobal('getQuery', mockGetQuery)

const mockResolveBearer = vi.fn()
const mockFetch = vi.fn()

vi.stubGlobal('$fetch', mockFetch)
vi.stubGlobal('useRuntimeConfig', () => ({ nimbleApi3Url: 'https://api3.example.com' }))

vi.mock('../../../server/utils/nimbleBearer', () => ({
  resolveNimbleBearerForEvent: () => mockResolveBearer(),
}))

function makeVendorRow(vendorID: string, addressType: number) {
  return {
    vendorID,
    vendorName: 'Vendor03',
    addressDetails: [
      {
        addressType,
        address: addressType === 1 ? '160 bedfor st' : '150 Hartewel ave',
        city: 'Boston',
        stateName: 'Louisiana',
        zipCode: '20589',
        countryName: 'USA',
      },
    ],
  }
}

describe('GET /api/purchase-orders/vendor-for-print', () => {
  const mockEvent = { path: '/api/purchase-orders/vendor-for-print' }

  beforeEach(() => {
    vi.clearAllMocks()
    mockResolveBearer.mockReturnValue('session-token')
    mockGetQuery.mockReturnValue({
      corporation_uuid: 'F6D03336024E34824725D3EE74FC4E420000',
      vendor_uuid: '50020674915937a34bc84c0dd63bc8c10000',
    })
    mockFetch.mockResolvedValue({
      vendorContractMasterList: [
        {
          vendorID: '50020674915937A34BC84C0DD63BC8C10000',
          vendorName: 'Vendor03',
          addressDetails: [
            {
              addressType: 1,
              address: '160 bedfor st',
              city: 'Boston',
              stateName: 'Louisiana',
              zipCode: '20589',
              countryName: 'USA',
            },
            {
              addressType: 2,
              address: '150 Hartewel ave',
              city: 'Boston',
              stateName: 'Louisiana',
              zipCode: '21568',
              countryName: 'USA',
            },
          ],
        },
      ],
    })
  })

  async function loadHandler() {
    vi.resetModules()
    const { default: handler } = await import('../../../server/api/purchase-orders/vendor-for-print.get')
    return handler as (event: unknown) => Promise<{ data: unknown }>
  }

  it('returns mapped vendor with source and manufacturing addresses', async () => {
    const handler = await loadHandler()
    const result = await handler(mockEvent)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api3.example.com/v1/VendorContractMaster/List',
      expect.objectContaining({
        query: { CorpID: 'F6D03336024E34824725D3EE74FC4E420000' },
        headers: expect.objectContaining({
          Authorization: 'Bearer session-token',
        }),
      }),
    )

    expect(result.data).toMatchObject({
      vendor_name: 'Vendor03',
      vendor_addresses: expect.any(Array),
    })

    const addresses = (result.data as { vendor_addresses: Array<{ addressType: string; address: string }> })
      .vendor_addresses
    const source = addresses.find((a) => a.addressType === 'source')
    const manufacturing = addresses.find((a) => a.addressType === 'manufacturing')
    expect(source?.address).toBe('160 bedfor st')
    expect(manufacturing?.address).toBe('150 Hartewel ave')
  })

  it('matches vendor uuid regardless of casing', async () => {
    mockGetQuery.mockReturnValue({
      corporation_uuid: 'corp-1',
      vendor_uuid: '50020674-9159-37a3-4bc8-4c0d-d63bc8c10000',
    })
    const handler = await loadHandler()
    const result = await handler(mockEvent)
    expect(result.data).not.toBeNull()
  })

  it('returns null when vendor is not in Nimble list', async () => {
    mockFetch.mockResolvedValue({
      vendorContractMasterList: [makeVendorRow('other-vendor-id', 1)],
    })
    const handler = await loadHandler()
    const result = await handler(mockEvent)
    expect(result.data).toBeNull()
  })

  it('returns null when no bearer token', async () => {
    mockResolveBearer.mockReturnValue(null)
    const handler = await loadHandler()
    const result = await handler(mockEvent)
    expect(result.data).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
