import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
function toNum(v: unknown) { const n = parseFloat(String(v ?? 0)); return isNaN(n) ? 0 : n }

export default defineEventHandler(async (event) => {
  const uuid = getRouterParam(event, 'uuid')
  if (!uuid) throw createError({ statusCode: 400, statusMessage: 'Material item UUID is required' })

  const body = await readBody(event)
  if (!body) throw createError({ statusCode: 400, statusMessage: 'Request body is required' })

  try {
    const updateData: any = {}
    const fields = ['item_type_uuid', 'item_uuid', 'name', 'description', 'model_number', 'uom_uuid', 'sequence', 'preferred_vendor_uuid', 'location_uuid', 'category']
    for (const f of fields) { if (body[f] !== undefined) updateData[f] = body[f] }
    if (body.metadata !== undefined) updateData.metadata = JSON.stringify(body.metadata)

    // Recalculate total_amount if price/qty changed
    if (body.unit_price !== undefined || body.quantity !== undefined) {
      const current = await prisma.estimateMaterialItem.findFirst({ where: { uuid, is_active: true }, select: { unit_price: true, quantity: true } })
      const up = body.unit_price !== undefined ? toNum(body.unit_price) : toNum(current?.unit_price)
      const qty = body.quantity !== undefined ? toNum(body.quantity) : toNum(current?.quantity)
      if (body.unit_price !== undefined) updateData.unit_price = up
      if (body.quantity !== undefined) updateData.quantity = qty
      updateData.total_amount = up * qty
    }

    const data = await prisma.estimateMaterialItem.update({ where: { uuid }, data: updateData })
    return { data }
  }
  catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to update material item' })
  }
})
