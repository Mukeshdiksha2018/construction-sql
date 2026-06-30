import { describe, it, expect } from 'vitest'
import {
  amountInPoToCurrency,
  applyPoCurrencyToVendorInvoiceLineItem,
  computeLaborBalanceToBeInvoicedForDisplay,
  convertPoCurrency,
  formatPoAmountColumnHeader,
  formatPoCurrency,
  formatPoCurrencyRateSummary,
  formatPoConversionRateDisplay,
  getOtherPoCurrency,
  invertPoConversionRate,
  normalizePoCurrencyConversionFields,
  normalizePoConversionRate,
  pickMoreRecentCurrencyConversion,
  pickMoreRecentVendorCurrencyFrom,
  roundPoConversionRate,
  roundPoCurrencyValue,
  sanitizePoConversionRateInput,
  syncPoCurrencyConversionForFromCurrency,
} from '~/utils/poCurrencyConversion'

describe('poCurrencyConversion', () => {
  it('rounds conversion rates to ten decimal places', () => {
    expect(roundPoConversionRate(1.12345678901)).toBe(1.123456789)
    expect(roundPoConversionRate('bad')).toBe(0)
    expect(sanitizePoConversionRateInput('1.12345678901')).toBe('1.1234567890')
    expect(formatPoConversionRateDisplay(1.35)).toBe('1.35')
    expect(formatPoConversionRateDisplay(1.350000000001)).toBe('1.35')
  })

  it('normalizes conversion rate with up to ten decimals', () => {
    expect(normalizePoConversionRate('1.12345678901')).toBe(1.123456789)
  })

  it('rounds to two decimal places', () => {
    expect(roundPoCurrencyValue(10.125)).toBe(10.13)
    expect(roundPoCurrencyValue('bad')).toBe(0)
  })

  it('formats CAD and USD amounts with $ only', () => {
    expect(formatPoCurrency(100, 'CAD')).toBe('$100.00')
    expect(formatPoCurrency(100, 'USD')).toBe('$100.00')
  })

  it('formatPoAmountColumnHeader appends currency code', () => {
    expect(formatPoAmountColumnHeader('Unit Price', 'USD')).toBe('Unit Price (USD)')
    expect(formatPoAmountColumnHeader('Total', 'CAD')).toBe('Total (CAD)')
  })

  it('converts from amount using rate', () => {
    expect(convertPoCurrency(100, 1.35)).toBe(135)
    expect(convertPoCurrency(50, 1)).toBe(50)
    expect(convertPoCurrency(50, -1)).toBe(0)
  })

  it('amountInPoToCurrency returns to-currency when conversion enabled', () => {
    expect(amountInPoToCurrency(100, { currency_conversion_enabled: false })).toBe(100)
    expect(
      amountInPoToCurrency(100, {
        currency_conversion_enabled: true,
        currency_from: 'USD',
        currency_to: 'CAD',
        conversion_rate: 1.35,
      }),
    ).toBe(135)
  })

  it('computeLaborBalanceToBeInvoicedForDisplay converts only PO total', () => {
    const order = {
      currency_conversion_enabled: true,
      currency_from: 'USD',
      currency_to: 'CAD',
      conversion_rate: 1.35,
    }
    expect(
      computeLaborBalanceToBeInvoicedForDisplay(order, {
        totalOrderValue: 10000,
        advancePaidNet: 200,
        invoicedValue: 4000,
        holdbackReleased: 0,
        holdbackBalanceToBeInvoiced: 100,
        fallbackBalance: 5000,
      }),
    ).toBe(9200)
    expect(
      computeLaborBalanceToBeInvoicedForDisplay(
        { currency_conversion_enabled: false },
        {
          totalOrderValue: 10000,
          advancePaidNet: 200,
          invoicedValue: 4000,
          holdbackReleased: 50,
          holdbackBalanceToBeInvoiced: 100,
          fallbackBalance: 9999,
        },
      ),
    ).toBe(5650)
    expect(
      computeLaborBalanceToBeInvoicedForDisplay(order, {
        totalOrderValue: 0,
        advancePaidNet: 0,
        invoicedValue: 0,
        holdbackReleased: 0,
        holdbackBalanceToBeInvoiced: 0,
        fallbackBalance: 5000,
      }),
    ).toBe(6750)
  })

  it('applyPoCurrencyToVendorInvoiceLineItem converts order line monetary fields', () => {
    const fields = {
      currency_conversion_enabled: true,
      currency_from: 'USD',
      currency_to: 'CAD',
      conversion_rate: 1.35,
    }
    expect(
      applyPoCurrencyToVendorInvoiceLineItem(
        { po_unit_price: 100, po_total: 200, invoice_unit_price: 50 },
        fields,
      ),
    ).toEqual({ po_unit_price: 135, po_total: 270, invoice_unit_price: 50 })
    expect(
      applyPoCurrencyToVendorInvoiceLineItem(
        { po_unit_price: 100, invoice_unit_price: 50 },
        fields,
        { convertInvoiceFields: true },
      ),
    ).toEqual({ po_unit_price: 135, invoice_unit_price: 67.5 })
  })

  it('inverts conversion rate safely', () => {
    expect(invertPoConversionRate(2)).toBe(0.5)
    expect(invertPoConversionRate(0)).toBe(1)
    expect(invertPoConversionRate(-1)).toBe(1)
  })

  it('returns the other supported currency', () => {
    expect(getOtherPoCurrency('CAD')).toBe('USD')
    expect(getOtherPoCurrency('USD')).toBe('CAD')
  })

  it('formats rate summary text', () => {
    expect(formatPoCurrencyRateSummary('CAD', 'USD', 1.35)).toBe(
      '1 CAD = 1.35 USD',
    )
  })

  it('normalizes persisted conversion fields with defaults', () => {
    expect(normalizePoCurrencyConversionFields({})).toEqual({
      currency_conversion_enabled: false,
      currency_from: 'CAD',
      currency_to: 'USD',
      conversion_rate: 1,
    })
  })

  it('normalizes enabled conversion from body', () => {
    expect(
      normalizePoCurrencyConversionFields({
        currency_conversion_enabled: true,
        currency_from: 'USD',
        currency_to: 'USD',
        conversion_rate: '1.25',
      }),
    ).toEqual({
      currency_conversion_enabled: true,
      currency_from: 'USD',
      currency_to: 'CAD',
      conversion_rate: 1.25,
    })
  })

  it('picks the more recently created PO or CO conversion settings', () => {
    expect(
      pickMoreRecentCurrencyConversion(
        {
          currency_from: 'CAD',
          currency_to: 'USD',
          conversion_rate: 1.2,
          created_at: '2026-01-01T00:00:00.000Z',
        },
        {
          currency_from: 'USD',
          currency_to: 'CAD',
          conversion_rate: 1.4,
          created_at: '2026-02-01T00:00:00.000Z',
        },
      ),
    ).toEqual({
      currency_conversion_enabled: true,
      currency_from: 'USD',
      currency_to: 'CAD',
      conversion_rate: 1.4,
    })
  })

  it('returns null when no recent conversion candidates exist', () => {
    expect(pickMoreRecentCurrencyConversion(null, null)).toBeNull()
  })

  it('syncs CAD from-currency with conversion disabled', () => {
    expect(syncPoCurrencyConversionForFromCurrency('CAD')).toEqual({
      currency_conversion_enabled: false,
      currency_from: 'CAD',
      currency_to: 'USD',
      conversion_rate: 1,
    })
  })

  it('syncs USD from-currency with conversion enabled to CAD', () => {
    expect(
      syncPoCurrencyConversionForFromCurrency('USD', { conversionRate: 1.33 }),
    ).toEqual({
      currency_conversion_enabled: true,
      currency_from: 'USD',
      currency_to: 'CAD',
      conversion_rate: 1.33,
    })
  })

  it('picks the more recent vendor currency_from between PO and CO', () => {
    expect(
      pickMoreRecentVendorCurrencyFrom(
        {
          currency_from: 'CAD',
          created_at: '2026-01-01T00:00:00.000Z',
        },
        {
          currency_from: 'USD',
          created_at: '2026-02-01T00:00:00.000Z',
        },
      ),
    ).toBe('USD')
  })

  it('returns null when no vendor currency candidates exist', () => {
    expect(pickMoreRecentVendorCurrencyFrom(null, null)).toBeNull()
  })
})
