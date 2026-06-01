import type { H3Event } from 'h3'
import { getPrisma } from '../prisma'
import {
  APPROVED_PO_CO_STATUSES,
  parseFinancialTotal,
  parseInvoiceTaxAmount,
  parseJson,
  toNum,
} from './reportHelpers'
import { fetchNimbleVendorNamesForUuids } from './nimbleVendorsForReport'

const prisma = getPrisma()

function parseInvoiceFinancialAmount(invoice: {
  amount?: unknown
  financial_breakdown?: unknown
}): number {
  return parseFinancialTotal(
    invoice.financial_breakdown,
    ['total_invoice_amount', 'totalInvoiceAmount', 'total'],
    invoice.amount,
  )
}

export async function getVendorAccountsPayableSummary(
  event: H3Event,
  options: {
    corporationUuid: string
    projectUuid: string
    startDate: string
    endDate: string
  },
) {
  const { corporationUuid, projectUuid, startDate, endDate } = options
  const startMs = new Date(startDate).getTime()
  const endMs = new Date(endDate).getTime()
  const hasValidDateRange = Number.isFinite(startMs) && Number.isFinite(endMs)

  const isWithinDateRange = (rawDate: unknown): boolean => {
    if (!hasValidDateRange) return true
    const value = String(rawDate ?? '').trim()
    if (!value) return true
    const dateMs = new Date(value).getTime()
    return Number.isFinite(dateMs) && dateMs >= startMs && dateMs <= endMs
  }

  const project = await prisma.project.findFirst({
    where: { uuid: projectUuid, corporation_uuid: corporationUuid, is_active: true },
    select: { uuid: true, project_name: true, project_id: true },
  })
  if (!project) {
    throw createError({ statusCode: 404, statusMessage: 'Project not found' })
  }

  const [purchaseOrders, changeOrders, invoices] = await Promise.all([
    prisma.purchaseOrderForm.findMany({
      where: {
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        status: { in: APPROVED_PO_CO_STATUSES },
        is_active: true,
      },
      select: {
        uuid: true,
        vendor_uuid: true,
        entry_date: true,
        created_at: true,
        financial_breakdown: true,
      },
    }),
    prisma.changeOrder.findMany({
      where: {
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        status: { in: APPROVED_PO_CO_STATUSES },
        is_active: true,
      },
      select: {
        uuid: true,
        vendor_uuid: true,
        created_date: true,
        created_at: true,
        financial_breakdown: true,
      },
    }),
    prisma.vendorInvoice.findMany({
      where: {
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        is_active: true,
        bill_date: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      select: {
        uuid: true,
        vendor_uuid: true,
        invoice_type: true,
        purchase_order_uuid: true,
        change_order_uuid: true,
        status: true,
        amount: true,
        holdback: true,
        financial_breakdown: true,
      },
    }),
  ])

  const vendorUuids = new Set<string>()
  for (const po of purchaseOrders) if (po.vendor_uuid) vendorUuids.add(po.vendor_uuid)
  for (const co of changeOrders) if (co.vendor_uuid) vendorUuids.add(co.vendor_uuid)
  for (const inv of invoices) if (inv.vendor_uuid) vendorUuids.add(inv.vendor_uuid)

  const nimbleVendorNames = await fetchNimbleVendorNamesForUuids(
    event,
    corporationUuid,
    [...vendorUuids],
  )

  const vendorDataMap = new Map<string, any>()
  for (const vendorUuid of vendorUuids) {
    vendorDataMap.set(vendorUuid, {
      vendorUuid,
      vendorName: nimbleVendorNames.get(vendorUuid) || vendorUuid,
      poAmount: 0,
      changeOrderAmount: 0,
      totalContractValue: 0,
      invoicedForVendor: 0,
      billedByVendor: 0,
      holdback: 0,
      tax: 0,
      balance: 0,
      paidToDate: 0,
      apBalance: 0,
      totalInvoiceValue: 0,
    })
  }

  for (const po of purchaseOrders) {
    const poDate = po.entry_date ?? po.created_at
    if (!isWithinDateRange(poDate)) continue
    if (!po.vendor_uuid) continue
    const vendorData = vendorDataMap.get(po.vendor_uuid)
    if (!vendorData) continue
    vendorData.poAmount += parseFinancialTotal(po.financial_breakdown, [
      'total_po_amount',
      'totalAmount',
      'total',
    ])
  }

  for (const co of changeOrders) {
    const coDate = co.created_date ?? co.created_at
    if (!isWithinDateRange(coDate)) continue
    if (!co.vendor_uuid) continue
    const vendorData = vendorDataMap.get(co.vendor_uuid)
    if (!vendorData) continue
    vendorData.changeOrderAmount += parseFinancialTotal(co.financial_breakdown, [
      'total_co_amount',
      'totalAmount',
      'total',
    ])
  }

  for (const invoice of invoices) {
    if (!invoice.vendor_uuid) continue
    const vendorData = vendorDataMap.get(invoice.vendor_uuid)
    if (!vendorData) continue

    const financialBreakdown = parseJson<Record<string, unknown>>(invoice.financial_breakdown, {})
    const invoiceAmount = parseInvoiceFinancialAmount(invoice)
    const taxAmount = parseInvoiceTaxAmount(invoice.financial_breakdown)
    const itemTotal = toNum((financialBreakdown?.totals as any)?.item_total)
    const chargesTotal = toNum((financialBreakdown?.totals as any)?.charges_total)

    let holdbackAmount = 0
    if (invoice.holdback && toNum(invoice.holdback) > 0) {
      const savedHoldback = (financialBreakdown?.totals as any)?.holdback_amount
      if (savedHoldback != null) {
        holdbackAmount = toNum(savedHoldback)
      } else {
        const totalBeforeHoldback = itemTotal + chargesTotal + taxAmount
        holdbackAmount = totalBeforeHoldback * (toNum(invoice.holdback) / 100)
      }
    }

    vendorData.invoicedForVendor += invoiceAmount
    vendorData.holdback += holdbackAmount
    vendorData.tax += taxAmount

    const invoiceStatus = String(invoice.status || '').trim().toLowerCase()
    if (invoiceStatus === 'paid') {
      vendorData.paidToDate += parseInvoiceFinancialAmount(invoice)
    }
  }

  vendorDataMap.forEach((vendorData) => {
    vendorData.totalContractValue = vendorData.poAmount + vendorData.changeOrderAmount
    vendorData.balance = vendorData.totalContractValue - vendorData.invoicedForVendor
    vendorData.apBalance =
      vendorData.invoicedForVendor + vendorData.tax - vendorData.holdback - vendorData.paidToDate
    vendorData.totalInvoiceValue = vendorData.invoicedForVendor
  })

  const vendorDataArray = Array.from(vendorDataMap.values())
    .filter(
      (v) =>
        v.poAmount > 0
        || v.changeOrderAmount > 0
        || v.invoicedForVendor > 0
        || v.paidToDate > 0,
    )
    .sort((a, b) => a.vendorName.localeCompare(b.vendorName))

  const totals = vendorDataArray.reduce(
    (acc, vendor) => {
      acc.poAmount += vendor.poAmount
      acc.changeOrderAmount += vendor.changeOrderAmount
      acc.totalContractValue += vendor.totalContractValue
      acc.invoicedForVendor += vendor.invoicedForVendor
      acc.totalInvoiceValue += vendor.totalInvoiceValue
      acc.billedByVendor += vendor.billedByVendor
      acc.holdback += vendor.holdback
      acc.tax += vendor.tax
      acc.balance += vendor.balance
      acc.paidToDate += vendor.paidToDate
      acc.apBalance += vendor.apBalance
      return acc
    },
    {
      poAmount: 0,
      changeOrderAmount: 0,
      totalContractValue: 0,
      invoicedForVendor: 0,
      totalInvoiceValue: 0,
      billedByVendor: 0,
      holdback: 0,
      tax: 0,
      balance: 0,
      paidToDate: 0,
      apBalance: 0,
    },
  )

  return {
    project: {
      projectName: project.project_name,
      projectId: project.project_id,
    },
    vendors: vendorDataArray,
    totals,
  }
}
