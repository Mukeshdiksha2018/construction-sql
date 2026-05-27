import { parseReasonUpdateBody, updateReason } from '../../utils/reasons'
import { useAuth } from '../../utils/use-auth'

/** PUT /api/reasons/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid')
    if (!uuid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Reason UUID is required',
      })
    }

    const { session } = useAuth(event)
    const body = await readBody(event)
    const input = parseReasonUpdateBody(body)
    const data = await updateReason(uuid, input, session.userID)

    return { success: true, data, message: 'Reason updated successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to update reason',
    })
  }
})
