import { mssqlQueryParams } from '../utils/mssql'

/**
 * GET /api/projects/dependency-status?project_uuid=xxx
 *
 * Returns whether a project has dependents that prevent deletion or
 * certain edits (estimates, purchase orders, etc.).
 * Currently returns { locked: false } as a safe default until those
 * tables are introduced.
 */
export default defineEventHandler(async (event) => {
  const projectUuid = String(getQuery(event).project_uuid ?? '').trim()
  if (!projectUuid) throw createError({ statusCode: 400, statusMessage: 'project_uuid is required' })

  try {
    // Check if there are any location breakdowns (as a proxy for "has sub-records")
    const lbRows = await mssqlQueryParams<{ cnt: number }>(
      `SELECT COUNT(1) AS cnt FROM dbo.project_location_breakdowns WHERE project_uuid = @projectUuid AND ISNULL(is_active,1) = 1`,
      { projectUuid },
    )
    const locationBreakdownCount = Number(lbRows[0]?.cnt ?? 0)

    // Check address records
    const addrRows = await mssqlQueryParams<{ cnt: number }>(
      `SELECT COUNT(1) AS cnt FROM dbo.project_addresses WHERE project_uuid = @projectUuid AND ISNULL(is_active,1) = 1`,
      { projectUuid },
    )
    const addressCount = Number(addrRows[0]?.cnt ?? 0)

    return {
      data: {
        locked: false,
        location_breakdown_count: locationBreakdownCount,
        address_count: addressCount,
      },
    }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to fetch dependency status',
    })
  }
})
