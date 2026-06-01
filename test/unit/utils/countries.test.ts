import { describe, expect, it } from 'vitest'
import {
  findCountryByCode,
  getCountrySelectOptions,
  getCurrencyFromCountryCode,
  isValidCountryCode,
  normalizeCountryCode,
  sanitizeCustomerCountry,
} from '~/utils/countries'

describe('countries utilities', () => {
  it('findCountryByCode returns US record', () => {
    const us = findCountryByCode('US')
    expect(us?.name).toBe('United States')
    expect(us?.currency).toBe('USD')
  })

  it('normalizeCountryCode accepts ISO codes and country names', () => {
    expect(normalizeCountryCode('us')).toBe('US')
    expect(normalizeCountryCode('United States')).toBe('US')
    expect(normalizeCountryCode('')).toBe('')
    expect(normalizeCountryCode('Not A Country')).toBe('')
  })

  it('sanitizeCustomerCountry allows empty when configured', () => {
    expect(sanitizeCustomerCountry('', { allowEmpty: true })).toBe('')
    expect(sanitizeCustomerCountry('CA', { allowEmpty: true })).toBe('CA')
  })

  it('sanitizeCustomerCountry throws on invalid non-empty input', () => {
    expect(() => sanitizeCustomerCountry('Atlantis')).toThrow(/Invalid customer_country/)
  })

  it('isValidCountryCode validates known codes', () => {
    expect(isValidCountryCode('GB')).toBe(true)
    expect(isValidCountryCode('ZZ')).toBe(false)
  })

  it('getCountrySelectOptions returns labeled options', () => {
    const options = getCountrySelectOptions()
    expect(options.length).toBeGreaterThan(50)
    expect(options[0]).toMatchObject({
      label: expect.any(String),
      value: expect.stringMatching(/^[A-Z]{2}$/),
    })
  })

  it('getCurrencyFromCountryCode returns currency for US', () => {
    expect(getCurrencyFromCountryCode('US')).toEqual({
      currency: 'USD',
      symbol: '$',
    })
    expect(getCurrencyFromCountryCode('XX')).toBeNull()
  })
})
