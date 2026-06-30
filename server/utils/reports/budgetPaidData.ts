import { getPrisma } from '../prisma'
import { normalizeUTC } from './reportHelpers'
import {
  isFullyPaidInvoiceStatus,
  isPartiallyPaidInvoiceStatus,
} from '../../app/utils/invoiceReportPaymentTotals'

const prisma = getPrisma()

/** Invoices with payment activity counted toward budget paid amounts (not unpaid). */
const BUDGET_PAID_DATA_INVOICE_STATUSES = ['Paid', 'partially_paid'] as const

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
      status: { in: [...BUDGET_PAID_DATA_INVOICE_STATUSES] },
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
      financial_breakdown: true,
      holdback: true,
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
      holdback_cost_codes: [],
      nimble_paid_by_invoice_uuid: {},
    }
  }

  const [poItems, coItems, laborItems, directItems, advanceCodes, holdbackCodes] =
    await Promise.all([
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
      prisma.holdbackCostCode.findMany({
        where: { vendor_invoice_uuid: { in: invoiceUuids }, is_active: true },
        orderBy: { created_at: 'asc' },
      }),
    ])

  const nimblePaidByInvoiceUuid: Record<string, number> = {}
  for (const invoice of invoices) {
    const amount = invoice.amount != null ? Number(invoice.amount) : 0
    if (isFullyPaidInvoiceStatus(invoice.status)) {
      nimblePaidByInvoiceUuid[invoice.uuid] = amount
    } else if (isPartiallyPaidInvoiceStatus(invoice.status)) {
      // Nimble payment rows not yet ported — partial invoices contribute 0 until integrated.
      nimblePaidByInvoiceUuid[invoice.uuid] = 0
    }
  }

  return {
    invoices: invoices.map((inv) => ({
      ...inv,
      amount: inv.amount != null ? Number(inv.amount) : null,
      bill_date: inv.bill_date?.toISOString?.() ?? inv.bill_date,
      financial_breakdown: inv.financial_breakdown
        ? mapChildRow({ financial_breakdown: inv.financial_breakdown }).financial_breakdown
        : null,
    })),
    po_invoice_items: poItems.map((r) => mapChildRow(r as unknown as Record<string, unknown>)),
    co_invoice_items: coItems.map((r) => mapChildRow(r as unknown as Record<string, unknown>)),
    labor_invoice_items: laborItems.map((r) => mapChildRow(r as unknown as Record<string, unknown>)),
    direct_line_items: directItems.map((r) => mapChildRow(r as unknown as Record<string, unknown>)),
    advance_payment_cost_codes: advanceCodes.map((r) =>
      mapChildRow(r as unknown as Record<string, unknown>),
    ),
    holdback_cost_codes: holdbackCodes.map((r) =>
      mapChildRow(r as unknown as Record<string, unknown>),
    ),
    nimble_paid_by_invoice_uuid: nimblePaidByInvoiceUuid,
  }
}
