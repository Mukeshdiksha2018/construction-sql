export type MaterialOrderLineItem = {
  uuid?: string
  po_quantity?: unknown
  co_quantity?: unknown
  quantity?: unknown
  po_unit_price?: unknown
  co_unit_price?: unknown
  unit_price?: unknown
}

export type MaterialInvoiceLineItem = {
  po_item_uuid?: string
  co_item_uuid?: string
  invoice_quantity?: unknown
}

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const parsed = parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : 0
}

const lineQuantity = (item: MaterialOrderLineItem): number =>
  toNumber(item.po_quantity ?? item.co_quantity ?? item.quantity)

const lineUnitPrice = (item: MaterialOrderLineItem): number =>
  toNumber(item.po_unit_price ?? item.co_unit_price ?? item.unit_price)

const lineItemUuid = (invoiceItem: MaterialInvoiceLineItem): string | undefined =>
  invoiceItem.po_item_uuid ?? invoiceItem.co_item_uuid

/**
 * Material PO/CO "Balance to be Invoiced" = sum(remaining_qty_per_item * unit_price).
 * Remaining qty per item = max(0, order_qty - invoiced_qty).
 */
export function computeMaterialBalanceToBeInvoicedFromItems(args: {
  lineItems: MaterialOrderLineItem[]
  invoiceLineItems?: MaterialInvoiceLineItem[]
}): number | null {
  const { lineItems, invoiceLineItems = [] } = args

  const hasUnitPrice = lineItems.some(
    (item) =>
      (item.po_unit_price !== null && item.po_unit_price !== undefined) ||
      (item.co_unit_price !== null && item.co_unit_price !== undefined) ||
      (item.unit_price !== null && item.unit_price !== undefined),
  )

  if (!hasUnitPrice || lineItems.length === 0) return null

  const invoicedQtyByItemUuid = new Map<string, number>()
  for (const invoiceItem of invoiceLineItems) {
    const itemUuid = lineItemUuid(invoiceItem)
    if (!itemUuid) continue
    const prev = invoicedQtyByItemUuid.get(itemUuid) ?? 0
    invoicedQtyByItemUuid.set(
      itemUuid,
      prev + toNumber(invoiceItem.invoice_quantity),
    )
  }

  const remainingItemsAmount = lineItems.reduce((sum, lineItem) => {
    if (!lineItem.uuid) return sum
    const orderQty = lineQuantity(lineItem)
    const unitPrice = lineUnitPrice(lineItem)
    const invoicedQty = invoicedQtyByItemUuid.get(lineItem.uuid) ?? 0
    const remainingQty = Math.max(0, orderQty - invoicedQty)
    return sum + remainingQty * unitPrice
  }, 0)

  return Math.max(0, remainingItemsAmount)
}

export function isMaterialOrderType(orderType: string | undefined | null): boolean {
  return String(orderType ?? '').toUpperCase() === 'MATERIAL'
}

/** Advance paid reduces legacy balance-to-be-invoiced for labor (non-material) PO/CO only. */
export function advancePaidDeductionForBalance(
  orderType: string | undefined | null,
  advancePaid: number,
): number {
  return isMaterialOrderType(orderType) ? 0 : toNumber(advancePaid)
}
