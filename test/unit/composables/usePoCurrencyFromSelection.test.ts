import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const fetchRecentForCorporation = vi.fn()
const fetchRecentForVendor = vi.fn()

vi.mock('~/composables/useRecentCorporationCurrencyConversion', () => ({
  useRecentCorporationCurrencyConversion: () => ({
    fetchRecentForCorporation,
  }),
}))

vi.mock('~/composables/useRecentVendorCurrency', () => ({
  useRecentVendorCurrency: () => ({
    fetchRecentForVendor,
  }),
}))

const { usePoCurrencyFromSelection } = await import('~/composables/usePoCurrencyFromSelection')

describe('usePoCurrencyFromSelection', () => {
  const form = ref<Record<string, unknown>>({
    currency_conversion_enabled: false,
    currency_from: 'CAD',
    currency_to: 'USD',
    conversion_rate: 1,
    corporation_uuid: 'corp-1',
  })

  let updated: Record<string, unknown> | null = null

  beforeEach(() => {
    updated = null
    form.value = {
      currency_conversion_enabled: false,
      currency_from: 'CAD',
      currency_to: 'USD',
      conversion_rate: 1,
      corporation_uuid: 'corp-1',
    }
    fetchRecentForCorporation.mockReset()
    fetchRecentForVendor.mockReset()
  })

  const createSelection = (isNewDocument = true) =>
    usePoCurrencyFromSelection({
      getForm: () => form.value,
      updateCurrencyFields: (fields) => {
        updated = fields
        form.value = { ...form.value, ...fields }
      },
      isNewDocument: () => isNewDocument,
      getCorporationUuid: () => String(form.value.corporation_uuid ?? ''),
    })

  it('prefills from-currency from vendor history on new documents', async () => {
    fetchRecentForVendor.mockResolvedValue('USD')
    fetchRecentForCorporation.mockResolvedValue({
      currency_conversion_enabled: true,
      currency_from: 'USD',
      currency_to: 'CAD',
      conversion_rate: 1.42,
    })

    const { prefillFromVendor } = createSelection(true)
    await prefillFromVendor('vendor-1')

    expect(fetchRecentForVendor).toHaveBeenCalledWith('corp-1', 'vendor-1')
    expect(updated).toEqual({
      currency_conversion_enabled: true,
      currency_from: 'USD',
      currency_to: 'CAD',
      conversion_rate: 1.42,
    })
  })

  it('uses corporation recent conversion rate when switching to USD manually', async () => {
    fetchRecentForCorporation.mockResolvedValue({
      currency_conversion_enabled: true,
      currency_from: 'USD',
      currency_to: 'CAD',
      conversion_rate: 1.55,
    })

    const { applyFromCurrency } = createSelection(true)
    await applyFromCurrency('USD')

    expect(fetchRecentForCorporation).toHaveBeenCalledWith('corp-1')
    expect(updated).toEqual({
      currency_conversion_enabled: true,
      currency_from: 'USD',
      currency_to: 'CAD',
      conversion_rate: 1.55,
    })
  })

  it('uses corporation recent conversion rate when switching to USD on an existing document', async () => {
    form.value = {
      currency_conversion_enabled: false,
      currency_from: 'CAD',
      currency_to: 'USD',
      conversion_rate: 1,
      corporation_uuid: 'corp-1',
    }
    fetchRecentForCorporation.mockResolvedValue({
      currency_conversion_enabled: true,
      currency_from: 'USD',
      currency_to: 'CAD',
      conversion_rate: 1.5,
    })

    const { applyFromCurrency } = createSelection(false)
    await applyFromCurrency('USD')

    expect(fetchRecentForCorporation).toHaveBeenCalledWith('corp-1')
    expect(updated).toEqual({
      currency_conversion_enabled: true,
      currency_from: 'USD',
      currency_to: 'CAD',
      conversion_rate: 1.5,
    })
  })

  it('does not prefill vendor currency when editing an existing document', async () => {
    const { prefillFromVendor } = createSelection(false)
    await prefillFromVendor('vendor-1')

    expect(fetchRecentForVendor).not.toHaveBeenCalled()
    expect(updated).toBeNull()
  })

  it('prefills currency when vendor_uuid is already set on a new document', async () => {
    form.value = {
      ...form.value,
      vendor_uuid: 'vendor-1',
    }
    fetchRecentForVendor.mockResolvedValue('USD')
    fetchRecentForCorporation.mockResolvedValue({
      currency_conversion_enabled: true,
      currency_from: 'USD',
      currency_to: 'CAD',
      conversion_rate: 1.5,
    })

    const { prefillWhenVendorAlreadySet } = createSelection(true)
    await prefillWhenVendorAlreadySet()

    expect(fetchRecentForVendor).toHaveBeenCalledWith('corp-1', 'vendor-1')
    expect(updated).toEqual({
      currency_conversion_enabled: true,
      currency_from: 'USD',
      currency_to: 'CAD',
      conversion_rate: 1.5,
    })
  })
})
