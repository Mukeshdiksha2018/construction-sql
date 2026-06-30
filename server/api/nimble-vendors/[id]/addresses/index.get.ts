import { listVendorAddresses } from '../../../../utils/nimbleVendorAddresses'
import { getNimbleVendor } from '../../../../utils/nimbleVendors'
import { useAuth } from '../../../../utils/use-auth'

/** GET /api/nimble-vendors/:id/addresses */
export default defineEventHandler(async (event) => {
  try {
    useAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Vendor ID is required' })
    }

    const vendor = await getNimbleVendor(id)
    if (!vendor) {
      throw createError({ statusCode: 404, statusMessage: 'Vendor not found' })
    }

    const addresses = await listVendorAddresses(id)
    return { success: true, addresses }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to fetch vendor addresses',
    })
  }
})
