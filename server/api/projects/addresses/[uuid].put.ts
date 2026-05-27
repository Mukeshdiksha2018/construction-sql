import { updateProjectAddress } from '../../../utils/projectAddresses'

/** PUT /api/projects/addresses/:uuid */
export default defineEventHandler(async (event) => {
  const uuid = String(getRouterParam(event, 'uuid') ?? '').trim()
  if (!uuid) throw createError({ statusCode: 400, statusMessage: 'Address UUID is required' })

  const body = await readBody(event)

  try {
    const data = await updateProjectAddress(uuid, {
      address_type: body?.address_type,
      contact_person: body?.contact_person,
      email: body?.email,
      phone: body?.phone,
      address_line_1: body?.address_line_1,
      address_line_2: body?.address_line_2,
      city: body?.city,
      state: body?.state,
      zip_code: body?.zip_code,
      country: body?.country,
      is_primary: body?.is_primary,
      copied_from_billing_address_uuid: body?.copied_from_billing_address_uuid,
    })

    if (!data) throw createError({ statusCode: 404, statusMessage: 'Project address not found' })
    return { data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to update project address',
    })
  }
})
