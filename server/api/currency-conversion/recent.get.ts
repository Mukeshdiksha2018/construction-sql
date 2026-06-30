import { createError } from 'h3'
import { fetchRecentCorporationCurrencyConversion } from '../../utils/recentCorporationCurrencyConversion'

export default defineEventHandler(async (event) => {
  try {
    const { corporation_uuid } = getQuery(event)
    const corporationUuid = String(corporation_uuid || '').trim()

    if (!corporationUuid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'corporation_uuid is required',
      })
    }

    const data = await fetchRecentCorporationCurrencyConversion(corporationUuid)

    return {
      success: true,
      data,
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
