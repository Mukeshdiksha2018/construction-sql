import { describe, expect, it } from 'vitest'
import {
  mapLocationRow,
  parseLocationBody,
  parseLocationUpdateBody,
} from '../../../server/utils/location'

describe('location utilities', () => {
  it('maps MSSQL row to API location shape', () => {
    const location = mapLocationRow({
      id: 1n,
      uuid: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
      location_name: 'Main Warehouse',
      location_code: 'WH-01',
      description: 'Primary storage',
      active: true,
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      updated_at: new Date('2026-01-02T00:00:00.000Z'),
      created_by: 'user-1',
      updated_by: 'user-1',
    })

    expect(location.uuid).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
    expect(location.location_name).toBe('Main Warehouse')
    expect(location.location_code).toBe('WH-01')
    expect(location.active).toBe(true)
  })

  it('validates create body', () => {
    expect(parseLocationBody({ location_name: 'Yard', location_code: 'YD-1', description: 'Open', active: true })).toEqual({
      location_name: 'Yard',
      location_code: 'YD-1',
      description: 'Open',
      active: true,
    })
  })

  it('rejects create body without location_name', () => {
    expect(() => parseLocationBody({ location_name: '  ' })).toThrowError(/Location Name is required/)
  })

  it('validates update body requires boolean active', () => {
    expect(() => parseLocationUpdateBody({ location_name: 'Office', active: 'yes' })).toThrowError(/boolean/)
    expect(parseLocationUpdateBody({ location_name: 'Office', active: false })).toEqual({
      location_name: 'Office',
      location_code: null,
      description: null,
      active: false,
    })
  })
})
