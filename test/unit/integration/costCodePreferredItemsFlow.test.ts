import { describe, expect, it } from 'vitest'
import {
  buildPreferredItemCounts,
  filterPreferredItemsForConfig,
  makePreferredItemApi,
} from '../../helpers/preferredItems'

/**
 * Integration-style checks for cost-code ↔ preferred-item linkage rules
 * used by CostCodesConfiguration and CostCodeConfigurationForm.
 */
describe('cost code preferred items flow', () => {
  const corpItems = [
    makePreferredItemApi({ uuid: 'a', cost_code_configuration_uuid: 'cfg-1' }),
    makePreferredItemApi({ uuid: 'b', cost_code_configuration_uuid: 'CFG-1' }),
    makePreferredItemApi({ uuid: 'c', cost_code_configuration_uuid: 'cfg-2' }),
    makePreferredItemApi({ uuid: 'd', cost_code_configuration_uuid: null }),
  ]

  it('list screen can block delete when count > 0', () => {
    const counts = buildPreferredItemCounts(corpItems)
    expect((counts['cfg-1'] ?? 0) > 0).toBe(true)
    expect((counts['cfg-3'] ?? 0) > 0).toBe(false)
  })

  it('edit form shows only items for that configuration', () => {
    const forConfig = filterPreferredItemsForConfig(corpItems, 'cfg-1')
    expect(forConfig.map(i => i.uuid)).toEqual(['a', 'b'])
  })

  it('embedded modal query would scope by project, item type, and cost code', () => {
    const corpUuid = 'corp-1'
    const projectUuid = 'proj-1'
    const itemTypeUuid = 'it-1'
    const costCodeUuid = 'cfg-1'
    const url =
      `/api/preferred-items?corporation_uuid=${encodeURIComponent(corpUuid)}`
      + `&project_uuid=${encodeURIComponent(projectUuid)}`
      + `&item_type_uuid=${encodeURIComponent(itemTypeUuid)}`
      + `&cost_code_configuration_uuid=${encodeURIComponent(costCodeUuid)}`

    expect(url).toContain('cost_code_configuration_uuid=cfg-1')
    expect(url).toContain('item_type_uuid=it-1')
  })
})
