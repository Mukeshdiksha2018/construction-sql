export interface NimbleCorporationRaw {
  ID: string
  ProfitCenterID: string | null
  Name: string
  LegalName: string
  SortOrder: number
  PropertyType: number
  STRID: number
}

export interface NimbleCorporationsResponse {
  Corporations?: NimbleCorporationRaw[]
}

export interface Corporation {
  id: string
  profitCenterId: string | null
  name: string
  legalName: string
  sortOrder: number
  propertyType: number
  strId: number
}

export function mapNimbleCorporation(raw: NimbleCorporationRaw): Corporation | null {
  const id = String(raw.ID ?? '').trim()
  if (!id) return null

  return {
    id,
    profitCenterId: raw.ProfitCenterID ?? null,
    name: String(raw.Name ?? '').trim(),
    legalName: String(raw.LegalName ?? '').trim(),
    sortOrder: Number(raw.SortOrder ?? 0),
    propertyType: Number(raw.PropertyType ?? 0),
    strId: Number(raw.STRID ?? 0),
  }
}

export function mapNimbleCorporationsResponse(response: NimbleCorporationsResponse): Corporation[] {
  const deduped = new Map<string, Corporation>()

  for (const raw of response.Corporations ?? []) {
    const corp = mapNimbleCorporation(raw)
    if (corp && !deduped.has(corp.id)) {
      deduped.set(corp.id, corp)
    }
  }

  return Array.from(deduped.values()).sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.name.localeCompare(b.name)
  })
}

export async function fetchNimbleCorporations(
  baseUrl: string,
  token: string,
  isShowAll: boolean,
): Promise<Corporation[]> {
  const url = `${baseUrl.replace(/\/$/, '')}/v1/corporations?IsShowAll=${isShowAll}`

  const response = await $fetch<NimbleCorporationsResponse>(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  return mapNimbleCorporationsResponse(response)
}
