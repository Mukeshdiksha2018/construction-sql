import { updateCustomer, type CustomerPayload } from '../../utils/customers'
import { useAuth } from '../../utils/use-auth'

/** PUT /api/customers — body must include uuid */
export default defineEventHandler(async (event) => {
  try {
    const { session } = useAuth(event)
    const body = await readBody(event) as CustomerPayload & { uuid?: string }
    const uuid = String(body.uuid ?? '').trim()

    if (!uuid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Customer UUID is required for update',
      })
    }

    const { uuid: _omit, ...payload } = body
    const data = await updateCustomer(uuid, payload, session.userID)
    return { success: true, data, message: 'Customer updated successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to update customer',
    })
  }
})
