import { getEstimate } from '~/server/utils/estimates'

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) throw createError({ statusCode: 400, statusMessage: 'Estimate UUID is required' })

  try {
    const data = await getEstimate(uuid)
    if (!data) throw createError({ statusCode: 404, statusMessage: 'Estimate not found' })
    return { data }
  }
  catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to fetch estimate' })
  }
})
