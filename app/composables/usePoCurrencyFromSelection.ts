import { useRecentCorporationCurrencyConversion } from '~/composables/useRecentCorporationCurrencyConversion'
import { useRecentVendorCurrency } from '~/composables/useRecentVendorCurrency'
import {
  normalizePoCurrencyConversionFields,
  syncPoCurrencyConversionForFromCurrency,
  type PoCurrencyCode,
  type PoCurrencyConversionFields,
} from '~/utils/poCurrencyConversion'

type UsePoCurrencyFromSelectionOptions = {
  getForm: () => Record<string, unknown>
  updateCurrencyFields: (fields: PoCurrencyConversionFields) => void
  isNewDocument: () => boolean
  getCorporationUuid: () => string | null | undefined
}

export function usePoCurrencyFromSelection(
  options: UsePoCurrencyFromSelectionOptions
) {
  const { fetchRecentForCorporation } = useRecentCorporationCurrencyConversion()
  const { fetchRecentForVendor } = useRecentVendorCurrency()

  async function resolveCorporationConversionRate(): Promise<number | undefined> {
    const corp = String(options.getCorporationUuid() ?? '').trim()
    if (!corp) return undefined
    const recent = await fetchRecentForCorporation(corp)
    return recent?.conversion_rate
  }

  async function applyFromCurrency(currencyFrom: PoCurrencyCode) {
    const current = normalizePoCurrencyConversionFields(options.getForm())
    if (currencyFrom === current.currency_from) return

    if (currencyFrom === 'CAD') {
      options.updateCurrencyFields(
        syncPoCurrencyConversionForFromCurrency('CAD')
      )
      return
    }

    let rate = current.conversion_rate
    const corpRate = await resolveCorporationConversionRate()
    if (corpRate !== undefined) {
      rate = corpRate
    }

    options.updateCurrencyFields(
      syncPoCurrencyConversionForFromCurrency('USD', { conversionRate: rate })
    )
  }

  async function prefillFromVendor(vendorUuid: string | null | undefined) {
    if (!options.isNewDocument()) return

    const vendor = String(vendorUuid ?? '').trim()
    const corp = String(options.getCorporationUuid() ?? '').trim()
    if (!vendor || !corp) return

    const from = await fetchRecentForVendor(corp, vendor)
    if (!from) return

    await applyFromCurrency(from)
  }

  /** New documents opened with vendor_uuid already set (e.g. pending-qty PO) skip handleVendorChange. */
  async function prefillWhenVendorAlreadySet() {
    if (!options.isNewDocument()) return
    const vendor = String(options.getForm().vendor_uuid ?? '').trim()
    if (!vendor) return
    await prefillFromVendor(vendor)
  }

  return {
    applyFromCurrency,
    prefillFromVendor,
    prefillWhenVendorAlreadySet,
    resolveCorporationConversionRate,
  }
}
