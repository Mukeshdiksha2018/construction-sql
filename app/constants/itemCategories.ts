export const CATEGORY_OPTIONS = [
  { value: 'procurement', label: 'Procurement' },
  { value: 'construction', label: 'Construction' },
] as const

export type ItemCategory = (typeof CATEGORY_OPTIONS)[number]['value']

export function getCategoryLabel(value: string): string {
  const found = CATEGORY_OPTIONS.find(c => c.value === value)
  return found ? found.label : value
}
