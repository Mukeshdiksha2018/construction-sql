import type { Corporation } from '~/stores/corporations'
import type { NimbleCorporationRaw } from '../../server/utils/nimble-corporations'

export function makeCorporation(overrides: Partial<Corporation> = {}): Corporation {
  return {
    id: 'corp-1',
    profitCenterId: null,
    name: 'Corp One',
    legalName: 'Corp One Legal',
    sortOrder: 1,
    propertyType: 1,
    strId: 0,
    ...overrides,
  }
}

export function makeNimbleCorporationRaw(
  overrides: Partial<NimbleCorporationRaw> = {},
): NimbleCorporationRaw {
  return {
    ID: 'corp-1',
    ProfitCenterID: null,
    Name: 'Corp One',
    LegalName: 'Corp One Legal',
    SortOrder: 1,
    PropertyType: 1,
    STRID: 0,
    ...overrides,
  }
}

export function mockCorporationsApiResponse(corporations: Corporation[] = [makeCorporation()]) {
  return { corporations }
}
