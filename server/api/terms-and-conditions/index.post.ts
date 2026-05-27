import { createTermsAndCondition, parseTermsAndConditionBody } from '../../utils/terms-and-conditions'
import { useAuth } from '../../utils/use-auth'

/** POST /api/terms-and-conditions */
export default defineEventHandler(async (event) => {
  try {
    const { session } = useAuth(event)
    const body = await readBody(event)
    const input = parseTermsAndConditionBody(body)
    const data = await createTermsAndCondition(input, session.userID)
    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to create terms and condition',
    })
  }
})
