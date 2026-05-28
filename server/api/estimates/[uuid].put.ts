import { updateEstimate } from '~/server/utils/estimates'

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) throw createError({ statusCode: 400, statusMessage: 'Estimate UUID is required' })

  const body = await readBody(event)
  if (!body) throw createError({ statusCode: 400, statusMessage: 'Request body is required' })

  try {
    const data = await updateEstimate({
      uuid,
      estimate_number: body.estimate_number,
      estimate_date: body.estimate_date,
      valid_until: body.valid_until,
      status: body.status,
      total_amount: body.total_amount !== undefined ? parseFloat(body.total_amount) : undefined,
      tax_amount: body.tax_amount !== undefined ? parseFloat(body.tax_amount) : undefined,
      discount_amount: body.discount_amount !== undefined ? parseFloat(body.discount_amount) : undefined,
      final_amount: body.final_amount !== undefined ? parseFloat(body.final_amount) : undefined,
      notes: body.notes,
      attachments: body.attachments,
      removed_cost_code_uuids: body.removed_cost_code_uuids,
      line_items: body.line_items,
      user_id: body.user_id,
      user_name: body.user_name,
      user_email: body.user_email,
      user_image_url: body.user_image_url,
    })
    if (!data) throw createError({ statusCode: 404, statusMessage: 'Estimate not found' })
    return { data }
  }
  catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to update estimate' })
  }
})
