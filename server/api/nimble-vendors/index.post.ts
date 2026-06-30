import { createNimbleVendor, parseNimbleVendorBody } from '../../utils/nimbleVendors'
import { useAuth } from '../../utils/use-auth'

/** POST /api/nimble-vendors */
export default defineEventHandler(async (event) => {
  try {
    const { session } = useAuth(event)
    const body = await readBody(event)
    const input = parseNimbleVendorBody(body)
    const vendor = await createNimbleVendor(input, session.userID)

    return { success: true, vendor, message: 'Vendor created successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to create vendor',
    })
  }
})
