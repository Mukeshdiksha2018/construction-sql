import { createVendorAddress, parseVendorAddressBody } from '../../../../utils/nimbleVendorAddresses'
import { useAuth } from '../../../../utils/use-auth'

/** POST /api/nimble-vendors/:id/addresses */
export default defineEventHandler(async (event) => {
  try {
    useAuth(event)
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({ statusCode: 400, statusMessage: 'Vendor ID is required' })
    }

    const body = await readBody(event)
    const input = parseVendorAddressBody(body)
    const address = await createVendorAddress(id, input)

    return { success: true, address, message: 'Address created successfully' }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to create vendor address',
    })
  }
})
