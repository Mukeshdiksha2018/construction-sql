import { softDeleteCustomer } from '../../utils/customers'
import { useAuth } from '../../utils/use-auth'

/** DELETE /api/customers?uuid=... */
export default defineEventHandler(async (event) => {
  try {
    const { session } = useAuth(event)
    const query = getQuery(event)
    const uuid = String(query.uuid ?? '').trim()

    if (!uuid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Customer UUID is required for delete',
      })
    }

    await softDeleteCustomer(uuid, session.userID)
    return { success: true }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to delete customer',
    })
  }
})
