import { parseApprovalCheckUpdateBody, updateApprovalCheck } from '../../utils/approval-checks'
import { useAuth } from '../../utils/use-auth'

/** PUT /api/approval-checks/:uuid */
export default defineEventHandler(async (event) => {
  try {
    const uuid = getRouterParam(event, 'uuid')
    if (!uuid) {
      throw createError({ statusCode: 400, statusMessage: 'Approval Check UUID is required' })
    }

    const { session } = useAuth(event)
    const body = await readBody(event)
    const input = parseApprovalCheckUpdateBody(body)
    const data = await updateApprovalCheck(uuid, input, session.userID)

    return { success: true, data, message: 'Approval Check updated successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to update approval check',
    })
  }
})
