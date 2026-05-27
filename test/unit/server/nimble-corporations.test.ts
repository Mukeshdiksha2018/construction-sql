import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchNimbleCorporations,
  mapNimbleCorporation,
  mapNimbleCorporationsResponse,
} from '../../../server/utils/nimble-corporations'
import { makeNimbleCorporationRaw } from '../../helpers/corporations'

describe('nimble-corporations utilities', () => {
  describe('mapNimbleCorporation', () => {
    it('maps Nimble corporation fields', () => {
      const corp = mapNimbleCorporation(makeNimbleCorporationRaw({
        ID: 'ABC123',
        Name: 'Test Corp',
        LegalName: 'Test Legal',
        SortOrder: 2,
      }))

      expect(corp).toEqual({
        id: 'ABC123',
        profitCenterId: null,
        name: 'Test Corp',
        legalName: 'Test Legal',
        sortOrder: 2,
        propertyType: 1,
        strId: 0,
      })
    })

    it('returns null when ID is missing or whitespace', () => {
      expect(mapNimbleCorporation(makeNimbleCorporationRaw({ ID: '' }))).toBeNull()
      expect(mapNimbleCorporation(makeNimbleCorporationRaw({ ID: '   ' }))).toBeNull()
    })

    it('trims string fields from Nimble payload', () => {
      const corp = mapNimbleCorporation(makeNimbleCorporationRaw({
        ID: '  trimmed-id  ',
        Name: '  Name  ',
        LegalName: '  Legal  ',
      }))

      expect(corp?.id).toBe('trimmed-id')
      expect(corp?.name).toBe('Name')
      expect(corp?.legalName).toBe('Legal')
    })

    it('preserves profitCenterID when provided', () => {
      const corp = mapNimbleCorporation(makeNimbleCorporationRaw({
        ProfitCenterID: 'pc-1',
      }))
      expect(corp?.profitCenterId).toBe('pc-1')
    })
  })

  describe('mapNimbleCorporationsResponse', () => {
    it('returns empty array when Corporations is missing', () => {
      expect(mapNimbleCorporationsResponse({})).toEqual([])
      expect(mapNimbleCorporationsResponse({ Corporations: undefined })).toEqual([])
    })

    it('dedupes corporations by ID keeping the first occurrence', () => {
      const list = mapNimbleCorporationsResponse({
        Corporations: [
          makeNimbleCorporationRaw({ ID: 'B', Name: 'B Corp', SortOrder: 5 }),
          makeNimbleCorporationRaw({ ID: 'B', Name: 'Duplicate', SortOrder: 5 }),
          makeNimbleCorporationRaw({ ID: 'A', Name: 'A Corp', SortOrder: 1 }),
        ],
      })

      expect(list.map(c => c.id)).toEqual(['A', 'B'])
      expect(list.find(c => c.id === 'B')?.name).toBe('B Corp')
    })

    it('sorts by sortOrder then name', () => {
      const list = mapNimbleCorporationsResponse({
        Corporations: [
          makeNimbleCorporationRaw({ ID: '2', Name: 'Zebra', SortOrder: 2 }),
          makeNimbleCorporationRaw({ ID: '3', Name: 'Alpha', SortOrder: 2 }),
          makeNimbleCorporationRaw({ ID: '1', Name: 'First', SortOrder: 1 }),
        ],
      })

      expect(list.map(c => c.id)).toEqual(['1', '3', '2'])
    })

    it('skips entries with invalid IDs', () => {
      const list = mapNimbleCorporationsResponse({
        Corporations: [
          makeNimbleCorporationRaw({ ID: '' }),
          makeNimbleCorporationRaw({ ID: 'valid' }),
        ],
      })

      expect(list).toHaveLength(1)
      expect(list[0]?.id).toBe('valid')
    })
  })

  describe('fetchNimbleCorporations', () => {
    let mockFetch: ReturnType<typeof vi.fn>

    beforeEach(() => {
      mockFetch = vi.fn()
      vi.stubGlobal('$fetch', mockFetch)
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('calls Nimble API with Bearer token and IsShowAll query', async () => {
      mockFetch.mockResolvedValue({
        Corporations: [makeNimbleCorporationRaw({ ID: 'c1', Name: 'One' })],
      })

      const result = await fetchNimbleCorporations(
        'https://qa-api5.nimbleproperty.net/',
        'secret-token',
        false,
      )

      expect(mockFetch).toHaveBeenCalledWith(
        'https://qa-api5.nimbleproperty.net/v1/corporations?IsShowAll=false',
        {
          method: 'GET',
          headers: {
            Authorization: 'Bearer secret-token',
            'Content-Type': 'application/json',
          },
        },
      )
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe('c1')
    })

    it('requests all client corporations when isShowAll is true', async () => {
      mockFetch.mockResolvedValue({ Corporations: [] })

      await fetchNimbleCorporations(
        'https://qa-api5.nimbleproperty.net',
        'token',
        true,
      )

      expect(mockFetch).toHaveBeenCalledWith(
        'https://qa-api5.nimbleproperty.net/v1/corporations?IsShowAll=true',
        expect.any(Object),
      )
    })
  })
})
