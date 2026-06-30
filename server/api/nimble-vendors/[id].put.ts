import { parseNimbleVendorBody, updateNimbleVendor } from '../../utils/nimbleVendors'
import { useAuth } from '../../utils/use-auth'

/** PUT /api/nimble-vendors/:id */
export default defineEventHandler(async (event) => {
  try {
    const { session } = useAuth(event)

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Vendor ID is required' })
    }

    const body = await readBody(event)
    const input = parseNimbleVendorBody(body, false)
    const vendor = await updateNimbleVendor(id, input, session.userID)

    return { success: true, vendor, message: 'Vendor updated successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to update vendor',
    })
  }
})
