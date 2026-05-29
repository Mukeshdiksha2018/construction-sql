/**
 * Client-side tests for freight selection and display logic in the PO module:
 *
 * FIX — onFreightModelUpdate in PurchaseOrderForm.vue was using rec?.ship_via
 * instead of rec?.freight_name, so the freight UUID was saved but the display
 * name was always empty.
 *
 * Also covers freightNameByUuid lookup used by PurchaseOrdersList.vue to resolve
 * stored freight UUIDs back to display names.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function makeFreightRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    freight_name: 'FedEx Ground',
    description: null,
    active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

/** Mirrors onFreightModelUpdate from PurchaseOrderForm.vue */
function applyFreightSelection(
  val: string | undefined,
  getFreightByUuid: (uuid: string) => { freight_name?: string; ship_via?: string } | undefined,
): { freight_uuid: string; freight: string } {
  if (val == null || val === '') {
    return { freight_uuid: '', freight: '' }
  }
  if (UUID_RE.test(val)) {
    const rec = getFreightByUuid(val)
    // Fixed: use freight_name, NOT ship_via
    return { freight_uuid: val, freight: rec?.freight_name || '' }
  }
  return { freight: val, freight_uuid: '' }
}

/** Mirrors freightNameByUuid computed from PurchaseOrdersList.vue */
function buildFreightNameMap(list: any[]): Record<string, string> {
  const map: Record<string, string> = {}
  list.forEach((f: any) => {
    if (f?.uuid) map[f.uuid] = f.freight_name || f.uuid
  })
  return map
}

async function getFreightStore() {
  const { useFreightStore } = await import('../../../app/stores/freight')
  return useFreightStore()
}

// ══════════════════════════════════════════════════════════════════════════════
// onFreightModelUpdate logic — freight_name vs ship_via bug
// ══════════════════════════════════════════════════════════════════════════════
describe('onFreightModelUpdate logic (PurchaseOrderForm.vue)', () => {
  it('sets freight_uuid and freight_name when a UUID is selected', () => {
    const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    const result = applyFreightSelection(uuid, (id) =>
      id === uuid ? makeFreightRecord() : undefined,
    )
    expect(result.freight_uuid).toBe(uuid)
    expect(result.freight).toBe('FedEx Ground')
  })

  it('does NOT use ship_via field from freight record (the old bug)', () => {
    const uuid = 'b2c3d4e5-f6a7-8901-bcde-f12345678901'
    // Simulate a record that has ship_via but NOT freight_name (wrong shape)
    const wrongRecord = { uuid, ship_via: 'Wrong Field Name' }
    const result = applyFreightSelection(uuid, () => wrongRecord as any)
    // freight_name is undefined → freight should be '' not 'Wrong Field Name'
    expect(result.freight).toBe('')
    expect(result.freight).not.toBe('Wrong Field Name')
  })

  it('clears both fields when selection is cleared', () => {
    const result = applyFreightSelection('', () => makeFreightRecord())
    expect(result).toEqual({ freight_uuid: '', freight: '' })
  })

  it('clears both fields when selection is undefined', () => {
    const result = applyFreightSelection(undefined, () => makeFreightRecord())
    expect(result).toEqual({ freight_uuid: '', freight: '' })
  })

  it('stores plain text and clears freight_uuid for non-UUID free-text entry', () => {
    const result = applyFreightSelection('Custom Carrier', () => undefined)
    expect(result).toEqual({ freight: 'Custom Carrier', freight_uuid: '' })
  })

  it('freight is empty string when UUID is selected but record not found in store', () => {
    const uuid = 'c3d4e5f6-a7b8-9012-cdef-123456789012'
    const result = applyFreightSelection(uuid, () => undefined)
    expect(result.freight_uuid).toBe(uuid)
    expect(result.freight).toBe('')
  })

  it('save payload should prefer freight_uuid over freight display name', () => {
    const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    const formState = applyFreightSelection(uuid, () => makeFreightRecord())
    // Server-side: freight_uuid || freight
    const storedValue = formState.freight_uuid || formState.freight
    expect(storedValue).toBe(uuid)
    expect(storedValue).not.toBe('FedEx Ground')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// freightNameByUuid lookup (PurchaseOrdersList.vue column display)
// ══════════════════════════════════════════════════════════════════════════════
describe('freightNameByUuid lookup logic (PurchaseOrdersList.vue)', () => {
  it('maps uuid → freight_name', () => {
    const map = buildFreightNameMap([
      makeFreightRecord({ uuid: 'fr-1', freight_name: 'FedEx Ground' }),
      makeFreightRecord({ uuid: 'fr-2', freight_name: 'UPS Overnight' }),
    ])
    expect(map['fr-1']).toBe('FedEx Ground')
    expect(map['fr-2']).toBe('UPS Overnight')
  })

  it('falls back to uuid when freight_name is empty', () => {
    const map = buildFreightNameMap([makeFreightRecord({ uuid: 'fr-empty', freight_name: '' })])
    expect(map['fr-empty']).toBe('fr-empty')
  })

  it('returns empty map when list is empty (degraded — shows raw UUID in column)', () => {
    const map = buildFreightNameMap([])
    const uuid = 'fr-uuid-fedex'
    const label = uuid ? (map[uuid] || uuid) : 'N/A'
    expect(label).toBe('fr-uuid-fedex')
  })

  it('column cell shows name when uuid is in map', () => {
    const map = buildFreightNameMap([makeFreightRecord({ uuid: 'fr-abc', freight_name: 'USPS Priority' })])
    const uuid = 'fr-abc'
    const label = uuid ? (map[uuid] || uuid) : 'N/A'
    expect(label).toBe('USPS Priority')
  })

  it('column cell shows N/A when uuid is null', () => {
    const map = buildFreightNameMap([makeFreightRecord()])
    const uuid = null
    const label = uuid ? (map[uuid] || uuid) : 'N/A'
    expect(label).toBe('N/A')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// useFreightStore — getFreightByUuid used by form select
// ══════════════════════════════════════════════════════════════════════════════
describe('useFreightStore – getFreightByUuid (form select resolution)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('getFreightByUuid returns record with freight_name field', async () => {
    mockFetch.mockResolvedValue({ data: [makeFreightRecord()] })
    const store = await getFreightStore()
    await store.fetchFreight()
    const rec = store.getFreightByUuid('a1b2c3d4-e5f6-7890-abcd-ef1234567890')
    expect(rec?.freight_name).toBe('FedEx Ground')
    expect((rec as any)?.ship_via).toBeUndefined()
  })

  it('getFreightByUuid returns undefined for unknown uuid', async () => {
    mockFetch.mockResolvedValue({ data: [] })
    const store = await getFreightStore()
    await store.fetchFreight()
    expect(store.getFreightByUuid('no-such-uuid')).toBeUndefined()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// financial_breakdown form hydration contract
// ══════════════════════════════════════════════════════════════════════════════
describe('financial_breakdown form hydration contract', () => {
  const savedBreakdown = {
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
    totals: { item_total: 1000, charges_total: 80, tax_total: 86.4, total_po_amount: 1166.4 },
  }

  /** Mirrors mapPORow charge-field restoration from server/utils/purchaseOrders.ts */
  function hydrateFormFromMappedPO(mapped: any) {
    const savedCharges = mapped.financial_breakdown?.charges ?? {}
    const savedSalesTaxes = mapped.financial_breakdown?.sales_taxes ?? {}
    return {
      ...mapped,
      freight_charges_percentage: savedCharges.freight?.percentage ?? null,
      freight_charges_amount: savedCharges.freight?.amount ?? null,
      freight_charges_taxable: savedCharges.freight?.taxable ?? false,
      packing_charges_percentage: savedCharges.packing?.percentage ?? null,
      sales_tax_1_percentage: savedSalesTaxes.sales_tax_1?.percentage ?? null,
      sales_tax_1_amount: savedSalesTaxes.sales_tax_1?.amount ?? null,
    }
  }

  it('hydrated form has non-zero charge percentages after PO reload', () => {
    const mappedPO = {
      uuid: 'po-1',
      freight_uuid: 'fr-uuid-fedex',
      financial_breakdown: savedBreakdown,
      freight_charges_percentage: 5,
      freight_charges_taxable: true,
    }
    const form = hydrateFormFromMappedPO(mappedPO)
    expect(form.freight_charges_percentage).toBe(5)
    expect(form.freight_charges_taxable).toBe(true)
    expect(form.packing_charges_percentage).toBe(2)
    expect(form.sales_tax_1_percentage).toBe(8)
  })

  it('form charge fields are null/0 when financial_breakdown is missing (pre-fix behaviour)', () => {
    const mappedPO = { uuid: 'po-1', financial_breakdown: null }
    const form = hydrateFormFromMappedPO(mappedPO)
    expect(form.freight_charges_percentage).toBeNull()
    expect(form.freight_charges_taxable).toBe(false)
    expect(form.packing_charges_percentage).toBeNull()
  })

  it('buildChargeStates reads freight_charges_percentage from hydrated form (not 0)', () => {
    const form = hydrateFormFromMappedPO({
      financial_breakdown: savedBreakdown,
      freight_charges_percentage: 5,
      freight_charges_amount: 50,
      freight_charges_taxable: true,
    })
    // resolveFieldValue equivalent
    const percentage = form.freight_charges_percentage
    expect(percentage).toBe(5)
    expect(percentage).not.toBe(0)
  })
})
