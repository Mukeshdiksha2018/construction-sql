import { describe, expect, it } from 'vitest'
import {
  mapNimbleCorporation,
  mapNimbleCorporationsResponse,
} from '../../../server/utils/nimble-corporations'

describe('nimble-corporations', () => {
  it('maps Nimble corporation fields', () => {
    const corp = mapNimbleCorporation({
      ID: 'ABC123',
      ProfitCenterID: null,
      Name: 'Test Corp',
      LegalName: 'Test Legal',
      SortOrder: 2,
      PropertyType: 1,
      STRID: 0,
    })

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

  it('dedupes and sorts corporations from API response', () => {
    const list = mapNimbleCorporationsResponse({
      Corporations: [
        {
          ID: 'B',
          ProfitCenterID: null,
          Name: 'B Corp',
          LegalName: 'B Corp',
          SortOrder: 5,
          PropertyType: 1,
          STRID: 0,
        },
        {
          ID: 'B',
          ProfitCenterID: null,
          Name: 'Duplicate',
          LegalName: 'Duplicate',
          SortOrder: 5,
          PropertyType: 1,
          STRID: 0,
        },
        {
          ID: 'A',
          ProfitCenterID: null,
          Name: 'A Corp',
          LegalName: 'A Corp',
          SortOrder: 1,
          PropertyType: 1,
          STRID: 0,
        },
      ],
    })

    expect(list.map(c => c.id)).toEqual(['A', 'B'])
  })
})
