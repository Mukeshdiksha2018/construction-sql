import { listReasons } from '../../utils/reasons'

/** GET /api/reasons */
export default defineEventHandler(async () => {
  try {
    const data = await listReasons()
    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to fetch reasons',
    })
  }
})
