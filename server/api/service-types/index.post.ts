import { createServiceType, parseServiceTypeBody } from '../../utils/service-types'
import { useAuth } from '../../utils/use-auth'

/** POST /api/service-types */
export default defineEventHandler(async (event) => {
  try {
    const { session } = useAuth(event)
    const body = await readBody(event)
    const input = parseServiceTypeBody(body)
    const data = await createServiceType(input, session.userID)
    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to create service type',
    })
  }
})
