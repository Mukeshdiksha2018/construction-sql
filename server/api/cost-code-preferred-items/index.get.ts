import { getPrisma } from '../../utils/prisma'

/**
 * GET /api/cost-code-preferred-items?corporation_uuid=...&project_uuid=...&vendor_uuid=...
 *
 * Returns a flat list of active preferred items for the given corporation,
 * enriched with their cost code configuration and item type labels.
 *
 * project_uuid: if provided, includes items scoped to that project OR with no project set.
 * vendor_uuid:  if provided, further filters to items with that preferred vendor.
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const corporationUuid = String(query.corporation_uuid ?? '').trim()
    const projectUuid = String(query.project_uuid ?? '').trim() || undefined
    const vendorUuid = String(query.vendor_uuid ?? '').trim() || undefined

    if (!corporationUuid) {
      throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
    }

    const prisma = getPrisma()

    const whereClause: any = {
      corporation_uuid: corporationUuid,
      is_active: true,
    }

    if (projectUuid) {
      whereClause.OR = [{ project_uuid: null }, { project_uuid: projectUuid }]
    } else {
      whereClause.project_uuid = null
    }

    if (vendorUuid) {
      whereClause.preferred_vendor_uuid = vendorUuid
    }

    const preferredItems = await prisma.costCodePreferredItem.findMany({
      where: whereClause,
      orderBy: [{ item_name: 'asc' }],
    })

    if (preferredItems.length === 0) {
      return { success: true, data: [] }
    }

    // Collect unique UUIDs for batch enrichment
    const configUuids = [...new Set(
      preferredItems.map((i: any) => i.cost_code_configuration_uuid).filter(Boolean),
    )] as string[]

    const itemTypeUuids = [...new Set(
      preferredItems.map((i: any) => i.item_type_uuid).filter(Boolean),
    )] as string[]

    const [configs, itemTypes] = await Promise.all([
      configUuids.length > 0
        ? prisma.costCodeConfiguration.findMany({
            where: { uuid: { in: configUuids } },
            select: {
              uuid: true,
              cost_code_number: true,
              cost_code_name: true,
              division_uuid: true,
            },
          })
        : [],
      itemTypeUuids.length > 0
        ? prisma.itemType.findMany({
            where: { uuid: { in: itemTypeUuids } },
            select: { uuid: true, item_type: true, category: true },
          })
        : [],
    ])

    // Fetch division names for all division UUIDs found in configs
    const divisionUuids = [...new Set(
      (configs as any[]).map((c: any) => c.division_uuid).filter(Boolean),
    )] as string[]

    const divisions = divisionUuids.length > 0
      ? await prisma.costCodeDivision.findMany({
          where: { uuid: { in: divisionUuids } },
          select: { uuid: true, division_name: true },
        })
      : []

    const configMap = new Map<string, any>()
    for (const c of configs as any[]) configMap.set(c.uuid, c)

    const divisionMap = new Map<string, any>()
    for (const d of divisions as any[]) divisionMap.set(d.uuid, d)

    const itemTypeMap = new Map<string, any>()
    for (const t of itemTypes as any[]) itemTypeMap.set(t.uuid, t)

    const data = preferredItems.map((item: any) => {
      const config = item.cost_code_configuration_uuid
        ? (configMap.get(item.cost_code_configuration_uuid) ?? {})
        : {}
      const division = config.division_uuid
        ? (divisionMap.get(config.division_uuid) ?? {})
        : {}
      const itemType = item.item_type_uuid
        ? (itemTypeMap.get(item.item_type_uuid) ?? {})
        : {}

      const costCodeNumber = config.cost_code_number ?? ''
      const costCodeName = config.cost_code_name ?? ''
      const itemTypeLabel = itemType.item_type ?? ''
      const categoryRaw = String(itemType.category ?? '').trim().toLowerCase()

      return {
        id: Number(item.id),
        uuid: item.uuid,
        item_uuid: item.uuid,
        corporation_uuid: item.corporation_uuid,
        project_uuid: item.project_uuid ?? null,
        preferred_vendor_uuid: item.preferred_vendor_uuid ?? null,
        cost_code_configuration_uuid: item.cost_code_configuration_uuid ?? null,
        cost_code_uuid: item.cost_code_configuration_uuid ?? null,
        cost_code_number: costCodeNumber,
        cost_code_name: costCodeName,
        cost_code_label: [costCodeNumber, costCodeName].filter(Boolean).join(' ').trim(),
        division_uuid: config.division_uuid ?? null,
        division_name: division.division_name ?? '',
        item_type_uuid: item.item_type_uuid ?? null,
        item_type_label: itemTypeLabel,
        item_category_label: categoryRaw
          ? categoryRaw.charAt(0).toUpperCase() + categoryRaw.slice(1)
          : '',
        item_name: item.item_name ?? '',
        description: item.description ?? '',
        item_description: item.description ?? '',
        item_sequence: item.item_sequence ?? null,
        sequence: item.item_sequence ?? null,
        model_number: item.model_number ?? null,
        unit_price: item.unit_price != null ? Number(item.unit_price) : 0,
        uom_uuid: item.uom_uuid ?? null,
        unit: item.uom_uuid ?? '',
        unit_label: item.uom_uuid ?? '',
        unit_uuid: item.uom_uuid ?? null,
        location_uuid: item.location_uuid ?? null,
        initial_quantity: item.initial_quantity != null ? Number(item.initial_quantity) : 0,
        quantity: item.initial_quantity != null ? Number(item.initial_quantity) : 0,
        as_of_date: item.as_of_date ?? null,
        reorder_point: item.reorder_point != null ? Number(item.reorder_point) : null,
        maximum_limit: item.maximum_limit != null ? Number(item.maximum_limit) : null,
        status: item.status ?? (item.is_active ? 'Active' : 'Inactive'),
        is_active: item.is_active,
      }
    })

    return { success: true, data }
  }
  catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message || 'Internal server error' })
  }
})
