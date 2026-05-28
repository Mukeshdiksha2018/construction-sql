import { listProjects } from '../../../utils/projects'

/**
 * GET /api/projects/options?corporation_uuid=...
 * Lightweight project list for use in select dropdowns (PO forms, filters, etc.).
 * Returns the same data as /api/projects but scoped to dropdown use-cases.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const corporationUuid = String(query.corporation_uuid ?? '').trim()

  if (!corporationUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'corporation_uuid is required',
    })
  }

  try {
    const projects = await listProjects(corporationUuid)
    // Return only active projects with fields needed for dropdowns
    const options = projects
      .filter((p) => p.is_active !== false)
      .map((p) => ({
        uuid: p.uuid,
        project_name: p.project_name,
        project_id: p.project_id,
        corporation_uuid: p.corporation_uuid,
        enable_location_wise: p.enable_location_wise ?? false,
        enable_labor: p.enable_labor ?? false,
        enable_material: p.enable_material ?? true,
        project_status: p.project_status ?? null,
        is_active: true,
      }))
    return { data: options }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string; message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to fetch project options',
    })
  }
})
