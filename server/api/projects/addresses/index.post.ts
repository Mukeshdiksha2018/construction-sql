import { createProjectAddress } from '../../../utils/projectAddresses'

/** POST /api/projects/addresses */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const projectUuid = String(body?.project_uuid ?? '').trim()
  const addressType = String(body?.address_type ?? '').trim()
  const addressLine1 = String(body?.address_line_1 ?? '').trim()

  if (!projectUuid) throw createError({ statusCode: 400, statusMessage: 'project_uuid is required' })
  if (!addressType) throw createError({ statusCode: 400, statusMessage: 'address_type is required' })
  if (!addressLine1) throw createError({ statusCode: 400, statusMessage: 'address_line_1 is required' })

  try {
    const data = await createProjectAddress({
      project_uuid: projectUuid,
      address_type: addressType,
      contact_person: body?.contact_person ?? null,
      email: body?.email ?? null,
      phone: body?.phone ?? null,
      address_line_1: addressLine1,
      address_line_2: body?.address_line_2 ?? null,
      city: body?.city ?? null,
      state: body?.state ?? null,
      zip_code: body?.zip_code ?? null,
      country: body?.country ?? null,
      is_primary: body?.is_primary ?? false,
      copied_from_billing_address_uuid: body?.copied_from_billing_address_uuid ?? null,
    })
    return { data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to create project address',
    })
  }
})
