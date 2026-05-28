import { deleteCostCodeConfiguration } from '../../utils/costCodeConfigurations'

/** DELETE /api/cost-code-configurations/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid') ?? ''
    if (!uuid) throw createError({ statusCode: 400, statusMessage: 'uuid is required' })

    await deleteCostCodeConfiguration(uuid)
    return { success: true, message: 'Cost code configuration deleted successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to delete cost code configuration',
    })
  }
})
