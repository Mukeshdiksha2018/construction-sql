import { getPrisma } from '../../utils/prisma'

const prisma = getPrisma()
function toNum(v: unknown) { const n = parseFloat(String(v ?? 0)); return isNaN(n) ? 0 : n }

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.name) throw createError({ statusCode: 400, statusMessage: 'estimate_line_item_uuid and name are required' })

  try {
    // Resolve line item
    let lineItem: any = null
    if (body.estimate_line_item_uuid) {
      lineItem = await prisma.estimateLineItem.findFirst({
        where: { uuid: body.estimate_line_item_uuid },
      })
      if (!lineItem) {
        lineItem = await prisma.estimateLineItem.findFirst({
          where: {
            cost_code_uuid: body.estimate_line_item_uuid,
            ...(body.estimate_uuid ? { estimate_uuid: body.estimate_uuid } : {}),
          },
        })
      }
    }
    if (!lineItem) throw createError({ statusCode: 400, statusMessage: 'Invalid estimate_line_item_uuid' })

    const unitPrice = toNum(body.unit_price)
    const quantity = toNum(body.quantity)
    const data = await prisma.estimateMaterialItem.create({
      data: {
        corporation_uuid: lineItem.corporation_uuid,
        project_uuid: lineItem.project_uuid,
        estimate_uuid: lineItem.estimate_uuid,
        cost_code_uuid: lineItem.cost_code_uuid,
        estimate_line_item_uuid: lineItem.uuid,
        item_type_uuid: body.item_type_uuid ?? null,
        item_uuid: body.item_uuid ?? null,
        preferred_vendor_uuid: body.preferred_vendor_uuid ?? null,
        item_division_uuid: body.item_division_uuid ?? null,
        location_uuid: body.location_uuid ?? null,
        category: body.category ?? null,
        name: body.name,
        description: body.description ?? null,
        model_number: body.model_number ?? null,
        unit_price: unitPrice,
        quantity,
        uom_uuid: body.uom_uuid ?? null,
        total_amount: unitPrice * quantity,
        sequence: body.sequence ?? 1,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
        is_active: true,
      },
    })
    return { data }
  }
  catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to create material item' })
  }
})
