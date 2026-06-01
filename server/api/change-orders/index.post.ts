import { createChangeOrder } from '../../utils/changeOrders'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.corporation_uuid) {
    throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
  }

  try {
    const co = await createChangeOrder(body)
    return { data: co }
  } catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
