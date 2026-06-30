import { listStates } from '../../utils/nimbleLookups'
import { useAuth } from '../../utils/use-auth'

/** GET /api/nimble-lookups/states */
export default defineEventHandler(async (event) => {
  try {
    useAuth(event)
    const query = getQuery(event)
    const countryIdRaw = query.country_id
    const countryId = countryIdRaw != null && countryIdRaw !== ''
      ? Number(countryIdRaw)
      : undefined

    const states = await listStates(
      countryId != null && Number.isFinite(countryId) ? countryId : undefined,
    )
    return { success: true, states }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to fetch states',
    })
  }
})
