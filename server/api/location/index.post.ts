import { createLocation, parseLocationBody } from '../../utils/location'
import { useAuth } from '../../utils/use-auth'

/** POST /api/location */
export default defineEventHandler(async (event) => {
  try {
    const { session } = useAuth(event)
    const body = await readBody(event)
    const input = parseLocationBody(body)
    const data = await createLocation(input, session.userID)

    return { success: true, data, message: 'Location created successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to create location',
    })
  }
})
