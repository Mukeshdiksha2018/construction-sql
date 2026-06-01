import { getPrisma } from '../prisma'
import { normalizeUTC } from './reportHelpers'

const prisma = getPrisma()

function mapChildRow(row: Record<string, unknown>) {
  const mapped = { ...row }
  if (mapped.metadata != null && typeof mapped.metadata === 'string') {
    try {
      mapped.metadata = JSON.parse(mapped.metadata as string)
    } catch {
      mapped.metadata = {}
    }
  }
  return mapped
}

export async function getBudgetPaidData(options: {
  corporationUuid: string
  projectUuid: string
  billDateFrom?: string
  billDateTo?: string
}) {
  const { corporationUuid, projectUuid, billDateFrom, billDateTo } = options
  const from = billDateFrom ? normalizeUTC(billDateFrom, false) : null
  const to = billDateTo ? normalizeUTC(billDateTo, true) : null

  const billDateFilter: { gte?: Date; lte?: Date } = {}
  if (from) billDateFilter.gte = from
  if (to) billDateFilter.lte = to

  const invoices = await prisma.vendorInvoice.findMany({
    where: {
      corporation_uuid: corporationUuid,
      project_uuid: projectUuid,
      status: 'Paid',
      is_active: true,
      ...(Object.keys(billDateFilter).length ? { bill_date: billDateFilter } : {}),
    },
    select: {
      uuid: true,
      corporation_uuid: true,
      project_uuid: true,
      status: true,
      is_active: true,
      invoice_type: true,
      amount: true,
      bill_date: true,
      purchase_order_uuid: true,
      change_order_uuid: true,
    },
  })

  const invoiceUuids = invoices.map((i) => i.uuid)
  if (!invoiceUuids.length) {
    return {
      invoices: [],
      po_invoice_items: [],
      co_invoice_items: [],
      labor_invoice_items: [],
      direct_line_items: [],
      advance_payment_cost_codes: [],
    }
  }

  const [poItems, coItems, laborItems, directItems, advanceCodes] = await Promise.all([
    prisma.purchaseOrderInvoiceItem.findMany({
      where: { vendor_invoice_uuid: { in: invoiceUuids }, is_active: true },
      orderBy: { order_index: 'asc' },
    }),
    prisma.changeOrderInvoiceItem.findMany({
      where: { vendor_invoice_uuid: { in: invoiceUuids }, is_active: true },
      orderBy: { order_index: 'asc' },
    }),
    prisma.laborInvoiceItem.findMany({
      where: { vendor_invoice_uuid: { in: invoiceUuids }, is_active: true },
      orderBy: { order_index: 'asc' },
    }),
    prisma.directVendorInvoiceLineItem.findMany({
      where: { vendor_invoice_uuid: { in: invoiceUuids }, is_active: true },
      orderBy: { order_index: 'asc' },
    }),
    prisma.advancePaymentCostCode.findMany({
      where: { vendor_invoice_uuid: { in: invoiceUuids }, is_active: true },
      orderBy: { created_at: 'asc' },
    }),
  ])

  return {
    invoices: invoices.map((inv) => ({
      ...inv,
      amount: inv.amount != null ? Number(inv.amount) : null,
      bill_date: inv.bill_date?.toISOString?.() ?? inv.bill_date,
    })),
    po_invoice_items: poItems.map((r) => mapChildRow(r as unknown as Record<string, unknown>)),
    co_invoice_items: coItems.map((r) => mapChildRow(r as unknown as Record<string, unknown>)),
    labor_invoice_items: laborItems.map((r) => mapChildRow(r as unknown as Record<string, unknown>)),
    direct_line_items: directItems.map((r) => mapChildRow(r as unknown as Record<string, unknown>)),
    advance_payment_cost_codes: advanceCodes.map((r) => mapChildRow(r as unknown as Record<string, unknown>)),
  }
}
