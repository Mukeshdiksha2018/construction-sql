export interface LocationRecord {
  uuid?: string
  location_name?: string
  location_code?: string | null
  [key: string]: any
}

export interface LocationDuplicate {
  existing: LocationRecord
  field: 'location_name' | 'location_code'
}

export function findLocationDuplicate(
  locations: LocationRecord[],
  newLocation: { location_name: string; location_code?: string; excludeUuid?: string }
): LocationDuplicate | null {
  if (!locations || !locations.length) return null

  const candidateName = newLocation.location_name?.trim().toLowerCase()
  const candidateCode = newLocation.location_code?.trim().toLowerCase()

  for (const loc of locations) {
    if (newLocation.excludeUuid && loc.uuid === newLocation.excludeUuid) continue

    if (candidateName && loc.location_name?.trim().toLowerCase() === candidateName) {
      return { existing: loc, field: 'location_name' }
    }

    if (
      candidateCode &&
      loc.location_code &&
      loc.location_code.trim().toLowerCase() === candidateCode
    ) {
      return { existing: loc, field: 'location_code' }
    }
  }

  return null
}
