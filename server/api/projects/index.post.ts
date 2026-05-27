import { createProject } from '../../utils/projects'

/** POST /api/projects */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const corporationUuid = String(body?.corporation_uuid ?? '').trim()
  const projectName = String(body?.project_name ?? '').trim()

  if (!corporationUuid) {
    throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
  }
  if (!projectName) {
    throw createError({ statusCode: 400, statusMessage: 'project_name is required' })
  }

  try {
    const data = await createProject({
      corporation_uuid: corporationUuid,
      project_name: projectName,
      project_id: body?.project_id,
      project_type_uuid: body?.project_type_uuid ?? null,
      service_type_uuid: body?.service_type_uuid ?? null,
      project_description: body?.project_description ?? null,
      estimated_amount: body?.estimated_amount !== undefined ? Number(body.estimated_amount) : 0,
      area_sq_ft: body?.area_sq_ft ?? null,
      no_of_rooms: body?.no_of_rooms ?? null,
      contingency_percentage: body?.contingency_percentage ?? null,
      customer_name: body?.customer_name ?? null,
      customer_uuid: body?.customer_uuid ?? null,
      project_status: body?.project_status,
      project_start_date: body?.project_start_date ?? null,
      project_estimated_completion_date: body?.project_estimated_completion_date ?? null,
      only_total: body?.only_total ?? false,
      enable_labor: body?.enable_labor ?? false,
      enable_material: body?.enable_material ?? false,
      attachments: body?.attachments ?? [],
      enable_location_wise: body?.enable_location_wise ?? false,
      location_basis_area: body?.location_basis_area ?? false,
      location_basis_no_of_rooms: body?.location_basis_no_of_rooms ?? false,
    })
    return { data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to create project',
    })
  }
})
