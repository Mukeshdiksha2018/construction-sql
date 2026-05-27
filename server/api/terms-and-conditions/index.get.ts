import { listTermsAndConditions } from '../../utils/terms-and-conditions'

/** GET /api/terms-and-conditions */
export default defineEventHandler(async () => {
  try {
    const data = await listTermsAndConditions()
    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to fetch terms and conditions',
    })
  }
})
