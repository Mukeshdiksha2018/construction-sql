import {
  normalizePoCurrencyConversionFields,
  type PoCurrencyConversionFields,
} from '~/utils/poCurrencyConversion'

type RecentCurrencyConversionResponse = {
  success?: boolean
  data?: PoCurrencyConversionFields | null
}

const recentByCorporation = new Map<string, PoCurrencyConversionFields>()

export function useRecentCorporationCurrencyConversion() {
  async function fetchRecentForCorporation(
    corporationUuid: string
  ): Promise<PoCurrencyConversionFields | null> {
    const corp = String(corporationUuid || '').trim()
    if (!corp) return null

    const cached = recentByCorporation.get(corp)
    if (cached) return cached

    try {
      const response = await $fetch<RecentCurrencyConversionResponse>(
        '/api/currency-conversion/recent',
        {
          query: { corporation_uuid: corp },
        }
      )

      const normalized = response?.data
        ? normalizePoCurrencyConversionFields({
            ...response.data,
            currency_conversion_enabled: true,
          })
        : null

      if (normalized) {
        recentByCorporation.set(corp, normalized)
      }

      return normalized
    } catch (error) {
      console.warn(
        '[useRecentCorporationCurrencyConversion] Failed to load recent currency settings:',
        error
      )
      return null
    }
  }

  function clearRecentCurrencyCache(corporationUuid?: string) {
    const corp = String(corporationUuid || '').trim()
    if (!corp) {
      recentByCorporation.clear()
      return
    }
    recentByCorporation.delete(corp)
  }

  return {
    fetchRecentForCorporation,
    clearRecentCurrencyCache,
  }
}
