import { createEstimate } from '../../utils/estimates'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body) throw createError({ statusCode: 400, statusMessage: 'Request body is required' })

  const required = ['corporation_uuid', 'project_uuid', 'estimate_date', 'total_amount', 'final_amount']
  for (const field of required) {
    if (!body[field] && body[field] !== 0) {
      throw createError({ statusCode: 400, statusMessage: `${field} is required` })
    }
  }

  try {
    const data = await createEstimate({
      corporation_uuid: body.corporation_uuid,
      project_uuid: body.project_uuid,
      estimate_number: body.estimate_number,
      estimate_date: body.estimate_date,
      valid_until: body.valid_until,
      status: body.status,
      total_amount: parseFloat(body.total_amount),
      tax_amount: body.tax_amount ? parseFloat(body.tax_amount) : 0,
      discount_amount: body.discount_amount ? parseFloat(body.discount_amount) : 0,
      final_amount: parseFloat(body.final_amount),
      notes: body.notes,
      attachments: body.attachments,
      removed_cost_code_uuids: body.removed_cost_code_uuids,
      line_items: body.line_items,
      user_id: body.user_id,
      user_name: body.user_name,
      user_email: body.user_email,
      user_image_url: body.user_image_url,
    })
    return { data }
  }
  catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to create estimate' })
  }
})
