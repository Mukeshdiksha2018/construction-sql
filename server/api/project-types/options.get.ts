import { listProjectTypeOptions } from '../../utils/project-types'

/** GET /api/project-types/options */
export default defineEventHandler(async () => {
  try {
    const data = await listProjectTypeOptions()
    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to fetch project type options',
    })
  }
})
