import { getPrisma } from './prisma'

const prisma = getPrisma()

function toNum(value: unknown, fallback = 0): number {
  const n = parseFloat(String(value ?? ''))
  return Number.isFinite(n) ? n : fallback
}

function parseJson<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback
  try {
    return JSON.parse(val) as T
  } catch {
    return fallback
  }
}

function formatSequence(sequence: unknown, itemSequence: string | null | undefined): string {
  if (itemSequence && String(itemSequence).trim()) return String(itemSequence).trim()
  if (sequence === null || sequence === undefined || sequence === '') return ''
  if (typeof sequence === 'number') return String(sequence).padStart(3, '0')
  return String(sequence)
}

export interface ProjectItemsSummaryQuery {
  corporationUuid: string
  projectUuid: string
  vendorUuid?: string
  location?: string
}

export async function buildProjectItemsSummary(query: ProjectItemsSummaryQuery) {
  const { corporationUuid, projectUuid, vendorUuid, location } = query

  const project = await prisma.project.findFirst({
    where: {
      uuid: projectUuid,
      corporation_uuid: corporationUuid,
      is_active: true,
    },
    select: {
      uuid: true,
      project_name: true,
      project_id: true,
    },
  })

  if (!project) {
    return []
  }

  const estimates = await prisma.estimate.findMany({
    where: {
      project_uuid: projectUuid,
      corporation_uuid: corporationUuid,
      status: 'Approved',
      is_active: true,
    },
    select: { uuid: true },
  })

  const estimateUuids = estimates.map((e) => e.uuid)
  if (estimateUuids.length === 0) {
    return []
  }

  const [itemTypes, locations, lineItems, materialItems] = await Promise.all([
    prisma.itemType.findMany({
      where: {
        is_active: true,
        OR: [{ corporation_uuid: corporationUuid }, { corporation_uuid: null }],
      },
      select: {
        uuid: true,
        item_type: true,
        category: true,
        spec_type: true,
        item_division_uuid: true,
      },
    }),
    prisma.location.findMany({
      where: { active: true },
      select: { uuid: true, location_name: true },
    }),
    prisma.estimateLineItem.findMany({
      where: {
        project_uuid: projectUuid,
        corporation_uuid: corporationUuid,
        estimate_uuid: { in: estimateUuids },
      },
      select: {
        uuid: true,
        cost_code_uuid: true,
        cost_code_number: true,
        cost_code_name: true,
        division_name: true,
      },
    }),
    prisma.estimateMaterialItem.findMany({
      where: {
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        estimate_uuid: { in: estimateUuids },
        is_active: true,
      },
      orderBy: { sequence: 'asc' },
    }),
  ])

  const itemTypeMap = new Map<string, string>()
  const itemTypeCategoryMap = new Map<string, string>()
  const itemTypeSpecTypeMap = new Map<string, string>()
  for (const it of itemTypes) {
    if (it.uuid && it.item_type) itemTypeMap.set(it.uuid, it.item_type)
    if (it.uuid && it.category) itemTypeCategoryMap.set(it.uuid, it.category)
    if (it.uuid && it.spec_type) itemTypeSpecTypeMap.set(it.uuid, it.spec_type)
  }

  const locationMap = new Map<string, string>()
  for (const loc of locations) {
    if (loc.uuid && loc.location_name) locationMap.set(loc.uuid, loc.location_name)
  }

  const lineItemMap = new Map<string, (typeof lineItems)[number]>()
  for (const row of lineItems) {
    if (row.uuid) lineItemMap.set(row.uuid, row)
  }

  const itemUuids = [
    ...new Set(materialItems.map((m) => m.item_uuid).filter(Boolean) as string[]),
  ]
  const preferredItemsMap = new Map<string, { item_sequence: string | null; preferred_vendor_uuid: string | null }>()
  if (itemUuids.length > 0) {
    const preferred = await prisma.costCodePreferredItem.findMany({
      where: { uuid: { in: itemUuids } },
      select: { uuid: true, item_sequence: true, preferred_vendor_uuid: true },
    })
    for (const pi of preferred) {
      preferredItemsMap.set(pi.uuid, {
        item_sequence: pi.item_sequence,
        preferred_vendor_uuid: pi.preferred_vendor_uuid,
      })
    }
  }

  const allEstimateItems: any[] = []
  for (const item of materialItems) {
    const lineItem = item.estimate_line_item_uuid
      ? lineItemMap.get(item.estimate_line_item_uuid)
      : null
    const metadata = parseJson<Record<string, unknown>>(item.metadata, {})
    const preferred = item.item_uuid ? preferredItemsMap.get(item.item_uuid) : undefined
    const itemSequence = preferred?.item_sequence ?? null
    const sequence = formatSequence(item.sequence, itemSequence)
    const sequenceUuid = typeof sequence === 'string' && sequence.length === 36 ? sequence : null

    const rawLocationUuid = item.location_uuid || (metadata.location_uuid as string | undefined) || null
    const locationUuid =
      typeof rawLocationUuid === 'string' && rawLocationUuid.length === 36 ? rawLocationUuid : null
    const locationMeta = (metadata.location as string) || rawLocationUuid || ''

    const itemTypeUuid = item.item_type_uuid || null
    const itemTypeLabel =
      itemTypeUuid && itemTypeMap.has(itemTypeUuid) ? itemTypeMap.get(itemTypeUuid) || '' : ''
    const specType =
      (metadata.spec_type as string) ||
      (itemTypeUuid && itemTypeSpecTypeMap.get(itemTypeUuid)) ||
      ''

    const unitUuid = item.uom_uuid || null
    const unitLabel =
      (metadata.unit_label as string) ||
      (metadata.uom_label as string) ||
      (metadata.unit as string) ||
      ''

    let locationName = locationMeta
    if (locationUuid && locationMap.has(locationUuid)) {
      locationName = locationMap.get(locationUuid) || locationMeta
    } else if (typeof locationMeta === 'string' && locationMeta.length === 36 && locationMap.has(locationMeta)) {
      locationName = locationMap.get(locationMeta) || locationMeta
    }

    const costCodeUuid = lineItem?.cost_code_uuid || item.cost_code_uuid || (metadata.cost_code_uuid as string) || null
    const costCodeNumber = lineItem?.cost_code_number || (metadata.cost_code_number as string) || ''
    const costCodeName = lineItem?.cost_code_name || (metadata.cost_code_name as string) || ''
    const divisionName = lineItem?.division_name || (metadata.division_name as string) || ''

    allEstimateItems.push({
      cost_code_uuid: costCodeUuid,
      cost_code_number: costCodeNumber,
      cost_code_name: costCodeName,
      cost_code_label: [costCodeNumber, costCodeName].filter(Boolean).join(' ').trim(),
      division_name: divisionName,
      category:
        item.category ||
        (metadata.category as string) ||
        (itemTypeUuid && itemTypeCategoryMap.get(itemTypeUuid)) ||
        '',
      item_division_uuid: item.item_division_uuid || (metadata.item_division_uuid as string) || null,
      preferred_vendor_uuid: item.preferred_vendor_uuid || preferred?.preferred_vendor_uuid || null,
      item_uuid: item.item_uuid || null,
      item_type_uuid: itemTypeUuid,
      item_type_label: itemTypeLabel,
      spec_type: specType,
      item_name: item.name || '',
      description: item.description || '',
      sequence,
      sequence_uuid: sequenceUuid,
      location: locationName,
      location_uuid: locationUuid,
      quantity: toNum(item.quantity),
      unit_price: toNum(item.unit_price),
      unit_uuid: unitUuid,
      unit_label: unitLabel,
      model_number: item.model_number || '',
    })
  }

  const purchaseOrders = await prisma.purchaseOrderForm.findMany({
    where: {
      project_uuid: projectUuid,
      corporation_uuid: corporationUuid,
      is_active: true,
      include_items: 'IMPORT_ITEMS_FROM_ESTIMATE',
    },
    select: { uuid: true, vendor_uuid: true },
  })

  const estimateItemsMap = new Map<string, any>()
  for (const item of allEstimateItems) {
    const itemUuid = item.item_uuid || ''
    const costCodeUuid = item.cost_code_uuid || ''
    if (!itemUuid) continue
    const compositeKey = costCodeUuid ? `${itemUuid}-${costCodeUuid}` : itemUuid
    const existing = estimateItemsMap.get(compositeKey)
    if (existing) {
      existing.quantity += item.quantity || 0
    } else {
      estimateItemsMap.set(compositeKey, {
        ...item,
        location_display: item.location || '',
      })
    }
  }

  const projectLabel = project.project_name
    ? `${project.project_name}${project.project_id ? ` #${project.project_id}` : ''}`
    : 'N/A'

  const buildRow = (
    item: any,
    poQty: number,
    vendorUuidForRow: string | null,
    filterVendorName: string | null,
  ) => {
    const budgetQty = toNum(item.quantity)
    const pendingQty = Math.max(0, budgetQty - poQty)
    let status: 'Pending' | 'Partial' | 'Complete' = 'Pending'
    if (poQty > 0 && poQty < budgetQty) status = 'Partial'
    else if (poQty >= budgetQty && budgetQty > 0) status = 'Complete'

    const locationUuid = item.location_uuid || null
    const itemLocation = item.location_display || item.location || ''
    const locationDisplayName =
      locationUuid && locationMap.has(locationUuid)
        ? locationMap.get(locationUuid) || itemLocation
        : itemLocation

    if (location && String(locationDisplayName).toLowerCase() !== location.toLowerCase()) {
      return null
    }

    if (vendorUuid) {
      const preferredVendorUuid = item.preferred_vendor_uuid || null
      if (!preferredVendorUuid || String(preferredVendorUuid) !== String(vendorUuid)) {
        return null
      }
    }

    return {
      corporation_name: 'N/A',
      project_name: projectLabel,
      cost_code_uuid: item.cost_code_uuid || null,
      cost_code_number: item.cost_code_number || '',
      cost_code_name: item.cost_code_name || '',
      cost_code_label: item.cost_code_label || 'N/A',
      division_name: item.division_name || '',
      category: item.category || '',
      item_division_uuid: item.item_division_uuid || null,
      preferred_vendor_uuid: item.preferred_vendor_uuid || null,
      estimate_preferred_vendor_name: null,
      vendor_name: vendorUuid ? (filterVendorName || 'N/A') : 'N/A',
      vendor_uuid: vendorUuidForRow || vendorUuid || null,
      sequence: item.sequence || '',
      sequence_uuid: item.sequence_uuid || null,
      item_type_uuid: item.item_type_uuid || null,
      item_type_label: item.item_type_label || '',
      spec_type: item.spec_type || '',
      item_uuid: item.item_uuid || null,
      item_name: item.item_name || '',
      description: item.description || '',
      location: locationDisplayName || '',
      location_uuid: locationUuid,
      unit_price: item.unit_price || 0,
      unit_uuid: item.unit_uuid || null,
      unit_label: item.unit_label || '',
      model_number: item.model_number || '',
      budget_qty: budgetQty,
      po_qty: poQty,
      pending_qty: pendingQty,
      status,
    }
  }

  const poUuids = purchaseOrders.map((po) => po.uuid)
  if (poUuids.length === 0) {
    const result: any[] = []
    for (const item of estimateItemsMap.values()) {
      const row = buildRow(item, 0, null, null)
      if (row) result.push(row)
    }
    return result
  }

  const poItems = await prisma.purchaseOrderItem.findMany({
    where: {
      purchase_order_uuid: { in: poUuids },
      is_active: true,
    },
    select: {
      purchase_order_uuid: true,
      cost_code_uuid: true,
      item_uuid: true,
      quantity: true,
      po_quantity: true,
    },
  })

  const poVendorMap = new Map<string, string>()
  for (const po of purchaseOrders) {
    if (po.uuid && po.vendor_uuid) poVendorMap.set(po.uuid, po.vendor_uuid)
  }

  const poQuantitiesMap = new Map<string, { qty: number; vendorUuid: string | null }>()
  for (const item of poItems) {
    const itemUuid = item.item_uuid || ''
    const costCodeUuid = item.cost_code_uuid || ''
    if (!itemUuid) continue
    const compositeKey = costCodeUuid ? `${itemUuid}-${costCodeUuid}` : itemUuid
    const current = poQuantitiesMap.get(compositeKey) || { qty: 0, vendorUuid: null }
    const itemQty = toNum(item.po_quantity ?? item.quantity)
    const rowVendorUuid = poVendorMap.get(item.purchase_order_uuid) || null
    poQuantitiesMap.set(compositeKey, {
      qty: current.qty + itemQty,
      vendorUuid: rowVendorUuid || current.vendorUuid,
    })
  }

  const result: any[] = []
  for (const item of estimateItemsMap.values()) {
    const itemUuid = item.item_uuid || ''
    const costCodeUuid = item.cost_code_uuid || ''
    if (!itemUuid) continue
    const compositeKey = costCodeUuid ? `${itemUuid}-${costCodeUuid}` : itemUuid
    const poData = poQuantitiesMap.get(compositeKey) || { qty: 0, vendorUuid: null }
    const vendorUuidToUse =
      vendorUuid && vendorUuid !== '' ? vendorUuid : poData.vendorUuid || null
    const row = buildRow(item, poData.qty, vendorUuidToUse, null)
    if (row) result.push(row)
  }

  return result
}
