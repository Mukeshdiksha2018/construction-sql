import { getPrisma } from './prisma'
import { accruedHoldbackFromProgressInvoice } from './vendorInvoiceAccruedHoldback'
import {
  advancePaidDeductionForBalance,
  computeMaterialBalanceToBeInvoicedFromItems,
  isMaterialOrderType,
} from '../../app/utils/materialBalanceToBeInvoiced'
import {
  assembleFinancialBreakdownFromRows,
  assembleFinancialBreakdownMap,
} from './normalizedChildren'

const prisma = getPrisma()

function toNum(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0
  const parsed = parseFloat(String(val))
  return Number.isFinite(parsed) ? parsed : 0
}

async function loadViFinancialByUuid(invoiceUuids: string[]) {
  if (!invoiceUuids.length) return new Map()
  const [chargeRows, taxRows] = await Promise.all([
    prisma.viFinancialCharge.findMany({
      where: { vendor_invoice_uuid: { in: invoiceUuids } },
    }),
    prisma.viFinancialTax.findMany({
      where: { vendor_invoice_uuid: { in: invoiceUuids } },
    }),
  ])
  return assembleFinancialBreakdownMap(chargeRows, taxRows, 'vendor_invoice_uuid')
}

function netVendorInvoiceAmountWithoutTaxes(invoice: {
  amount?: unknown
  financial_breakdown?: unknown
}): number {
  const totalAmount = parseFloat(String(invoice.amount ?? '0')) || 0
  let taxTotal = 0
  const breakdown = invoice.financial_breakdown as any
  if (breakdown && typeof breakdown === 'object') {
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
  }
  return totalAmount - taxTotal
}

function sumProgressInvoicedValue(
  invoices: Array<{ amount?: unknown; financial_breakdown?: unknown }> | null | undefined,
  includeTaxes: boolean,
): number {
  if (!invoices?.length) return 0
  return invoices.reduce(
    (sum, invoice) =>
      sum +
      (includeTaxes ? toNum(invoice.amount) : netVendorInvoiceAmountWithoutTaxes(invoice)),
    0,
  )
}

async function resolveCoContractTotal(changeOrderUuid: string): Promise<number> {
  const [chargeRows, taxRows, materialItems, laborItems] = await Promise.all([
    prisma.coFinancialCharge.findMany({ where: { change_order_uuid: changeOrderUuid } }),
    prisma.coFinancialTax.findMany({ where: { change_order_uuid: changeOrderUuid } }),
    prisma.changeOrderItem.findMany({
      where: { change_order_uuid: changeOrderUuid, is_active: true },
      select: { co_quantity: true, co_unit_price: true, unit_price: true, co_total: true },
    }),
    prisma.laborChangeOrderItem.findMany({
      where: { change_order_uuid: changeOrderUuid, is_active: true },
      select: { co_amount: true },
    }),
  ])

  const itemTotal =
    materialItems.reduce((sum, it) => {
      const line =
        toNum(it.co_total) ||
        toNum(it.co_quantity) * toNum(it.co_unit_price ?? it.unit_price)
      return sum + line
    }, 0) + laborItems.reduce((sum, it) => sum + toNum(it.co_amount), 0)

  const assembled = assembleFinancialBreakdownFromRows(chargeRows, taxRows, {
    item_total: itemTotal,
    total_co_amount: null,
  })
  return toNum(
    assembled.totals.total_co_amount ??
      assembled.totals.total_po_amount ??
      (itemTotal + toNum(assembled.totals.charges_total) + toNum(assembled.totals.tax_total)),
  )
}

export async function getPurchaseOrderInvoiceSummary(purchaseOrderUuid: string) {
  const po = await prisma.purchaseOrderForm.findFirst({
    where: { uuid: purchaseOrderUuid, is_active: true },
    select: { uuid: true, po_type: true, total_po_amount: true },
  })
  if (!po) return null

  const totalPOValue = toNum(po.total_po_amount)

  const advanceInvoices = await prisma.vendorInvoice.findMany({
    where: {
      purchase_order_uuid: purchaseOrderUuid,
      invoice_type: 'AGAINST_ADVANCE_PAYMENT',
      is_active: true,
    },
    select: { uuid: true, amount: true, holdback: true },
  })

  const progressInvoices = await prisma.vendorInvoice.findMany({
    where: {
      purchase_order_uuid: purchaseOrderUuid,
      invoice_type: 'AGAINST_PO',
      is_active: true,
    },
    select: { uuid: true, amount: true, holdback: true },
  })

  const holdbackInvoices = await prisma.vendorInvoice.findMany({
    where: {
      purchase_order_uuid: purchaseOrderUuid,
      invoice_type: 'AGAINST_HOLDBACK_AMOUNT',
      is_active: true,
    },
    select: { uuid: true, amount: true, holdback: true },
  })

  const allInvoiceUuids = [
    ...advanceInvoices.map((i) => i.uuid),
    ...progressInvoices.map((i) => i.uuid),
    ...holdbackInvoices.map((i) => i.uuid),
  ]
  const fbByUuid = await loadViFinancialByUuid(allInvoiceUuids)

  const withBreakdown = <T extends { uuid: string }>(rows: T[]) =>
    rows.map((row) => ({
      ...row,
      financial_breakdown: fbByUuid.get(row.uuid) ?? null,
    }))

  const advanceWithFb = withBreakdown(advanceInvoices)
  const progressWithFb = withBreakdown(progressInvoices)
  const holdbackWithFb = withBreakdown(holdbackInvoices)

  const advancePaid = advanceWithFb.reduce(
    (sum, invoice) => sum + netVendorInvoiceAmountWithoutTaxes(invoice),
    0,
  )
  const advancePaidIncludingTaxes = advanceWithFb.reduce(
    (sum, invoice) => sum + toNum(invoice.amount),
    0,
  )

  const isLaborPO = String(po.po_type ?? '').toUpperCase() === 'LABOR'
  const invoicedValue = sumProgressInvoicedValue(progressWithFb, isLaborPO)

  const holdbackAccruedOnProgress = progressWithFb.reduce(
    (sum, invoice) => sum + accruedHoldbackFromProgressInvoice(invoice),
    0,
  )

  const holdbackReleased = holdbackWithFb.reduce(
    (sum, invoice) => sum + netVendorInvoiceAmountWithoutTaxes(invoice),
    0,
  )

  const holdbackBalanceToBeInvoiced = Math.max(
    0,
    holdbackAccruedOnProgress - holdbackReleased,
  )

  const grossBalanceRemaining = Math.max(
    0,
    totalPOValue -
      advancePaidDeductionForBalance(po.po_type, advancePaid) -
      invoicedValue -
      holdbackReleased,
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

  const vendorInvoiceUuids = progressInvoices.map((i) => i.uuid)

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

  const balanceToBeInvoicedByItems = isMaterialOrderType(po.po_type)
    ? computeMaterialBalanceToBeInvoicedFromItems({
        lineItems: poItemRows,
        invoiceLineItems: poInvoiceItemRows,
      })
    : null

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
    select: { uuid: true, co_type: true },
  })
  if (!co) return null

  const totalCOValue = await resolveCoContractTotal(changeOrderUuid)

  const advanceInvoices = await prisma.vendorInvoice.findMany({
    where: {
      change_order_uuid: changeOrderUuid,
      invoice_type: 'AGAINST_ADVANCE_PAYMENT',
      is_active: true,
    },
    select: { uuid: true, amount: true, holdback: true },
  })

  const progressInvoices = await prisma.vendorInvoice.findMany({
    where: {
      change_order_uuid: changeOrderUuid,
      invoice_type: 'AGAINST_CO',
      is_active: true,
    },
    select: { uuid: true, amount: true, holdback: true },
  })

  const holdbackInvoices = await prisma.vendorInvoice.findMany({
    where: {
      change_order_uuid: changeOrderUuid,
      invoice_type: 'AGAINST_HOLDBACK_AMOUNT',
      is_active: true,
    },
    select: { uuid: true, amount: true, holdback: true },
  })

  const allInvoiceUuids = [
    ...advanceInvoices.map((i) => i.uuid),
    ...progressInvoices.map((i) => i.uuid),
    ...holdbackInvoices.map((i) => i.uuid),
  ]
  const fbByUuid = await loadViFinancialByUuid(allInvoiceUuids)

  const withBreakdown = <T extends { uuid: string }>(rows: T[]) =>
    rows.map((row) => ({
      ...row,
      financial_breakdown: fbByUuid.get(row.uuid) ?? null,
    }))

  const advanceWithFb = withBreakdown(advanceInvoices)
  const progressWithFb = withBreakdown(progressInvoices)
  const holdbackWithFb = withBreakdown(holdbackInvoices)

  const advancePaid = advanceWithFb.reduce(
    (sum, invoice) => sum + netVendorInvoiceAmountWithoutTaxes(invoice),
    0,
  )
  const advancePaidIncludingTaxes = advanceWithFb.reduce(
    (sum, invoice) => sum + toNum(invoice.amount),
    0,
  )

  const isLaborCO = String(co.co_type ?? '').toUpperCase() === 'LABOR'
  const invoicedValue = sumProgressInvoicedValue(progressWithFb, isLaborCO)

  const holdbackAccruedOnProgress = progressWithFb.reduce(
    (sum, invoice) => sum + accruedHoldbackFromProgressInvoice(invoice),
    0,
  )

  const holdbackReleased = holdbackWithFb.reduce(
    (sum, invoice) => sum + netVendorInvoiceAmountWithoutTaxes(invoice),
    0,
  )

  const holdbackBalanceToBeInvoiced = Math.max(
    0,
    holdbackAccruedOnProgress - holdbackReleased,
  )

  const grossBalanceRemaining = Math.max(
    0,
    totalCOValue -
      advancePaidDeductionForBalance(co.co_type, advancePaid) -
      invoicedValue -
      holdbackReleased,
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

  const vendorInvoiceUuids = progressInvoices.map((i) => i.uuid)

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

  const balanceToBeInvoicedByItems = isMaterialOrderType(co.co_type)
    ? computeMaterialBalanceToBeInvoicedFromItems({
        lineItems: coItemRows,
        invoiceLineItems: coInvoiceItemRows,
      })
    : null

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
