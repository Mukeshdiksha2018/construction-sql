import { getPrisma } from '../../utils/prisma'

const prisma = getPrisma()

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) throw createError({ statusCode: 400, statusMessage: 'Material item UUID is required' })

  try {
    const data = await prisma.estimateMaterialItem.delete({ where: { uuid } })
    return { data, message: 'Material item deleted successfully' }
  }
  catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to delete material item' })
  }
})
