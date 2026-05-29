import { getPrisma } from './prisma'

const prisma = getPrisma()

function toNum(value: unknown): number {
  const n = parseFloat(String(value ?? ''))
  return Number.isFinite(n) ? n : 0
}

export interface EstimateQuantityAvailabilityQuery {
  corporationUuid: string
  projectUuid: string
  estimateUuid: string
  excludePoUuid?: string
}

/**
 * Sum po_quantity (or quantity) on active PO lines for IMPORT_ITEMS_FROM_ESTIMATE POs,
 * keyed by item_uuid-cost_code_uuid (lowercase). Used for "remaining qty" in PO form.
 */
export async function buildUsedQuantitiesByItem(
  query: EstimateQuantityAvailabilityQuery,
): Promise<Record<string, number>> {
  const { corporationUuid, projectUuid, excludePoUuid } = query

  const purchaseOrders = await prisma.purchaseOrderForm.findMany({
    where: {
      corporation_uuid: corporationUuid,
      project_uuid: projectUuid,
      include_items: 'IMPORT_ITEMS_FROM_ESTIMATE',
      is_active: true,
      ...(excludePoUuid ? { uuid: { not: excludePoUuid } } : {}),
    },
    select: { uuid: true },
  })

  if (purchaseOrders.length === 0) {
    return {}
  }

  const poUuids = purchaseOrders.map((po) => po.uuid)
  const poItems = await prisma.purchaseOrderItem.findMany({
    where: {
      purchase_order_uuid: { in: poUuids },
      is_active: true,
    },
    select: {
      item_uuid: true,
      cost_code_uuid: true,
      po_quantity: true,
      quantity: true,
    },
  })

  const usedQuantities: Record<string, number> = {}

  for (const item of poItems) {
    if (!item.item_uuid || !item.cost_code_uuid) continue

    const compositeKey = `${String(item.item_uuid).toLowerCase()}-${String(item.cost_code_uuid).toLowerCase()}`
    const qty = toNum(item.po_quantity ?? item.quantity)
    if (qty <= 0) continue

    usedQuantities[compositeKey] = (usedQuantities[compositeKey] || 0) + qty
  }

  return usedQuantities
}
