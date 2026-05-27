import { listLocation } from '../../utils/location'

/** GET /api/location */
export default defineEventHandler(async () => {
  try {
    const data = await listLocation()
    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to fetch locations',
    })
  }
})
