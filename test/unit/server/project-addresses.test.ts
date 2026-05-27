import { describe, expect, it } from 'vitest'
import { toAddressApiModel } from '../../../server/utils/projectAddresses'

const baseRow = {
  id: 1,
  uuid: 'addr-uuid-1',
  project_uuid: 'proj-uuid-1',
  address_type: 'shipment',
  contact_person: 'John Miller',
  email: 'john@example.com',
  phone: '0456665',
  address_line_1: '742 Mission Street',
  address_line_2: null,
  city: 'San Francisco',
  state: 'California',
  zip_code: '94103',
  country: 'US',
  is_primary: 1,
  is_active: 1,
  copied_from_billing_address_uuid: null,
  created_at: new Date('2026-05-08T09:16:34.000Z'),
  updated_at: new Date('2026-05-08T09:16:34.000Z'),
}

describe('toAddressApiModel', () => {
  it('maps all fields correctly', () => {
    const model = toAddressApiModel(baseRow)

    expect(model.id).toBe(1)
    expect(model.uuid).toBe('addr-uuid-1')
    expect(model.project_uuid).toBe('proj-uuid-1')
    expect(model.address_type).toBe('shipment')
    expect(model.contact_person).toBe('John Miller')
    expect(model.email).toBe('john@example.com')
    expect(model.phone).toBe('0456665')
    expect(model.address_line_1).toBe('742 Mission Street')
    expect(model.city).toBe('San Francisco')
    expect(model.state).toBe('California')
    expect(model.zip_code).toBe('94103')
    expect(model.country).toBe('US')
  })

  it('converts bit values to booleans', () => {
    const model = toAddressApiModel(baseRow)
    expect(model.is_primary).toBe(true)
    expect(model.is_active).toBe(true)
  })

  it('maps false bit values correctly', () => {
    const model = toAddressApiModel({ ...baseRow, is_primary: 0, is_active: 0 })
    expect(model.is_primary).toBe(false)
    expect(model.is_active).toBe(false)
  })

  it('converts Date objects to ISO strings', () => {
    const model = toAddressApiModel(baseRow)
    expect(model.created_at).toBe('2026-05-08T09:16:34.000Z')
    expect(model.updated_at).toBe('2026-05-08T09:16:34.000Z')
  })

  it('returns null for empty nullable strings', () => {
    const model = toAddressApiModel({
      ...baseRow,
      contact_person: null,
      email: null,
      phone: null,
      address_line_2: null,
      copied_from_billing_address_uuid: null,
    })
    expect(model.contact_person).toBeNull()
    expect(model.email).toBeNull()
    expect(model.phone).toBeNull()
    expect(model.address_line_2).toBeNull()
    expect(model.copied_from_billing_address_uuid).toBeNull()
  })

  it('defaults id to 0 when missing', () => {
    const model = toAddressApiModel({ ...baseRow, id: undefined })
    expect(model.id).toBe(0)
  })
})
