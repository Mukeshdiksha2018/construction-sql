import { describe, expect, it } from 'vitest'
import {
  mapFreightRow,
  parseFreightBody,
  parseFreightUpdateBody,
} from '../../../server/utils/freight'

describe('freight utilities', () => {
  it('maps MSSQL row to API freight shape', () => {
    const freight = mapFreightRow({
      id: 1,
      uuid: 'A1B2C3D4-E5F6-7890-ABCD-EF1234567890',
      freight_name: 'FedEx',
      description: 'Express',
      active: 1,
      created_at: new Date('2026-01-01T00:00:00.000Z'),
      updated_at: new Date('2026-01-02T00:00:00.000Z'),
      created_by: 'user-1',
      updated_by: 'user-1',
    })

    expect(freight.uuid).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
    expect(freight.freight_name).toBe('FedEx')
    expect(freight.active).toBe(true)
  })

  it('validates create body', () => {
    expect(parseFreightBody({ freight_name: 'UPS', description: 'Ground', active: true })).toEqual({
      freight_name: 'UPS',
      description: 'Ground',
      active: true,
    })
  })

  it('rejects create body without freight_name', () => {
    expect(() => parseFreightBody({ freight_name: '  ' })).toThrowError(/Freight name is required/)
  })

  it('validates update body requires boolean active', () => {
    expect(() => parseFreightUpdateBody({ freight_name: 'DHL', active: 'yes' })).toThrowError(/boolean/)
    expect(parseFreightUpdateBody({ freight_name: 'DHL', active: false })).toEqual({
      freight_name: 'DHL',
      description: null,
      active: false,
    })
  })
})
