import {
  listNimbleVendors,
  type NimbleVendorStatus,
} from '../../utils/nimbleVendors'
import { useAuth } from '../../utils/use-auth'

/** GET /api/nimble-vendors */
export default defineEventHandler(async (event) => {
  try {
    useAuth(event)

    const query = getQuery(event)
    const corporationUuid = String(query.corporation_uuid ?? query.corporation_id ?? '').trim() || undefined
    const statusRaw = query.status
    const status = statusRaw != null && statusRaw !== ''
      ? Number(statusRaw) as NimbleVendorStatus
      : undefined
    const includeDeleted = String(query.include_deleted ?? '').toLowerCase() === 'true'

    const vendors = await listNimbleVendors({
      corporationId: corporationUuid,
      status,
      includeDeleted,
    })

    return { success: true, vendors }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to fetch vendors',
    })
  }
})
