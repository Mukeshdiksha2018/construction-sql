import { createFreight, parseFreightBody } from '../../utils/freight'
import { useAuth } from '../../utils/use-auth'

/** POST /api/freight */
export default defineEventHandler(async (event) => {
  try {
    const { session } = useAuth(event)
    const body = await readBody(event)
    const input = parseFreightBody(body)
    const data = await createFreight(input, session.userID)

    return { success: true, data, message: 'Freight created successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to create freight',
    })
  }
})
