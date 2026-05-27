import { createApprovalCheck, parseApprovalCheckBody } from '../../utils/approval-checks'
import { useAuth } from '../../utils/use-auth'

/** POST /api/approval-checks */
export default defineEventHandler(async (event) => {
  try {
    const { session } = useAuth(event)
    const body = await readBody(event)
    const input = parseApprovalCheckBody(body)
    const data = await createApprovalCheck(input, session.userID)

    return { success: true, data, message: 'Approval Check created successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to create approval check',
    })
  }
})
