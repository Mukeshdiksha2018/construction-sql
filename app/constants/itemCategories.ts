export const ITEM_CATEGORIES = [
  { label: 'Material', value: 'MATERIAL' },
  { label: 'Labor', value: 'LABOR' },
  { label: 'Equipment', value: 'EQUIPMENT' },
  { label: 'Subcontract', value: 'SUBCONTRACT' },
  { label: 'Other', value: 'OTHER' },
] as const

export const CATEGORY_OPTIONS = ITEM_CATEGORIES.map(c => ({ ...c }))

export type ItemCategory = (typeof ITEM_CATEGORIES)[number]['value']
