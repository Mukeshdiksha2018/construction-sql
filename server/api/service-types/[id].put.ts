import { parseServiceTypeUpdateBody, updateServiceType } from '../../utils/service-types'
import { useAuth } from '../../utils/use-auth'

/** PUT /api/service-types/:id */
export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Service type ID is required',
      })
    }

    const { session } = useAuth(event)
    const body = await readBody(event)
    const input = parseServiceTypeUpdateBody(body)
    const data = await updateServiceType(id, input, session.userID)
    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to update service type',
    })
  }
})
