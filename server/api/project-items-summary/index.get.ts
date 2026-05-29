import { buildProjectItemsSummary } from '../../utils/projectItemsSummary'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const projectUuid = String(query.project_uuid || '').trim()
  const corporationUuid = String(query.corporation_uuid || '').trim()
  const vendorUuid = String(query.vendor_uuid || '').trim()
  const location = String(query.location || '').trim()

  if (!projectUuid || !corporationUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'project_uuid and corporation_uuid are required',
    })
  }

  try {
    const data = await buildProjectItemsSummary({
      corporationUuid,
      projectUuid,
      vendorUuid: vendorUuid || undefined,
      location: location || undefined,
    })
    return { data }
  } catch (error: any) {
    console.error('project-items-summary API failure', error)
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Unexpected error',
    })
  }
})
