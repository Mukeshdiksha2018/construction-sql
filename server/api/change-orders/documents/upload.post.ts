import { uploadChangeOrderAttachments } from '../../../utils/changeOrders'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const changeOrderUuid = body?.change_order_uuid
  const files = body?.files

  if (!changeOrderUuid || typeof changeOrderUuid !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'change_order_uuid is required' })
  }
  if (!Array.isArray(files) || files.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Files array is required and must not be empty' })
  }

  try {
    return await uploadChangeOrderAttachments(changeOrderUuid, files)
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
