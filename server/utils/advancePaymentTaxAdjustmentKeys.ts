/** Synthetic keys for advance payment adjustments against invoice tax lines (Sales Tax 1 / 2). */
export const TAX_ADJ_PREFIX = '__tax_'

export function taxAdjustmentKey(taxLineKey: string): string {
  return `${TAX_ADJ_PREFIX}${taxLineKey}`
}

export function isTaxAdjustmentKey(key: string): boolean {
  return typeof key === 'string' && key.startsWith(TAX_ADJ_PREFIX)
}

export function taxLineKeyFromAdjustmentKey(adjustmentKey: string): string {
  return adjustmentKey.slice(TAX_ADJ_PREFIX.length)
}

export function defaultLabelForTaxLineKey(taxLineKey: string): string {
  if (taxLineKey === 'sales_tax_1') return 'Sales Tax 1'
  if (taxLineKey === 'sales_tax_2') return 'Sales Tax 2'
  return taxLineKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
