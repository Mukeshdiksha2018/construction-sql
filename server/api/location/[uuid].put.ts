import { parseLocationUpdateBody, updateLocation } from '../../utils/location'
import { useAuth } from '../../utils/use-auth'

/** PUT /api/location/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid')
    if (!uuid) {
      throw createError({ statusCode: 400, statusMessage: 'Location UUID is required' })
    }

    const { session } = useAuth(event)
    const body = await readBody(event)
    const input = parseLocationUpdateBody(body)
    const data = await updateLocation(uuid, input, session.userID)

    return { success: true, data, message: 'Location updated successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to update location',
    })
  }
})
