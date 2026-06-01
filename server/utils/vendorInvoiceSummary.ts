import { getPrisma } from './prisma'
import { accruedHoldbackFromProgressInvoice } from './vendorInvoiceAccruedHoldback'

const prisma = getPrisma()

function parseJson<T = unknown>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback
  try {
    return JSON.parse(val) as T
  } catch {
    return fallback
  }
}

function toNum(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0
  const parsed = parseFloat(String(val))
  return Number.isFinite(parsed) ? parsed : 0
}

function netVendorInvoiceAmountWithoutTaxes(invoice: {
  amount?: unknown
  financial_breakdown?: unknown
}): number {
  const totalAmount = parseFloat(String(invoice.amount ?? '0')) || 0
  let taxTotal = 0
  if (invoice.financial_breakdown) {
    try {
      let breakdown: any = invoice.financial_breakdown
      if (typeof breakdown === 'string') {
        breakdown = JSON.parse(breakdown)
      }
      const totals = breakdown?.totals || breakdown || {}
      if (breakdown?.sales_taxes) {
        const salesTaxes = breakdown.sales_taxes
        const tax1 =
          parseFloat(salesTaxes.sales_tax_1?.amount || salesTaxes.salesTax1?.amount || '0') || 0
        const tax2 =
          parseFloat(salesTaxes.sales_tax_2?.amount || salesTaxes.salesTax2?.amount || '0') || 0
        taxTotal = tax1 + tax2
      } else {
        taxTotal = parseFloat(totals.tax_total || totals.taxTotal || '0') || 0
      }
    } catch {
      taxTotal = 0
    }
  }
  return totalAmount - taxTotal
}

function computeBalanceToBeInvoicedByPoItems(args: {
  poItems: Array<{
    uuid?: string
    po_quantity?: unknown
    po_unit_price?: unknown
    unit_price?: unknown
  }>
  invoiceItems: Array<{ po_item_uuid?: string; invoice_quantity?: unknown }>
  advancePaid: number
}): number | null {
  const { poItems, invoiceItems, advancePaid } = args

  const hasUnitPrice =
    poItems.some((it) => it?.po_unit_price !== null && it?.po_unit_price !== undefined) ||
    poItems.some((it) => it?.unit_price !== null && it?.unit_price !== undefined)
  const hasItemUuid = invoiceItems.some(
    (it) => it?.po_item_uuid !== null && it?.po_item_uuid !== undefined,
  )

  if (!hasUnitPrice || !hasItemUuid) return null

  const invoicedQtyByItemUuid = new Map<string, number>()
  for (const invIt of invoiceItems) {
    if (!invIt?.po_item_uuid) continue
    const prev = invoicedQtyByItemUuid.get(invIt.po_item_uuid) ?? 0
    invoicedQtyByItemUuid.set(
      invIt.po_item_uuid,
      prev + toNum(invIt.invoice_quantity),
    )
  }

  const remainingItemsAmount = poItems.reduce((sum, poIt) => {
    if (!poIt?.uuid) return sum
    const poQty = toNum(poIt.po_quantity)
    const unitPrice = toNum(poIt.po_unit_price ?? poIt.unit_price)
    const invoicedQty = invoicedQtyByItemUuid.get(poIt.uuid) ?? 0
    const remainingQty = Math.max(0, poQty - invoicedQty)
    return sum + remainingQty * unitPrice
  }, 0)

  return Math.max(0, remainingItemsAmount - advancePaid)
}

function computeBalanceToBeInvoicedByCoItems(args: {
  coItems: Array<{
    uuid?: string
    co_quantity?: unknown
    co_unit_price?: unknown
    unit_price?: unknown
  }>
  invoiceItems: Array<{ co_item_uuid?: string; invoice_quantity?: unknown }>
  advancePaid: number
}): number | null {
  const { coItems, invoiceItems, advancePaid } = args

  const hasUnitPrice =
    coItems.some((it) => it?.co_unit_price !== null && it?.co_unit_price !== undefined) ||
    coItems.some((it) => it?.unit_price !== null && it?.unit_price !== undefined)
  const hasItemUuid = invoiceItems.some(
    (it) => it?.co_item_uuid !== null && it?.co_item_uuid !== undefined,
  )

  if (!hasUnitPrice || !hasItemUuid) return null

  const invoicedQtyByItemUuid = new Map<string, number>()
  for (const invIt of invoiceItems) {
    if (!invIt?.co_item_uuid) continue
    const prev = invoicedQtyByItemUuid.get(invIt.co_item_uuid) ?? 0
    invoicedQtyByItemUuid.set(
      invIt.co_item_uuid,
      prev + toNum(invIt.invoice_quantity),
    )
  }

  const remainingItemsAmount = coItems.reduce((sum, coIt) => {
    if (!coIt?.uuid) return sum
    const coQty = toNum(coIt.co_quantity)
    const unitPrice = toNum(coIt.co_unit_price ?? coIt.unit_price)
    const invoicedQty = invoicedQtyByItemUuid.get(coIt.uuid) ?? 0
    const remainingQty = Math.max(0, coQty - invoicedQty)
    return sum + remainingQty * unitPrice
  }, 0)

  return Math.max(0, remainingItemsAmount - advancePaid)
}

export async function getPurchaseOrderInvoiceSummary(purchaseOrderUuid: string) {
  const po = await prisma.purchaseOrderForm.findFirst({
    where: { uuid: purchaseOrderUuid, is_active: true },
    select: { uuid: true, financial_breakdown: true },
  })
  if (!po) return null

  let totalPOValue = 0
  const breakdown = parseJson(po.financial_breakdown, null) as any
  if (breakdown?.totals) {
    totalPOValue = toNum(
      breakdown.totals.total_po_amount ??
        breakdown.totals.totalAmount ??
        breakdown.totals.total,
    )
  }

  const advanceInvoices = await prisma.vendorInvoice.findMany({
    where: {
      purchase_order_uuid: purchaseOrderUuid,
      invoice_type: 'AGAINST_ADVANCE_PAYMENT',
      is_active: true,
    },
    select: { amount: true, financial_breakdown: true },
  })

  const advancePaid = advanceInvoices.reduce(
    (sum, invoice) => sum + netVendorInvoiceAmountWithoutTaxes(invoice),
    0,
  )
  const advancePaidIncludingTaxes = advanceInvoices.reduce(
    (sum, invoice) => sum + toNum(invoice.amount),
    0,
  )

  const progressInvoices = await prisma.vendorInvoice.findMany({
    where: {
      purchase_order_uuid: purchaseOrderUuid,
      invoice_type: 'AGAINST_PO',
      is_active: true,
    },
    select: { amount: true, financial_breakdown: true, holdback: true },
  })

  const invoicedValue = progressInvoices.reduce(
    (sum, invoice) => sum + netVendorInvoiceAmountWithoutTaxes(invoice),
    0,
  )

  const holdbackAccruedOnProgress = progressInvoices.reduce(
    (sum, invoice) => sum + accruedHoldbackFromProgressInvoice(invoice),
    0,
  )

  const holdbackInvoices = await prisma.vendorInvoice.findMany({
    where: {
      purchase_order_uuid: purchaseOrderUuid,
      invoice_type: 'AGAINST_HOLDBACK_AMOUNT',
      is_active: true,
    },
    select: { amount: true, financial_breakdown: true },
  })

  const holdbackReleased = holdbackInvoices.reduce(
    (sum, invoice) => sum + netVendorInvoiceAmountWithoutTaxes(invoice),
    0,
  )

  const holdbackBalanceToBeInvoiced = Math.max(
    0,
    holdbackAccruedOnProgress - holdbackReleased,
  )

  const grossBalanceRemaining = Math.max(
    0,
    totalPOValue - advancePaid - invoicedValue - holdbackReleased,
  )

  const balanceToBeInvoicedLegacy = Math.max(
    0,
    grossBalanceRemaining - holdbackBalanceToBeInvoiced,
  )

  const poItemRows = await prisma.purchaseOrderItem.findMany({
    where: { purchase_order_uuid: purchaseOrderUuid, is_active: true },
    select: { uuid: true, po_quantity: true, po_unit_price: true, unit_price: true },
  })

  const totalPOQuantity = poItemRows.reduce(
    (sum, it) => sum + toNum(it.po_quantity),
    0,
  )

  const vendorInvoiceUuids = (
    await prisma.vendorInvoice.findMany({
      where: {
        purchase_order_uuid: purchaseOrderUuid,
        invoice_type: 'AGAINST_PO',
        is_active: true,
      },
      select: { uuid: true },
    })
  ).map((i) => i.uuid)

  let invoicedQuantity = 0
  let poInvoiceItemRows: Array<{ po_item_uuid?: string; invoice_quantity?: unknown }> = []

  if (vendorInvoiceUuids.length > 0) {
    const rows = await prisma.purchaseOrderInvoiceItem.findMany({
      where: { vendor_invoice_uuid: { in: vendorInvoiceUuids }, is_active: true },
      select: { po_item_uuid: true, invoice_quantity: true },
    })
    poInvoiceItemRows = rows.map((it) => ({
      po_item_uuid: it.po_item_uuid ?? undefined,
      invoice_quantity: it.invoice_quantity,
    }))
    invoicedQuantity = rows.reduce((sum, it) => sum + toNum(it.invoice_quantity), 0)
  }

  const qtyRemainingToBeInvoiced = Math.max(0, totalPOQuantity - invoicedQuantity)

  const balanceToBeInvoicedByItems = computeBalanceToBeInvoicedByPoItems({
    poItems: poItemRows,
    invoiceItems: poInvoiceItemRows,
    advancePaid,
  })

  const balanceToBeInvoiced = balanceToBeInvoicedByItems ?? balanceToBeInvoicedLegacy

  return {
    purchase_order_uuid: purchaseOrderUuid,
    total_po_value: totalPOValue,
    advance_paid: advancePaid,
    advance_paid_including_taxes: advancePaidIncludingTaxes,
    invoiced_value: invoicedValue,
    holdback_released: holdbackReleased,
    holdback_balance_to_be_invoiced: holdbackBalanceToBeInvoiced,
    balance_to_be_invoiced: balanceToBeInvoiced,
    total_po_quantity: totalPOQuantity,
    invoiced_quantity: invoicedQuantity,
    qty_remaining_to_be_invoiced: qtyRemainingToBeInvoiced,
  }
}

export async function getChangeOrderInvoiceSummary(changeOrderUuid: string) {
  const co = await prisma.changeOrder.findFirst({
    where: { uuid: changeOrderUuid, is_active: true },
    select: { uuid: true, financial_breakdown: true },
  })
  if (!co) return null

  let totalCOValue = 0
  const breakdown = parseJson(co.financial_breakdown, null) as any
  if (breakdown?.totals) {
    totalCOValue = toNum(
      breakdown.totals.total_co_amount ??
        breakdown.totals.totalAmount ??
        breakdown.totals.total,
    )
  }

  const advanceInvoices = await prisma.vendorInvoice.findMany({
    where: {
      change_order_uuid: changeOrderUuid,
      invoice_type: 'AGAINST_ADVANCE_PAYMENT',
      is_active: true,
    },
    select: { amount: true, financial_breakdown: true },
  })

  const advancePaid = advanceInvoices.reduce(
    (sum, invoice) => sum + netVendorInvoiceAmountWithoutTaxes(invoice),
    0,
  )
  const advancePaidIncludingTaxes = advanceInvoices.reduce(
    (sum, invoice) => sum + toNum(invoice.amount),
    0,
  )

  const progressInvoices = await prisma.vendorInvoice.findMany({
    where: {
      change_order_uuid: changeOrderUuid,
      invoice_type: 'AGAINST_CO',
      is_active: true,
    },
    select: { amount: true, financial_breakdown: true, holdback: true },
  })

  const invoicedValue = progressInvoices.reduce(
    (sum, invoice) => sum + netVendorInvoiceAmountWithoutTaxes(invoice),
    0,
  )

  const holdbackAccruedOnProgress = progressInvoices.reduce(
    (sum, invoice) => sum + accruedHoldbackFromProgressInvoice(invoice),
    0,
  )

  const holdbackInvoices = await prisma.vendorInvoice.findMany({
    where: {
      change_order_uuid: changeOrderUuid,
      invoice_type: 'AGAINST_HOLDBACK_AMOUNT',
      is_active: true,
    },
    select: { amount: true, financial_breakdown: true },
  })

  const holdbackReleased = holdbackInvoices.reduce(
    (sum, invoice) => sum + netVendorInvoiceAmountWithoutTaxes(invoice),
    0,
  )

  const holdbackBalanceToBeInvoiced = Math.max(
    0,
    holdbackAccruedOnProgress - holdbackReleased,
  )

  const grossBalanceRemaining = Math.max(
    0,
    totalCOValue - advancePaid - invoicedValue - holdbackReleased,
  )

  const balanceToBeInvoicedLegacy = Math.max(
    0,
    grossBalanceRemaining - holdbackBalanceToBeInvoiced,
  )

  const coItemRows = await prisma.changeOrderItem.findMany({
    where: { change_order_uuid: changeOrderUuid, is_active: true },
    select: { uuid: true, co_quantity: true, co_unit_price: true, unit_price: true },
  })

  const totalCOQuantity = coItemRows.reduce((sum, it) => sum + toNum(it.co_quantity), 0)

  const vendorInvoiceUuids = (
    await prisma.vendorInvoice.findMany({
      where: {
        change_order_uuid: changeOrderUuid,
        invoice_type: 'AGAINST_CO',
        is_active: true,
      },
      select: { uuid: true },
    })
  ).map((i) => i.uuid)

  let invoicedQuantity = 0
  let coInvoiceItemRows: Array<{ co_item_uuid?: string; invoice_quantity?: unknown }> = []

  if (vendorInvoiceUuids.length > 0) {
    const rows = await prisma.changeOrderInvoiceItem.findMany({
      where: { vendor_invoice_uuid: { in: vendorInvoiceUuids }, is_active: true },
      select: { co_item_uuid: true, invoice_quantity: true },
    })
    coInvoiceItemRows = rows.map((it) => ({
      co_item_uuid: it.co_item_uuid ?? undefined,
      invoice_quantity: it.invoice_quantity,
    }))
    invoicedQuantity = rows.reduce((sum, it) => sum + toNum(it.invoice_quantity), 0)
  }

  const qtyRemainingToBeInvoiced = Math.max(0, totalCOQuantity - invoicedQuantity)

  const balanceToBeInvoicedByItems = computeBalanceToBeInvoicedByCoItems({
    coItems: coItemRows,
    invoiceItems: coInvoiceItemRows,
    advancePaid,
  })

  const balanceToBeInvoiced = balanceToBeInvoicedByItems ?? balanceToBeInvoicedLegacy

  return {
    change_order_uuid: changeOrderUuid,
    total_co_value: totalCOValue,
    advance_paid: advancePaid,
    advance_paid_including_taxes: advancePaidIncludingTaxes,
    invoiced_value: invoicedValue,
    holdback_released: holdbackReleased,
    holdback_balance_to_be_invoiced: holdbackBalanceToBeInvoiced,
    balance_to_be_invoiced: balanceToBeInvoiced,
    total_co_quantity: totalCOQuantity,
    invoiced_quantity: invoicedQuantity,
    qty_remaining_to_be_invoiced: qtyRemainingToBeInvoiced,
  }
}
