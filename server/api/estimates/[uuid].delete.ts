import { PrismaClient } from '@prisma/client'
import { deleteEstimate } from '../../utils/estimates'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) throw createError({ statusCode: 400, statusMessage: 'Estimate UUID is required' })

  try {
    const estimate = await prisma.estimate.findFirst({
      where: { uuid, is_active: true },
      select: { uuid: true, project_uuid: true, estimate_number: true },
    })
    if (!estimate) throw createError({ statusCode: 404, statusMessage: 'Estimate not found' })

    const data = await deleteEstimate(uuid)
    return { data, message: 'Estimate deleted successfully' }
  }
  catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to delete estimate' })
  }
})
