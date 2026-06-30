import { createError } from 'h3'
import { describe, expect, it, vi } from 'vitest'
import { parseNimbleVendorBody } from '../../../server/utils/nimbleVendors'

vi.stubGlobal('createError', createError)

describe('nimbleVendors utilities', () => {
  it('parses create body with required fields', () => {
    expect(parseNimbleVendorBody({
      corporation_uuid: 'f9ee2e0e535dbab140762a363e8f234f0000',
      vendor_name: 'Acme',
      company_name: 'Acme LLC',
      account_id: 'abc123',
      status: 1,
      credit_limit: 1000,
    })).toEqual({
      corporation_id: 'f9ee2e0e535dbab140762a363e8f234f0000',
      name: 'Acme',
      company_name: 'Acme LLC',
      account_id: 'abc123',
      status: 1,
      tax_id: null,
      contact_person_name: null,
      credit_limit: 1000,
      check_reference: null,
      federal_id: null,
      ssn: null,
      print_check_as: null,
      is_1099: false,
      credit_days_id: null,
    })
  })

  it('rejects missing vendor name', () => {
    expect(() => parseNimbleVendorBody({ corporation_id: 'corp' }))
      .toThrow(/Vendor name is required/)
  })

  it('rejects invalid credit limit', () => {
    expect(() => parseNimbleVendorBody({
      corporation_id: 'corp',
      name: 'X',
      credit_limit: 'not-a-number',
    })).toThrow(/Credit limit must be a number/)
  })

  it('defaults status to active', () => {
    const parsed = parseNimbleVendorBody({
      corporation_id: 'corp',
      name: 'X',
    })
    expect(parsed.status).toBe(1)
  })
})
