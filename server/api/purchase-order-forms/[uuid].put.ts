import { updatePurchaseOrder } from '../../utils/purchaseOrders'

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) throw createError({ statusCode: 400, statusMessage: 'uuid is required' })
  const body = await readBody(event)

  try {
    // Append audit log entry if user info provided
    if (body.user_id) {
      const existing = body.audit_log ?? []
      const entry = {
        timestamp: new Date().toISOString(),
        user_uuid: body.user_id,
        user_name: body.user_name ?? 'Unknown User',
        user_email: body.user_email ?? '',
        user_image_url: body.user_image_url ?? null,
        action: body.status === 'Ready' ? 'marked_ready' : body.status === 'Approved' ? 'approved' : 'updated',
        description: body.status === 'Ready' ? 'Purchase order marked as ready' : body.status === 'Approved' ? 'Purchase order approved' : 'Purchase order updated',
      }
      body.audit_log = [...(Array.isArray(existing) ? existing : []), entry]
    }

    const po = await updatePurchaseOrder(uuid, body)
    if (!po) throw createError({ statusCode: 404, statusMessage: 'Purchase order not found' })
    return { data: po }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
