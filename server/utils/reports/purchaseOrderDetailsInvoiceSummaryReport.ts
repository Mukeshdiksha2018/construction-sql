import { isStoredDateWithinApiBounds } from '../../../app/utils/purchaseOrderEntryDateFilter'
import {
  sumHoldbackFromInvoices,
  sumPoCoReportTotalInvoicedFromInvoices,
  sumTotalPaidFromInvoices,
} from '../../../app/utils/invoiceReportPaymentTotals'
import {
  normalizePoCurrencyConversionFields,
  type PoCurrencyCode,
} from '../../../app/utils/poCurrencyConversion'

export type PoCoInvoiceSummaryOrderRow = {
  uuid: string
  type: 'PO' | 'CO'
  vendor_uuid: string | null
  submit_date: string | null
  po_number: string | null
  co_number: string | null
  vendor_name: string
  goods_amount: number
  freight_amount: number
  additional_charges: number
  hst: number
  po_total: number
  total_invoiced: number
  holdback: number
  total_paid: number
  balance_to_invoice: number
  status: string
  currency_conversion_enabled: boolean
  currency_from: PoCurrencyCode
  currency_to: PoCurrencyCode
  conversion_rate: number
}

export type PoCoInvoiceSummaryVendorGroup = {
  vendor_uuid: string | null
  vendor_name: string
  orders: PoCoInvoiceSummaryOrderRow[]
  vendor_totals: {
    goods_amount: number
    freight_amount: number
    additional_charges: number
    hst: number
    po_total: number
    total_invoiced: number
    holdback: number
    total_paid: number
    balance_to_invoice: number
  }
}

export const normalizeStatusForFilter = (status?: string | null): string => {
  const raw = String(status ?? '').trim().toUpperCase()
  if (!raw) return ''
  return raw === 'DRAFT' ? 'PENDING' : raw
}

/** POs/COs included in this report: approved, partially received, or completed only. */
export const isReportEligibleOrderStatus = (status?: string | null): boolean => {
  const key = String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
  return key === 'approved' || key === 'partially_received' || key === 'completed'
}

export const isWithinReportDateRange = (
  value: string | null | undefined,
  fromIso: string,
  toIso: string
): boolean => isStoredDateWithinApiBounds(value, fromIso, toIso)

const parseFinancialBreakdown = (raw: unknown): Record<string, any> => {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }
  return typeof raw === 'object' ? (raw as Record<string, any>) : {}
}

export const resolveOrderItemTotalFromRecord = (
  order: Record<string, any>,
  itemTotalsByOrderUuid: Map<string, number>
): number => {
  const fromBatch = itemTotalsByOrderUuid.get(String(order.uuid || ''))
  if (fromBatch != null && fromBatch > 0) return fromBatch

  const fb = parseFinancialBreakdown(order.financial_breakdown)
  const fromFb = Number(fb?.totals?.item_total ?? 0)
  if (Number.isFinite(fromFb) && fromFb > 0) return fromFb

  const direct = Number(order.item_total ?? 0)
  return Number.isFinite(direct) && direct > 0 ? direct : 0
}

export const sumMaterialOrderItemTotal = (items: any[]): number =>
  items.reduce((sum: number, item: any) => {
    const itemAmount =
      item.co_total ||
      item.po_total ||
      item.total ||
      (Number(item.co_quantity ?? item.po_quantity ?? item.quantity ?? 0) *
        Number(item.co_unit_price ?? item.po_unit_price ?? item.unit_price ?? 0))
    return sum + (Number(itemAmount) || 0)
  }, 0)

export const sumLaborOrderItemTotal = (items: any[]): number =>
  items.reduce(
    (sum: number, item: any) => sum + (Number(item.co_amount ?? item.po_amount ?? 0) || 0),
    0
  )

export const buildMaterialItemTotalsByOrderUuid = (
  items: any[],
  orderUuidField: 'purchase_order_uuid' | 'change_order_uuid'
): Map<string, number> => {
  const totals = new Map<string, number>()
  for (const item of items) {
    const orderUuid = String(item[orderUuidField] || '').trim()
    if (!orderUuid) continue
    const itemAmount =
      item.co_total ||
      item.po_total ||
      item.total ||
      (Number(item.co_quantity ?? item.po_quantity ?? item.quantity ?? 0) *
        Number(item.co_unit_price ?? item.po_unit_price ?? item.unit_price ?? 0))
    const numeric = Number(itemAmount) || 0
    if (numeric <= 0) continue
    totals.set(orderUuid, (totals.get(orderUuid) || 0) + numeric)
  }
  return totals
}

export const buildLaborItemTotalsByOrderUuid = (
  items: any[],
  orderUuidField: 'purchase_order_uuid' | 'change_order_uuid'
): Map<string, number> => {
  const totals = new Map<string, number>()
  for (const item of items) {
    const orderUuid = String(item[orderUuidField] || '').trim()
    if (!orderUuid) continue
    const numeric = Number(item.co_amount ?? item.po_amount ?? 0) || 0
    if (numeric <= 0) continue
    totals.set(orderUuid, (totals.get(orderUuid) || 0) + numeric)
  }
  return totals
}

export const groupInvoicesByPurchaseOrder = (
  invoices: any[],
  allowedPoUuids: Set<string>
): Map<string, any[]> => {
  const map = new Map<string, any[]>()
  for (const invoice of invoices) {
    const poUuid = String(invoice.purchase_order_uuid || '').trim()
    if (!poUuid || !allowedPoUuids.has(poUuid)) continue
    const list = map.get(poUuid) || []
    list.push(invoice)
    map.set(poUuid, list)
  }
  return map
}

export const groupInvoicesByChangeOrder = (
  invoices: any[],
  allowedCoUuids: Set<string>
): Map<string, any[]> => {
  const map = new Map<string, any[]>()
  for (const invoice of invoices) {
    const coUuid = String(invoice.change_order_uuid || '').trim()
    if (!coUuid || !allowedCoUuids.has(coUuid)) continue
    const list = map.get(coUuid) || []
    list.push(invoice)
    map.set(coUuid, list)
  }
  return map
}

const buildPoRow = (
  po: Record<string, any>,
  invoices: any[],
  vendorName: string,
  itemTotalsByOrderUuid: Map<string, number>,
  nimblePaidByInvoiceUuid: Record<string, number>
): PoCoInvoiceSummaryOrderRow => {
  const totalInvoiced = sumPoCoReportTotalInvoicedFromInvoices(invoices)
  const holdback = sumHoldbackFromInvoices(invoices)
  const totalPaid = sumTotalPaidFromInvoices(invoices, nimblePaidByInvoiceUuid)

  const goodsAmount = resolveOrderItemTotalFromRecord(po, itemTotalsByOrderUuid)
  const freightAmount = Number(po.freight_charges_amount ?? 0) || 0
  const additionalCharges =
    (Number(po.packing_charges_amount ?? 0) || 0) +
    (Number(po.custom_duties_charges_amount ?? 0) || 0) +
    (Number(po.other_charges_amount ?? 0) || 0)
  const hst =
    (Number(po.sales_tax_1_amount ?? 0) || 0) +
    (Number(po.sales_tax_2_amount ?? 0) || 0)
  const poTotal = goodsAmount + freightAmount + additionalCharges + hst
  const currencyFields = normalizePoCurrencyConversionFields(po)

  return {
    uuid: po.uuid,
    type: 'PO',
    vendor_uuid: po.vendor_uuid ?? null,
    submit_date: po.entry_date || po.created_at || null,
    po_number: po.po_number ?? null,
    co_number: null,
    vendor_name: vendorName,
    goods_amount: goodsAmount,
    freight_amount: freightAmount,
    additional_charges: additionalCharges,
    hst,
    po_total: poTotal,
    total_invoiced: totalInvoiced,
    holdback,
    total_paid: totalPaid,
    balance_to_invoice: totalInvoiced - totalPaid,
    status: po.status,
    ...currencyFields,
  }
}

const buildCoRow = (
  co: Record<string, any>,
  invoices: any[],
  vendorName: string,
  itemTotalsByOrderUuid: Map<string, number>,
  nimblePaidByInvoiceUuid: Record<string, number>
): PoCoInvoiceSummaryOrderRow => {
  const totalInvoiced = sumPoCoReportTotalInvoicedFromInvoices(invoices)
  const holdback = sumHoldbackFromInvoices(invoices)
  const totalPaid = sumTotalPaidFromInvoices(invoices, nimblePaidByInvoiceUuid)

  const goodsAmount = resolveOrderItemTotalFromRecord(co, itemTotalsByOrderUuid)
  const freightAmount = Number(co.freight_charges_amount ?? 0) || 0
  const additionalCharges =
    (Number(co.packing_charges_amount ?? 0) || 0) +
    (Number(co.custom_duties_charges_amount ?? 0) || 0) +
    (Number(co.other_charges_amount ?? 0) || 0)
  const hst =
    (Number(co.sales_tax_1_amount ?? 0) || 0) +
    (Number(co.sales_tax_2_amount ?? 0) || 0)
  const coTotal = goodsAmount + freightAmount + additionalCharges + hst
  const currencyFields = normalizePoCurrencyConversionFields(co)

  return {
    uuid: co.uuid,
    type: 'CO',
    vendor_uuid: co.vendor_uuid ?? null,
    submit_date: co.created_date || co.created_at || null,
    po_number: null,
    co_number: co.co_number ?? null,
    vendor_name: vendorName,
    goods_amount: goodsAmount,
    freight_amount: freightAmount,
    additional_charges: additionalCharges,
    hst,
    po_total: coTotal,
    total_invoiced: totalInvoiced,
    holdback,
    total_paid: totalPaid,
    balance_to_invoice: totalInvoiced - totalPaid,
    status: co.status,
    ...currencyFields,
  }
}

export const groupPoCoInvoiceSummaryByVendor = (
  rows: PoCoInvoiceSummaryOrderRow[]
): PoCoInvoiceSummaryVendorGroup[] => {
  const vendorGroups = new Map<string, PoCoInvoiceSummaryVendorGroup>()

  for (const order of rows) {
    const vendorKey = order.vendor_name || 'N/A'
    if (!vendorGroups.has(vendorKey)) {
      vendorGroups.set(vendorKey, {
        vendor_uuid: order.vendor_uuid,
        vendor_name: order.vendor_name || 'N/A',
        orders: [],
        vendor_totals: {
          goods_amount: 0,
          freight_amount: 0,
          additional_charges: 0,
          hst: 0,
          po_total: 0,
          total_invoiced: 0,
          holdback: 0,
          total_paid: 0,
          balance_to_invoice: 0,
        },
      })
    }

    const group = vendorGroups.get(vendorKey)!
    group.orders.push(order)
    group.vendor_totals.goods_amount += order.goods_amount || 0
    group.vendor_totals.freight_amount += order.freight_amount || 0
    group.vendor_totals.additional_charges += order.additional_charges || 0
    group.vendor_totals.hst += order.hst || 0
    group.vendor_totals.po_total += order.po_total || 0
    group.vendor_totals.total_invoiced += order.total_invoiced || 0
    group.vendor_totals.holdback += order.holdback || 0
    group.vendor_totals.total_paid += order.total_paid || 0
    group.vendor_totals.balance_to_invoice += order.balance_to_invoice || 0
  }

  const grouped = Array.from(vendorGroups.values())
  for (const group of grouped) {
    group.orders.sort((a, b) => {
      const dateA = new Date(a.submit_date || 0).getTime()
      const dateB = new Date(b.submit_date || 0).getTime()
      return dateB - dateA
    })
  }
  grouped.sort((a, b) =>
    (a.vendor_name || '').toLowerCase().localeCompare((b.vendor_name || '').toLowerCase())
  )
  return grouped
}

export type BuildPoCoInvoiceSummaryInput = {
  purchaseOrders: Record<string, any>[]
  changeOrders: Record<string, any>[]
  invoices: Record<string, any>[]
  vendorNamesByUuid: Map<string, string>
  itemTotalsByOrderUuid: Map<string, number>
  nimblePaidByInvoiceUuid: Record<string, number>
}

export const buildPoCoInvoiceSummaryRows = (
  input: BuildPoCoInvoiceSummaryInput
): PoCoInvoiceSummaryOrderRow[] => {
  const poUuidSet = new Set(input.purchaseOrders.map((po) => String(po.uuid)))
  const coUuidSet = new Set(input.changeOrders.map((co) => String(co.uuid)))
  const invoicesByPo = groupInvoicesByPurchaseOrder(input.invoices, poUuidSet)
  const invoicesByCo = groupInvoicesByChangeOrder(input.invoices, coUuidSet)

  const resolveVendorName = (vendorUuid?: string | null) => {
    if (!vendorUuid) return 'N/A'
    return input.vendorNamesByUuid.get(vendorUuid) || 'N/A'
  }

  const poRows = input.purchaseOrders.map((po) =>
    buildPoRow(
      po,
      invoicesByPo.get(po.uuid) || [],
      resolveVendorName(po.vendor_uuid),
      input.itemTotalsByOrderUuid,
      input.nimblePaidByInvoiceUuid
    )
  )

  const coRows = input.changeOrders.map((co) =>
    buildCoRow(
      co,
      invoicesByCo.get(co.uuid) || [],
      resolveVendorName(co.vendor_uuid),
      input.itemTotalsByOrderUuid,
      input.nimblePaidByInvoiceUuid
    )
  )

  return [...poRows, ...coRows]
}

export const buildPoCoInvoiceSummaryVendorGroups = (
  input: BuildPoCoInvoiceSummaryInput
): PoCoInvoiceSummaryVendorGroup[] =>
  groupPoCoInvoiceSummaryByVendor(buildPoCoInvoiceSummaryRows(input))
