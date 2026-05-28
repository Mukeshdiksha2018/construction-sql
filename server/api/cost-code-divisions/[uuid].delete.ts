import { deleteCostCodeDivision } from '../../utils/costCodeDivisions'

/** DELETE /api/cost-code-divisions/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid') ?? ''
    if (!uuid) throw createError({ statusCode: 400, statusMessage: 'uuid is required' })

    await deleteCostCodeDivision(uuid)
    return { success: true, message: 'Cost code division deleted successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to delete cost code division',
    })
  }
})
