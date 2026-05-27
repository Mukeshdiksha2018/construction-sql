import { updateProject } from '../../utils/projects'

/** PUT /api/projects */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const uuid = String(body?.uuid ?? '').trim()
  if (!uuid) {
    throw createError({ statusCode: 400, statusMessage: 'Project UUID is required for update' })
  }

  try {
    const data = await updateProject(uuid, {
      project_name: body?.project_name,
      project_id: body?.project_id,
      project_type_uuid: body?.project_type_uuid,
      service_type_uuid: body?.service_type_uuid,
      project_description: body?.project_description,
      estimated_amount: body?.estimated_amount !== undefined ? Number(body.estimated_amount) : undefined,
      area_sq_ft: body?.area_sq_ft,
      no_of_rooms: body?.no_of_rooms,
      contingency_percentage: body?.contingency_percentage,
      customer_name: body?.customer_name,
      customer_uuid: body?.customer_uuid,
      project_status: body?.project_status,
      project_start_date: body?.project_start_date,
      project_estimated_completion_date: body?.project_estimated_completion_date,
      only_total: body?.only_total,
      enable_labor: body?.enable_labor,
      enable_material: body?.enable_material,
      attachments: body?.attachments,
      enable_location_wise: body?.enable_location_wise,
      location_basis_area: body?.location_basis_area,
      location_basis_no_of_rooms: body?.location_basis_no_of_rooms,
    })

    if (!data) {
      throw createError({ statusCode: 404, statusMessage: 'Project not found' })
    }

    return { data }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number, statusMessage?: string, message?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? err.message ?? 'Failed to update project',
    })
  }
})
