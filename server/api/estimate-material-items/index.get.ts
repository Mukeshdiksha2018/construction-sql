import { getPrisma } from '../../utils/prisma'

const prisma = getPrisma()

function toNum(v: unknown) { const n = parseFloat(String(v ?? 0)); return isNaN(n) ? 0 : n }
function parseJson<T>(v: string | null | undefined, fb: T): T {
  if (!v) return fb; try { return JSON.parse(v) as T } catch { return fb }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const estimateLineItemUuid = String(query.estimate_line_item_uuid || '').trim()
  const corporationUuid = String(query.corporation_uuid || '').trim()
  const estimateUuid = String(query.estimate_uuid || '').trim()

  try {
    // Resolve to actual estimate_line_item uuid if needed
    let actualLineItemUuid = estimateLineItemUuid
    if (estimateLineItemUuid) {
      const direct = await prisma.estimateLineItem.findFirst({
        where: { uuid: estimateLineItemUuid },
        select: { uuid: true },
      })
      if (!direct) {
        // Try by cost_code_uuid
        const byCostCode = await prisma.estimateLineItem.findFirst({
          where: {
            cost_code_uuid: estimateLineItemUuid,
            ...(estimateUuid ? { estimate_uuid: estimateUuid } : {}),
            ...(corporationUuid ? { corporation_uuid: corporationUuid } : {}),
          },
          select: { uuid: true },
        })
        if (byCostCode) actualLineItemUuid = byCostCode.uuid
      }
    }

    const where: any = { is_active: true }
    if (actualLineItemUuid) where.estimate_line_item_uuid = actualLineItemUuid
    if (corporationUuid) where.corporation_uuid = corporationUuid

    const items = await prisma.estimateMaterialItem.findMany({
      where,
      orderBy: { sequence: 'asc' },
    })

    // Load preferred items
    const itemUuids = [...new Set(items.map(m => m.item_uuid).filter(Boolean) as string[])]
    const preferredItemsMap: Record<string, any> = {}
    if (itemUuids.length > 0) {
      const pis = await prisma.costCodePreferredItem.findMany({
        where: { uuid: { in: itemUuids } },
        select: { uuid: true, item_name: true, item_sequence: true, model_number: true, unit_price: true, uom_uuid: true, description: true },
      })
      for (const pi of pis) preferredItemsMap[pi.uuid] = pi
    }

    const data = items.map((item) => {
      const pi = item.item_uuid ? preferredItemsMap[item.item_uuid] : undefined
      return {
        uuid: item.uuid,
        estimate_line_item_uuid: item.estimate_line_item_uuid,
        item_type_uuid: item.item_type_uuid ?? null,
        item_uuid: item.item_uuid ?? null,
        preferred_vendor_uuid: item.preferred_vendor_uuid ?? null,
        item_division_uuid: item.item_division_uuid ?? null,
        location_uuid: item.location_uuid ?? null,
        category: item.category ?? null,
        name: pi?.item_name || item.name,
        item_sequence: pi?.item_sequence ?? null,
        description: item.description || pi?.description || null,
        model_number: pi?.model_number || item.model_number || null,
        unit_price: toNum(item.unit_price),
        quantity: toNum(item.quantity),
        uom_uuid: item.uom_uuid ?? null,
        total_amount: toNum(item.total_amount),
        sequence: item.sequence ?? 1,
        metadata: parseJson(item.metadata, {}),
        preferred_item: pi ? {
          uuid: pi.uuid,
          item_name: pi.item_name,
          item_sequence: pi.item_sequence,
          model_number: pi.model_number,
          unit_price: toNum(pi.unit_price),
          uom_uuid: pi.uom_uuid,
          description: pi.description,
        } : null,
      }
    })

    return { data }
  }
  catch (err: any) {
    if (err.statusCode) throw err
    throw createError({ statusCode: 500, statusMessage: err.message || 'Failed to fetch estimate material items' })
  }
})
