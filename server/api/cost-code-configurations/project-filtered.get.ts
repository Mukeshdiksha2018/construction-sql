import { getPrisma } from '../../utils/prisma'

/**
 * GET /api/cost-code-configurations/project-filtered?corporation_uuid=...&project_uuid=...
 *
 * Returns active cost-code configurations with their preferred items filtered
 * to rows that belong to the given project (or have no project set).
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const corporationUuid = String(query.corporation_uuid ?? '').trim()
    const projectUuid = String(query.project_uuid ?? '').trim()

    if (!corporationUuid) {
      throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
    }
    if (!projectUuid) {
      throw createError({ statusCode: 400, statusMessage: 'project_uuid is required for project-filtered endpoint' })
    }

    const prisma = getPrisma()

    const configs = await prisma.costCodeConfiguration.findMany({
      where: { corporation_uuid: corporationUuid, is_active: true },
      orderBy: { order_number: 'asc' },
    })

    const configUuids = configs.map((c: any) => c.uuid)

    const preferredItems = configUuids.length > 0
      ? await prisma.costCodePreferredItem.findMany({
          where: {
            corporation_uuid: corporationUuid,
            cost_code_configuration_uuid: { in: configUuids },
            OR: [
              { project_uuid: null },
              { project_uuid: projectUuid },
            ],
          },
        })
      : []

    const itemsByConfig = new Map<string, any[]>()
    for (const item of preferredItems) {
      const key = item.cost_code_configuration_uuid ?? ''
      if (!itemsByConfig.has(key)) itemsByConfig.set(key, [])
      itemsByConfig.get(key)!.push(item)
    }

    const data = configs.map((config: any) => {
      const configItems = itemsByConfig.get(config.uuid) || []
      return {
        id: config.id,
        uuid: config.uuid,
        corporation_uuid: config.corporation_uuid,
        division_uuid: config.division_uuid,
        cost_code_number: config.cost_code_number,
        cost_code_name: config.cost_code_name,
        parent_cost_code_uuid: config.parent_cost_code_uuid,
        order: config.order_number,
        gl_account_uuid: config.gl_account_uuid,
        effective_from: config.effective_from,
        description: config.description,
        update_previous_transactions: config.update_previous_transactions,
        is_active: config.is_active,
        created_at: config.created_at,
        updated_at: config.updated_at,
        preferred_items: configItems.map((item: any) => ({
          id: item.id,
          uuid: item.uuid,
          corporation_uuid: item.corporation_uuid,
          item_type_uuid: item.item_type_uuid,
          project_uuid: item.project_uuid,
          item_name: item.item_name,
          item_sequence: item.item_sequence,
          item_uuid: item.uuid,
          model_number: item.model_number,
          unit_price: item.unit_price,
          unit: item.uom_uuid,
          unit_uuid: item.uom_uuid,
          description: item.description,
          status: item.status || (item.is_active ? 'Active' : 'Inactive'),
          is_active: item.is_active,
          location_uuid: item.location_uuid ?? null,
          preferred_vendor_uuid: item.preferred_vendor_uuid ?? null,
        })),
      }
    })

    return { success: true, data }
  }
  catch (error: any) {
    if (error.statusCode) throw error
    throw createError({ statusCode: 500, statusMessage: error.message || 'Internal server error' })
  }
})
