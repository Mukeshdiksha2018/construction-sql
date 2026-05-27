import { softDeleteProjectAddress } from '../../../utils/projectAddresses'

/** DELETE /api/projects/addresses/:uuid */
export default defineEventHandler(async (event) => {
  const uuid = String(getRouterParam(event, 'uuid') ?? '').trim()
  if (!uuid) throw createError({ statusCode: 400, statusMessage: 'Address UUID is required' })

  try {
    await softDeleteProjectAddress(uuid)
    return { success: true }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to delete project address',
    })
  }
})
