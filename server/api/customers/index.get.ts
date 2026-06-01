import { listCustomers } from '../../utils/customers'

/** GET /api/customers?corporation_uuid=...&project_uuid=... */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const corporationUuid = String(query.corporation_uuid ?? '').trim()
  const projectUuid = String(query.project_uuid ?? '').trim() || null

  if (!corporationUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'corporation_uuid is required',
    })
  }

  try {
    const data = await listCustomers(corporationUuid, projectUuid)
    return { success: true, data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to fetch customers',
    })
  }
})
