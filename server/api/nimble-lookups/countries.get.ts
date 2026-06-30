import { listCountries } from '../../utils/nimbleLookups'
import { useAuth } from '../../utils/use-auth'

/** GET /api/nimble-lookups/countries */
export default defineEventHandler(async (event) => {
  try {
    useAuth(event)
    const countries = await listCountries()
    return { success: true, countries }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to fetch countries',
    })
  }
})
