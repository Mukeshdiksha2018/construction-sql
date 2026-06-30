import { createError } from 'h3'
import { fetchRecentVendorCurrencyFrom } from '../../utils/recentVendorCurrency'

export default defineEventHandler(async (event) => {
  try {
    const { corporation_uuid, vendor_uuid } = getQuery(event)
    const corporationUuid = String(corporation_uuid || '').trim()
    const vendorUuid = String(vendor_uuid || '').trim()

    if (!corporationUuid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'corporation_uuid is required',
      })
    }

    if (!vendorUuid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'vendor_uuid is required',
      })
    }

    const currencyFrom = await fetchRecentVendorCurrencyFrom(
      corporationUuid,
      vendorUuid
    )

    return {
      success: true,
      data: currencyFrom ? { currency_from: currencyFrom } : null,
    }
  } catch (error: unknown) {
    const err = error as { statusCode?: number }
    if (err?.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error',
    })
  }
})
