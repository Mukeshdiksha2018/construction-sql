/**
 * Tests for PurchaseOrderPreview display helpers — freight UUID resolution,
 * location-wise material field normalization, and financial_breakdown amounts.
 */
import { describe, expect, it } from 'vitest'
import {
  getPoFinancialValue,
  looksLikeUuid,
  normalizeLocationWiseMaterialItems,
  resolveFreightDisplayLabel,
  resolveFreightUuidFromPo,
  resolveShipViaUuidFromPo,
} from '../../../app/utils/purchaseOrderPreviewDisplay'

const FREIGHT_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
const SHIP_VIA_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'

const SAMPLE_BREAKDOWN = {
  charges: {
    freight: { percentage: 5, amount: 50, taxable: true },
    packing: { percentage: 2, amount: 20, taxable: false },
    custom_duties: { percentage: 0, amount: 0, taxable: false },
    other: { percentage: 1, amount: 10, taxable: true },
  },
  sales_taxes: {
    sales_tax_1: { percentage: 8, amount: 86.4 },
    sales_tax_2: { percentage: 0, amount: 0 },
  },
  totals: {
    item_total: 1000,
    charges_total: 80,
    tax_total: 86.4,
    total_po_amount: 1166.4,
  },
}

describe('looksLikeUuid', () => {
  it('returns true for standard UUID', () => {
    expect(looksLikeUuid(FREIGHT_UUID)).toBe(true)
  })

  it('returns false for plain text freight name', () => {
    expect(looksLikeUuid('FedEx Ground')).toBe(false)
  })
})

describe('resolveFreightUuidFromPo', () => {
  it('prefers explicit freight_uuid', () => {
    expect(resolveFreightUuidFromPo({ freight_uuid: FREIGHT_UUID, freight: 'Legacy Name' })).toBe(FREIGHT_UUID)
  })

  it('reads UUID from freight column when freight_uuid is absent', () => {
    expect(resolveFreightUuidFromPo({ freight: FREIGHT_UUID })).toBe(FREIGHT_UUID)
  })

  it('returns empty when freight column holds a display name', () => {
    expect(resolveFreightUuidFromPo({ freight: 'FedEx Ground' })).toBe('')
  })
})

describe('resolveShipViaUuidFromPo', () => {
  it('prefers explicit ship_via_uuid', () => {
    expect(resolveShipViaUuidFromPo({ ship_via_uuid: SHIP_VIA_UUID, ship_via: 'DHL' })).toBe(SHIP_VIA_UUID)
  })

  it('reads UUID from ship_via column when ship_via_uuid is absent', () => {
    expect(resolveShipViaUuidFromPo({ ship_via: SHIP_VIA_UUID })).toBe(SHIP_VIA_UUID)
  })
})

describe('resolveFreightDisplayLabel', () => {
  const freightLookup = (uuid: string) =>
    uuid === FREIGHT_UUID ? { freight_name: 'FedEx Ground', description: null } : undefined

  const shipViaLookup = (uuid: string) =>
    uuid === SHIP_VIA_UUID ? { ship_via: 'DHL Express', description: null } : undefined

  it('resolves freight UUID stored in freight column to freight_name (post-fix behaviour)', () => {
    const label = resolveFreightDisplayLabel(
      { freight: FREIGHT_UUID },
      freightLookup,
      shipViaLookup,
    )
    expect(label).toBe('FedEx Ground')
  })

  it('resolves via freight_uuid field', () => {
    const label = resolveFreightDisplayLabel(
      { freight_uuid: FREIGHT_UUID },
      freightLookup,
      shipViaLookup,
    )
    expect(label).toBe('FedEx Ground')
  })

  it('does NOT show raw UUID when lookup misses (old broken behaviour)', () => {
    const label = resolveFreightDisplayLabel(
      { freight: FREIGHT_UUID },
      () => undefined,
      () => undefined,
    )
    expect(label).toBe('')
    expect(label).not.toBe(FREIGHT_UUID)
  })

  it('does NOT use ship_via field on freight record (old bug used freightRecord.ship_via)', () => {
    const badFreightLookup = () => ({ ship_via: 'Wrong Field' } as any)
    const label = resolveFreightDisplayLabel(
      { freight_uuid: FREIGHT_UUID },
      badFreightLookup,
      shipViaLookup,
    )
    expect(label).toBe('')
    expect(label).not.toBe('Wrong Field')
  })

  it('returns plain-text freight name when not a UUID', () => {
    const label = resolveFreightDisplayLabel(
      { freight: 'Manual Carrier' },
      freightLookup,
      shipViaLookup,
    )
    expect(label).toBe('Manual Carrier')
  })

  it('falls back to ship_via name when freight is empty', () => {
    const label = resolveFreightDisplayLabel(
      { ship_via: SHIP_VIA_UUID },
      freightLookup,
      shipViaLookup,
    )
    expect(label).toBe('DHL Express')
  })

  it('falls back to freight record description when name is empty', () => {
    const label = resolveFreightDisplayLabel(
      { freight_uuid: FREIGHT_UUID },
      () => ({ freight_name: '', description: 'Express delivery' }),
      shipViaLookup,
    )
    expect(label).toBe('Express delivery')
  })

  it('returns empty string for null PO', () => {
    expect(resolveFreightDisplayLabel(null, freightLookup, shipViaLookup)).toBe('')
  })
})

describe('normalizeLocationWiseMaterialItems', () => {
  const items = [{ uuid: 'lwm-1', po_amount: 100 }]

  it('reads location_wise_material (server field name)', () => {
    expect(normalizeLocationWiseMaterialItems({ location_wise_material: items })).toEqual(items)
  })

  it('falls back to po_location_wise_material_items (legacy field name)', () => {
    expect(normalizeLocationWiseMaterialItems({ po_location_wise_material_items: items })).toEqual(items)
  })

  it('prefers location_wise_material over legacy field', () => {
    const serverItems = [{ uuid: 'server' }]
    const legacyItems = [{ uuid: 'legacy' }]
    expect(
      normalizeLocationWiseMaterialItems({
        location_wise_material: serverItems,
        po_location_wise_material_items: legacyItems,
      }),
    ).toEqual(serverItems)
  })

  it('returns empty array when neither field is present', () => {
    expect(normalizeLocationWiseMaterialItems({})).toEqual([])
    expect(normalizeLocationWiseMaterialItems(null)).toEqual([])
  })
})

describe('getPoFinancialValue', () => {
  const po = {
    financial_breakdown: SAMPLE_BREAKDOWN,
    freight_charges_amount: 999,
    packing_charges_amount: 888,
    sales_tax_1_amount: 777,
    charges_total: 666,
    tax_total: 555,
    total_po_amount: 444,
  }

  it('reads charge amount from financial_breakdown.charges', () => {
    expect(getPoFinancialValue(po, 'charges.freight.amount', 'freight_charges_amount')).toBe(50)
  })

  it('reads sales tax from financial_breakdown.sales_taxes', () => {
    expect(getPoFinancialValue(po, 'sales_taxes.sales_tax_1.amount', 'sales_tax_1_amount')).toBe(86.4)
  })

  it('falls back to top-level field when breakdown path is missing', () => {
    const partial = { freight_charges_amount: 42 }
    expect(getPoFinancialValue(partial, 'charges.freight.amount', 'freight_charges_amount')).toBe(42)
  })

  it('returns 0 when PO is null', () => {
    expect(getPoFinancialValue(null, 'charges.freight.amount')).toBe(0)
  })

  it('prefers breakdown over stale top-level fallback', () => {
    expect(getPoFinancialValue(po, 'charges.freight.amount', 'freight_charges_amount')).toBe(50)
    expect(getPoFinancialValue(po, 'charges.freight.amount', 'freight_charges_amount')).not.toBe(999)
  })
})
