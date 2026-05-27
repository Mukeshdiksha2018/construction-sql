import { bulkCreateCostCodeDivisions, listCostCodeDivisions } from '../../utils/costCodeDivisions'
import { bulkCreateCostCodeConfigurations } from '../../utils/costCodeConfigurations'

/** POST /api/cost-codes/bulk — unified import for divisions + configurations */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const payload = (body ?? {}) as Record<string, unknown>

    const corporationUuid = typeof payload.corporation_uuid === 'string' ? payload.corporation_uuid.trim() : ''
    if (!corporationUuid) throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })

    const divisions = Array.isArray(payload.divisions) ? payload.divisions : []
    const configurations = Array.isArray(payload.configurations) ? payload.configurations : []

    // 1. Create divisions
    const divisionResult = await bulkCreateCostCodeDivisions(corporationUuid, divisions)

    // 2. Build a lookup map: division_number → uuid (from existing + newly created)
    const existingDivisions = await listCostCodeDivisions(corporationUuid)
    const divisionUuidByNumber = new Map<string, string>(
      existingDivisions.map(d => [d.division_number, d.uuid]),
    )

    // 3. Create configurations — two passes to handle parent references
    const configUuidByNumber = new Map<string, string>()

    // First pass: top-level configs (no parent)
    const topLevel = configurations.filter((c: any) => !c.parent_cost_code_number)
    const nested = configurations.filter((c: any) => c.parent_cost_code_number)

    const topResult = await bulkCreateCostCodeConfigurations(
      corporationUuid,
      topLevel,
      divisionUuidByNumber,
      configUuidByNumber,
    )

    // Second pass: nested configs (parent may now be in the map)
    const nestedResult = await bulkCreateCostCodeConfigurations(
      corporationUuid,
      nested,
      divisionUuidByNumber,
      configUuidByNumber,
    )

    const configResult = {
      created: topResult.created + nestedResult.created,
      skipped: topResult.skipped + nestedResult.skipped,
    }

    return {
      success: true,
      data: { divisions: divisionResult, configurations: configResult },
      message: `Import complete. Divisions: ${divisionResult.created} created, ${divisionResult.skipped} skipped. Cost codes: ${configResult.created} created, ${configResult.skipped} skipped.`,
    }
  }
  catch (error: unknown) {
    const err = error as { statusCode?: number; statusMessage?: string }
    throw createError({
      statusCode: err.statusCode ?? 500,
      statusMessage: err.statusMessage ?? 'Failed to bulk import cost codes',
    })
  }
})
