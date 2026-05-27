import { createLocationBreakdown } from '../../../utils/projectLocationBreakdowns'

/** POST /api/projects/location-breakdowns */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const projectUuid = String(body?.project_uuid ?? '').trim()
  const locationUuid = String(body?.location_uuid ?? '').trim()

  if (!projectUuid) throw createError({ statusCode: 400, statusMessage: 'project_uuid is required' })
  if (!locationUuid) throw createError({ statusCode: 400, statusMessage: 'location_uuid is required' })

  try {
    const data = await createLocationBreakdown({
      project_uuid: projectUuid,
      location_uuid: locationUuid,
      area_sq_ft: body?.area_sq_ft ?? null,
      no_of_rooms: body?.no_of_rooms ?? null,
    })
    return { data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to create location breakdown',
    })
  }
})
