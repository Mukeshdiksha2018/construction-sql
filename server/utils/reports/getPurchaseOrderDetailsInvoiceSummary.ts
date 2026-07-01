import type { H3Event } from 'h3'
import { buildAdjustedAdvancePaymentAmountsMap } from '../../../app/utils/adjustedAdvancePaymentAggregates'
import {
  collectNimblePaidInvoiceUuids,
  filterReportEligibleVendorInvoices,
  isFullyPaidInvoiceStatus,
  isPartiallyPaidInvoiceStatus,
  parseInvoiceAmountFromRecord,
} from '../../../app/utils/invoiceReportPaymentTotals'
import { toReportRangeEndIso, toReportRangeStartIso } from '../../../app/utils/calendarDateRange'
import { decorateChangeOrderRecord } from '../../api/change-orders/utils'
import { decoratePurchaseOrderRecord } from '../financialBreakdown'
import { getPrisma } from '../prisma'
import { parseJson, normalizeUTC } from './reportHelpers'
import { fetchNimbleVendorNamesForUuids } from './nimbleVendorsForReport'
import {
  buildLaborItemTotalsByOrderUuid,
  buildMaterialItemTotalsByOrderUuid,
  buildPoCoInvoiceSummaryVendorGroups,
  isReportEligibleOrderStatus,
  isWithinReportDateRange,
  normalizeStatusForFilter,
  resolveOrderItemTotalFromRecord,
  type PoCoInvoiceSummaryVendorGroup,
} from './purchaseOrderDetailsInvoiceSummaryReport'

const prisma = getPrisma()

function normalizeReportDateBound(val: string, endOfDay = false): string {
  const s = String(val || '').trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return endOfDay ? `${s}T23:59:59.999Z` : `${s}T00:00:00.000Z`
  }
  return s
}

function mapRecord(row: Record<string, unknown>) {
  const mapped = { ...row }
  for (const key of ['financial_breakdown', 'attachments', 'metadata']) {
    if (mapped[key] != null && typeof mapped[key] === 'string') {
      mapped[key] = parseJson(mapped[key], null)
    }
  }
  if (mapped.entry_date instanceof Date) {
    mapped.entry_date = mapped.entry_date.toISOString()
  }
  if (mapped.created_date instanceof Date) {
    mapped.created_date = mapped.created_date.toISOString()
  }
  if (mapped.created_at instanceof Date) {
    mapped.created_at = mapped.created_at.toISOString()
  }
  return mapped
}

async function enrichInvoicesWithAdjustedAdvanceAmounts(
  invoices: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  const progressInvoiceUuids = invoices
    .filter((invoice) => {
      const type = String(invoice.invoice_type || '').toUpperCase()
      return type === 'AGAINST_PO' || type === 'AGAINST_CO'
    })
    .map(invoice => String(invoice.uuid || '').trim())
    .filter(Boolean)

  if (!progressInvoiceUuids.length) return invoices

  const rows = await prisma.adjustedAdvancePaymentCostCode.findMany({
    where: {
      vendor_invoice_uuid: { in: progressInvoiceUuids },
      is_active: true,
    },
    select: {
      vendor_invoice_uuid: true,
      advance_payment_uuid: true,
      cost_code_uuid: true,
      adjusted_amount: true,
      metadata: true,
    },
  })

  const rowsByInvoiceUuid = new Map<string, Record<string, unknown>[]>()
  for (const row of rows) {
    const invoiceUuid = String(row.vendor_invoice_uuid || '').trim()
    if (!invoiceUuid) continue
    const existing = rowsByInvoiceUuid.get(invoiceUuid) || []
    existing.push({
      ...row,
      adjusted_amount: row.adjusted_amount != null ? Number(row.adjusted_amount) : 0,
      metadata: parseJson(row.metadata, {}),
    })
    rowsByInvoiceUuid.set(invoiceUuid, existing)
  }

  return invoices.map((invoice) => {
    const invoiceUuid = String(invoice.uuid || '').trim()
    const advanceRows = rowsByInvoiceUuid.get(invoiceUuid)
    if (!advanceRows?.length) return invoice
    return {
      ...invoice,
      adjusted_advance_payment_amounts: buildAdjustedAdvancePaymentAmountsMap(advanceRows),
    }
  })
}

async function buildItemTotalsForProject(
  projectUuid: string,
  purchaseOrders: Record<string, unknown>[],
  changeOrders: Record<string, unknown>[],
): Promise<Map<string, number>> {
  const totals = new Map<string, number>()

  const needsPoItemFetch = purchaseOrders.some(
    po => resolveOrderItemTotalFromRecord(po, totals) <= 0,
  )
  const needsCoItemFetch = changeOrders.some(
    co => resolveOrderItemTotalFromRecord(co, totals) <= 0,
  )

  if (!needsPoItemFetch && !needsCoItemFetch) return totals

  const fetches: Promise<void>[] = []

  if (needsPoItemFetch) {
    fetches.push(
      (async () => {
        const materialItems = await prisma.purchaseOrderItem.findMany({
          where: { project_uuid: projectUuid, is_active: true },
          select: {
            purchase_order_uuid: true,
            po_total: true,
            total: true,
            po_quantity: true,
            po_unit_price: true,
            quantity: true,
            unit_price: true,
          },
        })
        for (const [uuid, amount] of buildMaterialItemTotalsByOrderUuid(
          materialItems.map(item => ({
            ...item,
            po_total: item.po_total != null ? Number(item.po_total) : null,
            total: item.total != null ? Number(item.total) : null,
            po_quantity: item.po_quantity != null ? Number(item.po_quantity) : null,
            po_unit_price: item.po_unit_price != null ? Number(item.po_unit_price) : null,
            quantity: item.quantity != null ? Number(item.quantity) : null,
            unit_price: item.unit_price != null ? Number(item.unit_price) : null,
          })),
          'purchase_order_uuid',
        )) {
          totals.set(uuid, amount)
        }

        const laborItems = await prisma.laborPurchaseOrderItem.findMany({
          where: { project_uuid: projectUuid, is_active: true },
          select: {
            purchase_order_uuid: true,
            po_amount: true,
          },
        })
        for (const [uuid, amount] of buildLaborItemTotalsByOrderUuid(
          laborItems.map(item => ({
            ...item,
            po_amount: item.po_amount != null ? Number(item.po_amount) : null,
          })),
          'purchase_order_uuid',
        )) {
          totals.set(uuid, (totals.get(uuid) || 0) + amount)
        }
      })(),
    )
  }

  if (needsCoItemFetch) {
    fetches.push(
      (async () => {
        const materialItems = await prisma.changeOrderItem.findMany({
          where: { project_uuid: projectUuid, is_active: true },
          select: {
            change_order_uuid: true,
            co_total: true,
            total: true,
            co_quantity: true,
            co_unit_price: true,
            quantity: true,
            unit_price: true,
          },
        })
        for (const [uuid, amount] of buildMaterialItemTotalsByOrderUuid(
          materialItems.map(item => ({
            ...item,
            co_total: item.co_total != null ? Number(item.co_total) : null,
            total: item.total != null ? Number(item.total) : null,
            co_quantity: item.co_quantity != null ? Number(item.co_quantity) : null,
            co_unit_price: item.co_unit_price != null ? Number(item.co_unit_price) : null,
            quantity: item.quantity != null ? Number(item.quantity) : null,
            unit_price: item.unit_price != null ? Number(item.unit_price) : null,
          })),
          'change_order_uuid',
        )) {
          totals.set(uuid, amount)
        }

        const laborItems = await prisma.laborChangeOrderItem.findMany({
          where: { project_uuid: projectUuid, is_active: true },
          select: {
            change_order_uuid: true,
            co_amount: true,
          },
        })
        for (const [uuid, amount] of buildLaborItemTotalsByOrderUuid(
          laborItems.map(item => ({
            ...item,
            co_amount: item.co_amount != null ? Number(item.co_amount) : null,
          })),
          'change_order_uuid',
        )) {
          totals.set(uuid, (totals.get(uuid) || 0) + amount)
        }
      })(),
    )
  }

  await Promise.all(fetches)
  return totals
}

function buildNimblePaidByInvoiceUuid(invoices: Record<string, unknown>[]): Record<string, number> {
  const nimblePaidByInvoiceUuid: Record<string, number> = {}
  for (const invoice of invoices) {
    const uuid = String(invoice.uuid || '').trim()
    if (!uuid) continue
    if (isFullyPaidInvoiceStatus(invoice.status)) {
      nimblePaidByInvoiceUuid[uuid] = parseInvoiceAmountFromRecord(invoice)
    }
    else if (isPartiallyPaidInvoiceStatus(invoice.status)) {
      nimblePaidByInvoiceUuid[uuid] = 0
    }
  }
  return nimblePaidByInvoiceUuid
}

export async function getPurchaseOrderDetailsInvoiceSummary(
  event: H3Event,
  options: {
    corporationUuid: string
    projectUuid: string
    startDate: string
    endDate: string
    entryDateFrom?: string
    entryDateTo?: string
    vendorUuid?: string
    poStatusFilter?: string
  },
): Promise<PoCoInvoiceSummaryVendorGroup[]> {
  const {
    corporationUuid,
    projectUuid,
    startDate,
    endDate,
    entryDateFrom,
    entryDateTo,
    vendorUuid,
    poStatusFilter,
  } = options

  const entryDateFromIso = normalizeReportDateBound(
    entryDateFrom || toReportRangeStartIso(startDate),
    false,
  )
  const entryDateToIso = normalizeReportDateBound(
    entryDateTo || toReportRangeEndIso(endDate),
    true,
  )

  const entryFrom = normalizeUTC(entryDateFromIso, false)
  const entryTo = normalizeUTC(entryDateToIso, true)

  const poWhere: Record<string, unknown> = {
    corporation_uuid: corporationUuid,
    project_uuid: projectUuid,
    is_active: true,
  }
  const coWhere: Record<string, unknown> = {
    corporation_uuid: corporationUuid,
    project_uuid: projectUuid,
    is_active: true,
  }
  if (vendorUuid) {
    poWhere.vendor_uuid = vendorUuid
    coWhere.vendor_uuid = vendorUuid
  }
  if (entryFrom || entryTo) {
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (entryFrom) dateFilter.gte = entryFrom
    if (entryTo) dateFilter.lte = entryTo
    poWhere.entry_date = dateFilter
    coWhere.created_date = dateFilter
  }

  const [purchaseOrdersRaw, changeOrdersRaw, invoicesRaw] = await Promise.all([
    prisma.purchaseOrderForm.findMany({
      where: poWhere,
      select: {
        uuid: true,
        vendor_uuid: true,
        project_uuid: true,
        entry_date: true,
        created_at: true,
        po_number: true,
        status: true,
        po_type: true,
        financial_breakdown: true,
        currency_conversion_enabled: true,
        currency_from: true,
        currency_to: true,
        conversion_rate: true,
      },
    }),
    prisma.changeOrder.findMany({
      where: coWhere,
      select: {
        uuid: true,
        vendor_uuid: true,
        project_uuid: true,
        created_date: true,
        created_at: true,
        co_number: true,
        status: true,
        co_type: true,
        financial_breakdown: true,
        currency_conversion_enabled: true,
        currency_from: true,
        currency_to: true,
        conversion_rate: true,
      },
    }),
    prisma.vendorInvoice.findMany({
      where: {
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        is_active: true,
      },
      select: {
        uuid: true,
        purchase_order_uuid: true,
        change_order_uuid: true,
        vendor_uuid: true,
        status: true,
        amount: true,
        invoice_type: true,
        adjusted_advance_payment_uuid: true,
        adjusted_against_vendor_invoice_uuid: true,
        financial_breakdown: true,
        holdback: true,
      },
    }),
  ])

  let purchaseOrders = purchaseOrdersRaw
    .map(row => decoratePurchaseOrderRecord(mapRecord(row as unknown as Record<string, unknown>)))
    .filter(po => isReportEligibleOrderStatus(po.status as string))

  let changeOrders = changeOrdersRaw
    .map(row => decorateChangeOrderRecord(mapRecord(row as unknown as Record<string, unknown>)))
    .filter(co => isReportEligibleOrderStatus(co.status as string))

  const statusFilter = poStatusFilter
    ? normalizeStatusForFilter(poStatusFilter)
    : undefined
  if (statusFilter) {
    purchaseOrders = purchaseOrders.filter(
      po => normalizeStatusForFilter(po.status as string) === statusFilter,
    )
    changeOrders = changeOrders.filter(
      co => normalizeStatusForFilter(co.status as string) === statusFilter,
    )
  }

  purchaseOrders = purchaseOrders.filter(po =>
    isWithinReportDateRange(po.entry_date as string, entryDateFromIso, entryDateToIso),
  )
  changeOrders = changeOrders.filter(co =>
    isWithinReportDateRange(co.created_date as string, entryDateFromIso, entryDateToIso),
  )

  const invoicesMapped = invoicesRaw.map((row) => {
    const mapped = mapRecord(row as unknown as Record<string, unknown>)
    mapped.amount = row.amount != null ? Number(row.amount) : 0
    mapped.holdback = row.holdback != null ? Number(row.holdback) : null
    return mapped
  })

  const [invoicesWithAdvanceData, itemTotalsByOrderUuid] = await Promise.all([
    enrichInvoicesWithAdjustedAdvanceAmounts(invoicesMapped),
    buildItemTotalsForProject(projectUuid, purchaseOrders, changeOrders),
  ])

  const invoices = filterReportEligibleVendorInvoices(invoicesWithAdvanceData)

  const vendorUuids = new Set<string>()
  if (vendorUuid) vendorUuids.add(vendorUuid)
  for (const po of purchaseOrders) {
    if (po.vendor_uuid) vendorUuids.add(String(po.vendor_uuid))
  }
  for (const co of changeOrders) {
    if (co.vendor_uuid) vendorUuids.add(String(co.vendor_uuid))
  }
  for (const inv of invoices) {
    if (inv.vendor_uuid) vendorUuids.add(String(inv.vendor_uuid))
  }

  const vendorNamesByUuid = await fetchNimbleVendorNamesForUuids(
    event,
    corporationUuid,
    Array.from(vendorUuids),
  )

  const invoiceUuids = collectNimblePaidInvoiceUuids(invoices)
  const nimblePaidByInvoiceUuid = invoiceUuids.length
    ? buildNimblePaidByInvoiceUuid(invoices)
    : {}

  return buildPoCoInvoiceSummaryVendorGroups({
    purchaseOrders,
    changeOrders,
    invoices,
    vendorNamesByUuid,
    itemTotalsByOrderUuid,
    nimblePaidByInvoiceUuid,
  })
}
