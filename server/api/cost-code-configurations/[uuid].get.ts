import { getCostCodeConfigurationByUuid } from '../../utils/costCodeConfigurations'

/** GET /api/cost-code-configurations/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid') ?? ''
    if (!uuid) throw createError({ statusCode: 400, statusMessage: 'uuid is required' })

    const data = await getCostCodeConfigurationByUuid(uuid)
    if (!data) throw createError({ statusCode: 404, statusMessage: 'Cost code configuration not found' })

    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to fetch cost code configuration',
    })
  }
})
