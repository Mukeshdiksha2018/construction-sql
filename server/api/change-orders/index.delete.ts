import { deleteChangeOrder } from '../../utils/changeOrders'

export default defineEventHandler(async (event) => {
  const { uuid } = getQuery(event)
  if (!uuid) {
    throw createError({ statusCode: 400, statusMessage: 'uuid is required' })
  }

  try {
    const co = await deleteChangeOrder(String(uuid))
    if (!co) throw createError({ statusCode: 404, statusMessage: 'Change order not found' })
    return { data: co }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
