import { createPurchaseOrder, generateNextPoNumber } from '../../utils/purchaseOrders'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.corporation_uuid) {
    throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
  }

  try {
    // Auto-generate PO number if not provided
    if (!body.po_number) {
      body.po_number = await generateNextPoNumber(body.corporation_uuid, body.project_id ?? null)
    }

    // Build audit log entry
    if (body.user_id && !Array.isArray(body.audit_log)) {
      body.audit_log = [{
        timestamp: new Date().toISOString(),
        user_uuid: body.user_id,
        user_name: body.user_name ?? 'Unknown User',
        user_email: body.user_email ?? '',
        user_image_url: body.user_image_url ?? null,
        action: 'created',
        description: `Purchase order ${body.po_number} created`,
      }]
    }

    const po = await createPurchaseOrder(body)
    return { data: po }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
