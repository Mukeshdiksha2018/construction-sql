import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEvent } from 'h3'

const mockResolveBearer = vi.fn()
const mockFetch = vi.fn()

vi.stubGlobal('$fetch', mockFetch)
vi.stubGlobal('useRuntimeConfig', () => ({
  nimbleApiBaseUrl: 'https://api5.example.com',
}))

vi.mock('../../../server/utils/nimbleBearer', () => ({
  resolveNimbleBearerForEvent: (event: unknown) => mockResolveBearer(event),
}))

describe('enrichPoItemsWithUomLabels', () => {
  const event = createEvent({ method: 'GET', url: '/api/purchase-order-items' })

  beforeEach(() => {
    vi.clearAllMocks()
    mockResolveBearer.mockReturnValue('bearer-token')
    mockFetch.mockResolvedValue({
      UOMDTO: [
        { ID: '413243374331364345353639423142393541', ShortName: 'EA', UOMName: 'Each', Status: 1 },
        { ID: '4868E24EAAF71EB84D3EAA14FD60077D0000', ShortName: 'KG', UOMName: 'Kilogram', Status: 1 },
      ],
    })
  })

  async function loadEnricher() {
    vi.resetModules()
    const { enrichPoItemsWithUomLabels } = await import('../../../server/utils/enrichPoItemsUom')
    return enrichPoItemsWithUomLabels
  }

  it('fills empty unit_label from Nimble UOM catalog', async () => {
    const enrich = await loadEnricher()
    const items = [
      { item_name: 'Widget', unit_uuid: '413243374331364345353639423142393541', unit_label: '' },
    ]
    const result = await enrich(items, event)

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api5.example.com/v1/UOM/List',
      expect.objectContaining({
        headers: { Authorization: 'Bearer bearer-token' },
      }),
    )
    expect(result[0].unit_label).toBe('EA')
    expect(result[0].uom).toBe('EA')
  })

  it('leaves items unchanged when unit_label is already set', async () => {
    const enrich = await loadEnricher()
    const items = [{ item_name: 'Widget', unit_uuid: 'x', unit_label: 'BOX' }]
    const result = await enrich(items, event)

    expect(mockFetch).not.toHaveBeenCalled()
    expect(result[0].unit_label).toBe('BOX')
  })

  it('returns items unchanged when no bearer token', async () => {
    mockResolveBearer.mockReturnValue(null)
    const enrich = await loadEnricher()
    const items = [{ item_name: 'Widget', unit_uuid: '413243374331364345353639423142393541', unit_label: '' }]
    const result = await enrich(items, event)

    expect(mockFetch).not.toHaveBeenCalled()
    expect(result[0].unit_label).toBe('')
  })
})
