import { describe, expect, it } from 'vitest'
import {
  coerceVendorAddressType,
  getVendorAddressByType,
  normalizeVendorAddresses,
} from '../../../app/utils/vendorAddresses'

describe('vendorAddresses', () => {
  describe('coerceVendorAddressType', () => {
    it('maps Nimble numeric types', () => {
      expect(coerceVendorAddressType(0)).toBe('default')
      expect(coerceVendorAddressType(1)).toBe('source')
      expect(coerceVendorAddressType(2)).toBe('manufacturing')
    })

    it('maps string labels', () => {
      expect(coerceVendorAddressType('source')).toBe('source')
      expect(coerceVendorAddressType('MANUFACTURING')).toBe('manufacturing')
    })
  })

  describe('normalizeVendorAddresses', () => {
    it('places Nimble addressDetails rows by numeric addressType', () => {
      const addresses = normalizeVendorAddresses([
        { addressType: 1, address: '160 bedfor st', city: 'Boston', stateName: 'Louisiana' },
        { addressType: 2, address: '150 Hartewel ave', city: 'Boston', stateName: 'Louisiana' },
      ])

      const source = getVendorAddressByType(addresses, 'source')
      const manufacturing = getVendorAddressByType(addresses, 'manufacturing')

      expect(source.address).toBe('160 bedfor st')
      expect(manufacturing.address).toBe('150 Hartewel ave')
    })
  })
})
