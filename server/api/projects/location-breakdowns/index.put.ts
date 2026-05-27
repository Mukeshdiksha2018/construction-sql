import { updateLocationBreakdown } from '../../../utils/projectLocationBreakdowns'

/** PUT /api/projects/location-breakdowns  (uuid in body) */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const uuid = String(body?.uuid ?? '').trim()
  if (!uuid) throw createError({ statusCode: 400, statusMessage: 'uuid is required' })

  try {
    const data = await updateLocationBreakdown(uuid, {
      location_uuid: body?.location_uuid,
      area_sq_ft: body?.area_sq_ft,
      no_of_rooms: body?.no_of_rooms,
    })
    if (!data) throw createError({ statusCode: 404, statusMessage: 'Location breakdown not found' })
    return { data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to update location breakdown',
    })
  }
})
