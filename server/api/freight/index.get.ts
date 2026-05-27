import { listFreight } from '../../utils/freight'

/** GET /api/freight */
export default defineEventHandler(async () => {
  try {
    const data = await listFreight()
    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to fetch freight',
    })
  }
})
