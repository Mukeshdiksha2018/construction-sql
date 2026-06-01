export const makePreferredItemApi = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  uuid: 'item-uuid-1',
  corporation_uuid: 'corp-1',
  project_uuid: 'proj-1',
  cost_code_configuration_uuid: 'cfg-uuid-1',
  item_type_uuid: 'it-1',
  category: 'construction',
  item_name: 'Steel Beam 10ft',
  item_sequence: 'SB-001',
  model_number: null,
  unit_price: 49.99,
  uom_uuid: 'uom-uuid-kg',
  location_uuid: null,
  preferred_vendor_uuid: null,
  initial_quantity: null,
  as_of_date: null,
  reorder_point: null,
  maximum_limit: null,
  description: null,
  status: 'Active',
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

export const makeCostCodeConfigApi = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  uuid: 'cfg-uuid-1',
  corporation_uuid: 'corp-1',
  division_uuid: null,
  cost_code_number: '01-100',
  cost_code_name: 'General Conditions',
  parent_cost_code_uuid: null,
  order_number: 1,
  gl_account_uuid: null,
  effective_from: null,
  description: null,
  update_previous_transactions: false,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

/** Mirrors CostCodesConfiguration preferred-item count aggregation. */
export function buildPreferredItemCounts(
  items: Array<{ cost_code_configuration_uuid?: string | null }>,
) {
  const counts: Record<string, number> = {}
  for (const item of items) {
    const key = String(item.cost_code_configuration_uuid ?? '').trim().toLowerCase()
    if (key) counts[key] = (counts[key] || 0) + 1
  }
  return counts
}

/** Mirrors CostCodeConfigurationForm filter for a single cost code. */
export function filterPreferredItemsForConfig(
  items: Array<{ cost_code_configuration_uuid?: string | null }>,
  configUuid: string,
) {
  const key = String(configUuid).trim().toLowerCase()
  return items.filter(
    item => String(item.cost_code_configuration_uuid ?? '').trim().toLowerCase() === key,
  )
}
