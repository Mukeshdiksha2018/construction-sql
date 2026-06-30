import {
  normalizePoCurrencyCode,
  type PoCurrencyCode,
} from '~/utils/poCurrencyConversion'

type RecentVendorCurrencyResponse = {
  success?: boolean
  data?: { currency_from?: unknown } | null
}

const recentByVendorKey = new Map<string, PoCurrencyCode>()

function vendorCacheKey(corporationUuid: string, vendorUuid: string): string {
  return `${corporationUuid}::${vendorUuid}`
}

export function useRecentVendorCurrency() {
  async function fetchRecentForVendor(
    corporationUuid: string,
    vendorUuid: string
  ): Promise<PoCurrencyCode | null> {
    const corp = String(corporationUuid || '').trim()
    const vendor = String(vendorUuid || '').trim()
    if (!corp || !vendor) return null

    const cacheKey = vendorCacheKey(corp, vendor)
    const cached = recentByVendorKey.get(cacheKey)
    if (cached) return cached

    try {
      const response = await $fetch<RecentVendorCurrencyResponse>(
        '/api/currency-conversion/recent-vendor',
        {
          query: {
            corporation_uuid: corp,
            vendor_uuid: vendor,
          },
        }
      )

      const from = normalizePoCurrencyCode(response?.data?.currency_from)
      if (from) {
        recentByVendorKey.set(cacheKey, from)
      }

      return from
    } catch (error) {
      console.warn(
        '[useRecentVendorCurrency] Failed to load recent vendor currency:',
        error
      )
      return null
    }
  }

  function clearRecentVendorCurrencyCache(
    corporationUuid?: string,
    vendorUuid?: string
  ) {
    const corp = String(corporationUuid || '').trim()
    const vendor = String(vendorUuid || '').trim()
    if (!corp && !vendor) {
      recentByVendorKey.clear()
      return
    }
    if (corp && vendor) {
      recentByVendorKey.delete(vendorCacheKey(corp, vendor))
      return
    }
    for (const key of recentByVendorKey.keys()) {
      if (corp && key.startsWith(`${corp}::`)) {
        recentByVendorKey.delete(key)
      }
      if (vendor && key.endsWith(`::${vendor}`)) {
        recentByVendorKey.delete(key)
      }
    }
  }

  return {
    fetchRecentForVendor,
    clearRecentVendorCurrencyCache,
  }
}
