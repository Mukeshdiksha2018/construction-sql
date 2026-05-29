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

function compositeKey(itemUuid: string, costCodeUuid: string): string {
  return `${String(itemUuid).toLowerCase()}-${String(costCodeUuid).toLowerCase()}`
}

/**
 * Sum po_quantity on active PO lines for IMPORT_ITEMS_FROM_ESTIMATE POs, scoped to the
 * given estimate's material items (item_uuid + cost_code_uuid). Master/custom PO lines
 * and quantities on other estimates are excluded.
 */
export async function buildUsedQuantitiesByItem(
  query: EstimateQuantityAvailabilityQuery,
): Promise<Record<string, number>> {
  const { corporationUuid, projectUuid, estimateUuid, excludePoUuid } = query

  const estimateMaterialItems = await prisma.estimateMaterialItem.findMany({
    where: {
      corporation_uuid: corporationUuid,
      project_uuid: projectUuid,
      estimate_uuid: estimateUuid,
      is_active: true,
    },
    select: {
      item_uuid: true,
      cost_code_uuid: true,
    },
  })

  const allowedCompositeKeys = new Set<string>()
  for (const row of estimateMaterialItems) {
    if (!row.item_uuid || !row.cost_code_uuid) continue
    allowedCompositeKeys.add(compositeKey(row.item_uuid, row.cost_code_uuid))
  }

  if (allowedCompositeKeys.size === 0) {
    return {}
  }

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
      source: true,
    },
  })

  const usedQuantities: Record<string, number> = {}

  for (const item of poItems) {
    if (!item.item_uuid || !item.cost_code_uuid) continue

    const source = String(item.source ?? '').trim().toLowerCase()
    if (source && source !== 'estimate') continue

    const key = compositeKey(item.item_uuid, item.cost_code_uuid)
    if (!allowedCompositeKeys.has(key)) continue

    const qty = toNum(item.po_quantity)
    if (qty <= 0) continue

    usedQuantities[key] = (usedQuantities[key] || 0) + qty
  }

  return usedQuantities
}
