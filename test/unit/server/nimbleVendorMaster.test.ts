import { describe, expect, it } from 'vitest'
import {
  extractNimbleVendorContractList,
  mapNimbleAddressDetailsToVendorAddresses,
  mapNimbleVendorContractToPoVendor,
} from '../../../server/utils/nimbleVendorMaster'
import { getVendorAddressByType } from '../../../app/utils/vendorAddresses'

describe('nimbleVendorMaster', () => {
  it('extracts vendorContractMasterList from Nimble response', () => {
    const list = extractNimbleVendorContractList({
      vendorContractMasterList: [{ vendorID: 'abc', vendorName: 'Vendor A' }],
    })
    expect(list).toHaveLength(1)
    expect(list[0].vendorID).toBe('abc')
  })

  it('maps vendor row with source and manufacturing addresses', () => {
    const vendor = mapNimbleVendorContractToPoVendor({
      vendorID: '8EF8C36BD1FD169E4E708DF83658E6150000',
      vendorName: 'Vendor03',
      addressDetails: [
        { addressType: 2, address: '150 Hartewel ave', city: 'Boston', stateName: 'Louisiana', zipCode: '21568' },
        { addressType: 1, address: '160 bedfor st', city: 'Boston', stateName: 'Louisiana', zipCode: '20589' },
      ],
    })

    expect(vendor.uuid).toBe('8ef8c36bd1fd169e4e708df83658e6150000')
    expect(vendor.vendor_name).toBe('Vendor03')

    const source = getVendorAddressByType(vendor.vendor_addresses, 'source')
    const manufacturing = getVendorAddressByType(vendor.vendor_addresses, 'manufacturing')
    expect(source.address).toBe('160 bedfor st')
    expect(manufacturing.address).toBe('150 Hartewel ave')
  })

  it('maps addressDetails helper independently', () => {
    const addresses = mapNimbleAddressDetailsToVendorAddresses([
      { addressType: 1, address: 'Source st' },
    ])
    expect(getVendorAddressByType(addresses, 'source').address).toBe('Source st')
  })
})
