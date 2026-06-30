import { describe, it, expect } from 'vitest'
import { normalizePoCurrencyConversionFields } from '~/utils/poCurrencyConversion'

describe('change order currency normalization (shared util)', () => {
  it('normalizes CO create payload fields', () => {
    expect(
      normalizePoCurrencyConversionFields({
        currency_conversion_enabled: true,
        currency_from: 'CAD',
        currency_to: 'USD',
        conversion_rate: '1.5',
      }),
    ).toEqual({
      currency_conversion_enabled: true,
      currency_from: 'CAD',
      currency_to: 'USD',
      conversion_rate: 1.5,
    })
  })

  it('applies defaults for empty CO currency payload', () => {
    expect(normalizePoCurrencyConversionFields({})).toEqual({
      currency_conversion_enabled: false,
      currency_from: 'CAD',
      currency_to: 'USD',
      conversion_rate: 1,
    })
  })
})
