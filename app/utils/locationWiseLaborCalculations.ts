/**
 * Location-wise labor calculation helpers.
 * Used by EstimateLineItemsTable for row mode, row amount, total, and mutual exclusion.
 */

export type LocationWiseRowMode = 'area' | 'room' | 'hourly' | ''

export interface LocationWiseLaborRow {
  breakdown_uuid?: string
  location_uuid: string
  area_sq_ft?: string | number | null
  no_of_rooms?: string | number | null
  num_hours?: string | number | null
  amount_per_sqft?: number | string
  amount_per_room?: number | string
  hourly_wage?: number | string
  /** Manual amount per location (when labor mode is manual + location-wise) */
  manual_amount?: number | string
}

function parseNum(v: any): number {
  if (v === '' || v === null || v === undefined) return 0
  const n = parseFloat(String(v))
  return Number.isNaN(n) ? 0 : n
}

/**
 * Which base (area, room, hours) has a value for this row.
 * Priority: area > room > hourly.
 */
export function getLocationWiseRowMode(row: LocationWiseLaborRow): LocationWiseRowMode {
  const area = parseNum(row.area_sq_ft)
  const rooms = parseNum(row.no_of_rooms)
  const hours = parseNum(row.num_hours)
  if (area > 0) return 'area'
  if (rooms > 0) return 'room'
  if (hours > 0) return 'hourly'
  return ''
}

/**
 * Row amount = base × rate. Uses first matching pair: area×amtPerSqft, rooms×amtPerRoom, or hours×wage.
 */
export function getLocationWiseRowAmount(row: LocationWiseLaborRow): number {
  const area = parseNum(row.area_sq_ft)
  const rooms = parseNum(row.no_of_rooms)
  const hours = parseNum(row.num_hours)
  const amtPerSqft = parseNum(row.amount_per_sqft)
  const amtPerRoom = parseNum(row.amount_per_room)
  const wage = parseNum(row.hourly_wage)
  if (area > 0 && amtPerSqft > 0) return area * amtPerSqft
  if (rooms > 0 && amtPerRoom > 0) return rooms * amtPerRoom
  if (hours > 0 && wage > 0) return hours * wage
  return 0
}

/**
 * Row amount when using a fixed mode. Only uses the specified base×rate pair, or manual_amount for manual mode.
 */
export function getLocationWiseRowAmountForMode(
  row: LocationWiseLaborRow,
  mode: 'area' | 'room' | 'hourly' | 'manual',
): number {
  if (mode === 'manual') {
    return parseNum(row.manual_amount)
  }
  if (mode === 'area') {
    const area = parseNum(row.area_sq_ft)
    const amtPerSqft = parseNum(row.amount_per_sqft)
    return area * amtPerSqft
  }
  if (mode === 'room') {
    const rooms = parseNum(row.no_of_rooms)
    const amtPerRoom = parseNum(row.amount_per_room)
    return rooms * amtPerRoom
  }
  if (mode === 'hourly') {
    const hours = parseNum(row.num_hours)
    const wage = parseNum(row.hourly_wage)
    return hours * wage
  }
  return 0
}

/**
 * Total labor amount = sum of all row amounts.
 */
export function getLocationWiseTotalAmount(rows: LocationWiseLaborRow[]): number {
  return rows.reduce((sum, r) => sum + getLocationWiseRowAmount(r), 0)
}

/**
 * Total labor amount when using a fixed mode for all rows.
 */
export function getLocationWiseTotalAmountForMode(
  rows: LocationWiseLaborRow[],
  mode: 'area' | 'room' | 'hourly' | 'manual',
): number {
  return rows.reduce((sum, r) => sum + getLocationWiseRowAmountForMode(r, mode), 0)
}

export type LocationWiseField =
  | 'area_sq_ft'
  | 'no_of_rooms'
  | 'num_hours'
  | 'amount_per_sqft'
  | 'amount_per_room'
  | 'hourly_wage'

function hasValue(v: any): boolean {
  return v !== '' && v !== null && v !== undefined && parseNum(v) > 0
}

/**
 * Apply a field update with mutual exclusion: when a base field gets a value,
 * clear the other base fields and their rates. Returns a new row object.
 */
export function applyLocationWiseFieldUpdate(
  row: LocationWiseLaborRow,
  field: LocationWiseField,
  value: any,
): LocationWiseLaborRow {
  const next = { ...row, [field]: value }
  if (!hasValue(value)) return next
  if (field === 'area_sq_ft') {
    next.no_of_rooms = ''
    next.num_hours = ''
    next.amount_per_room = ''
    next.hourly_wage = ''
  }
  else if (field === 'no_of_rooms') {
    next.area_sq_ft = ''
    next.num_hours = ''
    next.amount_per_sqft = ''
    next.hourly_wage = ''
  }
  else if (field === 'num_hours') {
    next.area_sq_ft = ''
    next.no_of_rooms = ''
    next.amount_per_sqft = ''
    next.amount_per_room = ''
  }
  return next
}
