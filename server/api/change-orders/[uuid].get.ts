import { getChangeOrder } from '../../utils/changeOrders'

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) {
    throw createError({ statusCode: 400, statusMessage: 'Change order UUID is required' })
  }

  try {
    const co = await getChangeOrder(uuid)
    if (!co) throw createError({ statusCode: 404, statusMessage: 'Change order not found' })
    return { data: co }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
