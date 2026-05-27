import { createReason, parseReasonBody } from '../../utils/reasons'
import { useAuth } from '../../utils/use-auth'

/** POST /api/reasons */
export default defineEventHandler(async (event) => {
  try {
    const { session } = useAuth(event)
    const body = await readBody(event)
    const input = parseReasonBody(body)
    const data = await createReason(input, session.userID)

    return { success: true, data, message: 'Reason created successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to create reason',
    })
  }
})
