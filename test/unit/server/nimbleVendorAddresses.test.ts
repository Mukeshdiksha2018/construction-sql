import { createError } from 'h3'
import { describe, expect, it, vi } from 'vitest'
import { parseVendorAddressBody } from '../../../server/utils/nimbleVendorAddresses'

vi.stubGlobal('createError', createError)

describe('nimbleVendorAddresses utilities', () => {
  it('parses address body with contact and location fields', () => {
    expect(parseVendorAddressBody({
      name: 'John Doe',
      address: '123 Main St',
      city: 'Austin',
      country_id: 1,
      state_id: 44,
      zip_code: '78701',
      address_type: 1,
      mobile_num: '555-0100',
      is_default: true,
      is_active: true,
    })).toEqual({
      name: 'John Doe',
      address: '123 Main St',
      address_line_2: null,
      city: 'Austin',
      country_id: 1,
      state_id: 44,
      zip_code: '78701',
      business_type_id: null,
      address_type: 1,
      mobile_num: '555-0100',
      alternative_num: null,
      work_num: null,
      fax_num: null,
      email: null,
      website: null,
      is_default: true,
      is_active: true,
    })
  })

  it('defaults is_active to true when omitted', () => {
    const parsed = parseVendorAddressBody({ name: 'X' })
    expect(parsed.is_active).toBe(true)
  })

  it('maps is_active false from zero', () => {
    const parsed = parseVendorAddressBody({ is_active: 0 })
    expect(parsed.is_active).toBe(false)
  })

  it('rejects missing body', () => {
    expect(() => parseVendorAddressBody(null)).toThrow(/Request body is required/)
  })
})
