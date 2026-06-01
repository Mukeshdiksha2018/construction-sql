import { createCustomer, type CustomerPayload } from '../../utils/customers'
import { useAuth } from '../../utils/use-auth'

/** POST /api/customers */
export default defineEventHandler(async (event) => {
  try {
    const { session } = useAuth(event)
    const body = await readBody(event) as CustomerPayload
    const data = await createCustomer(body, session.userID)
    return { success: true, data, message: 'Customer created successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to create customer',
    })
  }
})
