import { listEstimates } from '../../utils/estimates'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const corporationUuid = String(query.corporation_uuid || '').trim()

  if (!corporationUuid) {
    throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
  }

  const projectUuid = query.project_uuid ? String(query.project_uuid) : undefined
  const page = parseInt(String(query.page || '1')) || 1
  const pageSize = parseInt(String(query.page_size || '100')) || 100

  try {
    return await listEstimates(corporationUuid, projectUuid, page, pageSize)
  }
  catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to fetch estimates' })
  }
})
