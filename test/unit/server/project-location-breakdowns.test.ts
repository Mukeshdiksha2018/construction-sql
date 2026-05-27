import { describe, expect, it } from 'vitest'
import { toBreakdownApiModel } from '../../../server/utils/projectLocationBreakdowns'

const baseRow = {
  id: 1,
  uuid: 'lb-uuid-1',
  project_uuid: 'proj-uuid-1',
  location_uuid: 'loc-uuid-1',
  area_sq_ft: '100.00',
  no_of_rooms: null,
  is_active: 1,
  created_at: new Date('2026-05-08T09:16:38.000Z'),
  updated_at: new Date('2026-05-08T09:16:38.000Z'),
}

describe('toBreakdownApiModel', () => {
  it('maps all fields correctly', () => {
    const model = toBreakdownApiModel(baseRow)

    expect(model.id).toBe(1)
    expect(model.uuid).toBe('lb-uuid-1')
    expect(model.project_uuid).toBe('proj-uuid-1')
    expect(model.location_uuid).toBe('loc-uuid-1')
    expect(model.area_sq_ft).toBe(100)
    expect(model.no_of_rooms).toBeNull()
    expect(model.is_active).toBe(true)
  })

  it('converts numeric string area_sq_ft to number', () => {
    const model = toBreakdownApiModel({ ...baseRow, area_sq_ft: '250.5' })
    expect(model.area_sq_ft).toBe(250.5)
  })

  it('maps no_of_rooms as number when present', () => {
    const model = toBreakdownApiModel({ ...baseRow, no_of_rooms: 5 })
    expect(model.no_of_rooms).toBe(5)
  })

  it('returns null for null numeric fields', () => {
    const model = toBreakdownApiModel({ ...baseRow, area_sq_ft: null, no_of_rooms: null })
    expect(model.area_sq_ft).toBeNull()
    expect(model.no_of_rooms).toBeNull()
  })

  it('converts bit values to booleans', () => {
    const active = toBreakdownApiModel({ ...baseRow, is_active: 1 })
    const inactive = toBreakdownApiModel({ ...baseRow, is_active: 0 })
    expect(active.is_active).toBe(true)
    expect(inactive.is_active).toBe(false)
  })

  it('converts Date to ISO string', () => {
    const model = toBreakdownApiModel(baseRow)
    expect(model.created_at).toBe('2026-05-08T09:16:38.000Z')
  })

  it('returns null for null dates', () => {
    const model = toBreakdownApiModel({ ...baseRow, created_at: null, updated_at: null })
    expect(model.created_at).toBeNull()
    expect(model.updated_at).toBeNull()
  })
})
