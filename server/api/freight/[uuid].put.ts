import { parseFreightUpdateBody, updateFreight } from '../../utils/freight'
import { useAuth } from '../../utils/use-auth'

/** PUT /api/freight/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid')
    if (!uuid) {
      throw createError({ statusCode: 400, statusMessage: 'Freight UUID is required' })
    }

    const { session } = useAuth(event)
    const body = await readBody(event)
    const input = parseFreightUpdateBody(body)
    const data = await updateFreight(uuid, input, session.userID)

    return { success: true, data, message: 'Freight updated successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to update freight',
    })
  }
})
