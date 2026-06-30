import { softDeleteNimbleVendor } from '../../utils/nimbleVendors'
import { useAuth } from '../../utils/use-auth'

/** DELETE /api/nimble-vendors/:id — soft delete (Status = 3) */
export default defineEventHandler(async (event) => {
  try {
    const { session } = useAuth(event)

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Vendor ID is required' })
    }

    const vendor = await softDeleteNimbleVendor(id, session.userID)

    return { success: true, vendor, message: 'Vendor deleted successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to delete vendor',
    })
  }
})
