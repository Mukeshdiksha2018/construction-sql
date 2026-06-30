import { describe, expect, it } from 'vitest'
import {
  aggregateVendorCurrencyAmounts,
  aggregateBreakoutCurrencyAmounts,
  aggregateVendorPoAmount,
  formatReportBreakoutAggregateForExport,
  formatReportPoAmountForExport,
  formatReportVendorCurrencyAggregateForExport,
  formatReportVendorPoAmountForExport,
  getOrderCurrencyFields,
  showOrderDualCurrency,
  sumVendorCurrencyAggregates,
} from '~/utils/reportPoCurrencyDisplay'

describe('reportPoCurrencyDisplay', () => {
  describe('getOrderCurrencyFields', () => {
    it('normalizes missing fields to defaults', () => {
      expect(getOrderCurrencyFields({})).toEqual({
        currency_conversion_enabled: false,
        currency_from: 'CAD',
        currency_to: 'USD',
        conversion_rate: 1,
      })
    })

    it('normalizes enabled conversion with invalid duplicate currencies', () => {
      expect(
        getOrderCurrencyFields({
          currency_conversion_enabled: true,
          currency_from: 'USD',
          currency_to: 'USD',
          conversion_rate: 1.25,
        }),
      ).toEqual({
        currency_conversion_enabled: true,
        currency_from: 'USD',
        currency_to: 'CAD',
        conversion_rate: 1.25,
      })
    })
  })

  describe('showOrderDualCurrency', () => {
    it('returns false when conversion is disabled', () => {
      expect(showOrderDualCurrency({ currency_conversion_enabled: false })).toBe(false)
      expect(showOrderDualCurrency({})).toBe(false)
    })

    it('returns true only for strict boolean true', () => {
      expect(showOrderDualCurrency({ currency_conversion_enabled: true })).toBe(true)
      expect(showOrderDualCurrency({ currency_conversion_enabled: 'true' as any })).toBe(false)
      expect(showOrderDualCurrency({ currency_conversion_enabled: 1 as any })).toBe(false)
    })
  })

  describe('formatReportPoAmountForExport', () => {
    it('exports numeric amount when conversion is disabled', () => {
      expect(formatReportPoAmountForExport(100, { currency_conversion_enabled: false })).toBe(100)
      expect(formatReportPoAmountForExport(0, { currency_conversion_enabled: false })).toBe(0)
    })

    it('exports zero as numeric when conversion is disabled', () => {
      expect(formatReportPoAmountForExport(null, { currency_conversion_enabled: false })).toBe(0)
      expect(formatReportPoAmountForExport(undefined, { currency_conversion_enabled: false })).toBe(0)
    })

    it('exports dual formatted string when conversion is enabled', () => {
      const result = formatReportPoAmountForExport(100, {
        currency_conversion_enabled: true,
        currency_from: 'CAD',
        currency_to: 'USD',
        conversion_rate: 1.35,
      })
      expect(result).toBe('$100.00 / $135.00')
    })

    it('exports dual formatted string for USD to CAD conversion', () => {
      const result = formatReportPoAmountForExport(200, {
        currency_conversion_enabled: true,
        currency_from: 'USD',
        currency_to: 'CAD',
        conversion_rate: 1.5,
      })
      expect(result).toBe('$300.00 / $200.00')
    })

    it('rounds converted export values to two decimals', () => {
      const result = formatReportPoAmountForExport(10.125, {
        currency_conversion_enabled: true,
        currency_from: 'CAD',
        currency_to: 'USD',
        conversion_rate: 1.35,
      })
      expect(result).toBe('$10.13 / $13.68')
    })

    it('exports dual zero string when amount is null and conversion is enabled', () => {
      const result = formatReportPoAmountForExport(null, {
        currency_conversion_enabled: true,
        currency_from: 'CAD',
        currency_to: 'USD',
        conversion_rate: 1.35,
      })
      expect(result).toBe('$0.00 / $0.00')
    })
  })

  describe('aggregateVendorCurrencyAmounts', () => {
    it('sums CAD across all sources and USD only for converted USD documents', () => {
      expect(
        aggregateVendorCurrencyAmounts([
          {
            amount: 100,
            currency_conversion_enabled: true,
            currency_from: 'USD',
            currency_to: 'CAD',
            conversion_rate: 1.5,
          },
          {
            amount: 50,
            currency_conversion_enabled: false,
            currency_from: 'CAD',
            currency_to: 'USD',
            conversion_rate: 1,
          },
        ]),
      ).toEqual({
        cadTotal: 200,
        usdFromTotal: 100,
        showDual: true,
      })
    })
  })

  describe('sumVendorCurrencyAggregates', () => {
    it('combines vendor aggregates and preserves dual display when any vendor has USD conversion', () => {
      expect(
        sumVendorCurrencyAggregates([
          { cadTotal: 100, usdFromTotal: 50, showDual: true },
          { cadTotal: 25, usdFromTotal: 0, showDual: false },
        ]),
      ).toEqual({
        cadTotal: 125,
        usdFromTotal: 50,
        showDual: true,
      })
    })
  })

  describe('formatReportVendorCurrencyAggregateForExport', () => {
    it('exports numeric CAD total when dual display is off', () => {
      expect(
        formatReportVendorCurrencyAggregateForExport({
          cadTotal: 125,
          usdFromTotal: 0,
          showDual: false,
        }),
      ).toBe(125)
    })

    it('exports dual formatted string when dual display is on', () => {
      expect(
        formatReportVendorCurrencyAggregateForExport({
          cadTotal: 200,
          usdFromTotal: 100,
          showDual: true,
        }),
      ).toBe('$200.00 / $100.00')
    })
  })

  describe('aggregateBreakoutCurrencyAmounts', () => {
    it('aggregates amounts across multiple PO/CO rows with mixed conversion', () => {
      expect(
        aggregateBreakoutCurrencyAmounts([
          {
            row: {
              currency_conversion_enabled: true,
              currency_from: 'USD',
              currency_to: 'CAD',
              conversion_rate: 1.5,
            },
            amount: 100,
          },
          {
            row: { currency_conversion_enabled: false },
            amount: 50,
          },
        ]),
      ).toEqual({
        cadTotal: 200,
        usdFromTotal: 100,
        showDual: true,
      })
    })
  })

  describe('formatReportBreakoutAggregateForExport', () => {
    it('exports dual formatted string for mixed breakout totals', () => {
      expect(
        formatReportBreakoutAggregateForExport([
          {
            row: {
              currency_conversion_enabled: true,
              currency_from: 'USD',
              currency_to: 'CAD',
              conversion_rate: 2,
            },
            amount: 50,
          },
        ]),
      ).toBe('$100.00 / $50.00')
    })
  })

  describe('aggregateVendorPoAmount', () => {
    const usdOrder = {
      currency_conversion_enabled: true,
      currency_from: 'USD',
      currency_to: 'CAD',
      conversion_rate: 1.5,
      goods_amount: 100,
      po_total: 100,
    }
    const cadOrder = {
      currency_conversion_enabled: false,
      currency_from: 'CAD',
      currency_to: 'USD',
      conversion_rate: 1,
      goods_amount: 50,
      po_total: 50,
    }

    it('sums CAD across all orders and USD only for converted USD orders', () => {
      expect(aggregateVendorPoAmount([usdOrder, cadOrder], 'goods_amount')).toEqual({
        cadTotal: 200,
        usdFromTotal: 100,
        showDual: true,
      })
    })

    it('returns single-currency aggregate when no USD conversion orders exist', () => {
      expect(aggregateVendorPoAmount([cadOrder], 'goods_amount')).toEqual({
        cadTotal: 50,
        usdFromTotal: 0,
        showDual: false,
      })
    })
  })

  describe('formatReportVendorPoAmountForExport', () => {
    it('exports dual vendor totals for mixed USD conversion groups', () => {
      const result = formatReportVendorPoAmountForExport(
        [
          {
            currency_conversion_enabled: true,
            currency_from: 'USD',
            currency_to: 'CAD',
            conversion_rate: 1.5,
            po_total: 100,
          },
          {
            currency_conversion_enabled: false,
            po_total: 50,
          },
        ],
        'po_total',
      )
      expect(result).toBe('$200.00 / $100.00')
    })

    it('exports numeric CAD total when vendor has no USD conversion orders', () => {
      expect(
        formatReportVendorPoAmountForExport(
          [{ currency_conversion_enabled: false, po_total: 125 }],
          'po_total',
        ),
      ).toBe(125)
    })
  })
})
