import { softDeleteVendorAddress } from '../../../../utils/nimbleVendorAddresses'
import { useAuth } from '../../../../utils/use-auth'

/** DELETE /api/nimble-vendors/:id/addresses/:addressLinkId */
export default defineEventHandler(async (event) => {
  try {
    useAuth(event)
    const id = getRouterParam(event, 'id')
    const addressLinkIdRaw = getRouterParam(event, 'addressLinkId')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Vendor ID is required' })
    }
    const addressLinkId = Number(addressLinkIdRaw)
    if (!Number.isFinite(addressLinkId)) {
      throw createError({ statusCode: 400, statusMessage: 'Address link ID is required' })
    }

    const address = await softDeleteVendorAddress(id, addressLinkId)
    return { success: true, address, message: 'Address deleted successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to delete vendor address',
    })
  }
})
