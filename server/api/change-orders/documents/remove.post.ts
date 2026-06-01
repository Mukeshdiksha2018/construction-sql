import { removeChangeOrderAttachment } from '../../../utils/changeOrders'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const changeOrderUuid = body?.change_order_uuid
  const attachmentUuid = body?.attachment_uuid ?? body?.uuid

  if (!changeOrderUuid) {
    throw createError({ statusCode: 400, statusMessage: 'change_order_uuid is required' })
  }
  if (!attachmentUuid) {
    throw createError({ statusCode: 400, statusMessage: 'attachment_uuid is required' })
  }

  try {
    return await removeChangeOrderAttachment(String(changeOrderUuid), String(attachmentUuid))
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
