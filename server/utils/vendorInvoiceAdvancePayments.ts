import { getPrisma } from './prisma'

const prisma = getPrisma()

function parseJson(val: unknown, fallback: unknown = null) {
  if (val == null || val === '') return fallback
  if (typeof val === 'object') return val
  try {
    return JSON.parse(String(val))
  } catch {
    return fallback
  }
}

function toNum(val: unknown): number | null {
  if (val == null || val === '') return null
  const n = typeof val === 'number' ? val : Number(val)
  return Number.isFinite(n) ? n : null
}

function toLocalDate(val: unknown): string | null {
  if (val == null) return null
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10)
  }
  const s = String(val).trim()
  return s || null
}

function mapAdvancePaymentCostCodeRow(row: Record<string, unknown>) {
  const mapped: Record<string, unknown> = { ...row }
  mapped.metadata = parseJson(row.metadata, {})
  if (mapped.id != null) mapped.id = String(mapped.id)
  for (const key of ['total_amount', 'advance_amount']) {
    if (key in mapped) mapped[key] = toNum(mapped[key])
  }
  return mapped
}

function mapAdvancePaymentInvoiceRow(
  row: Record<string, unknown>,
  costCodes: Record<string, unknown>[],
) {
  return {
    uuid: row.uuid,
    number: row.number ?? null,
    bill_date: toLocalDate(row.bill_date),
    amount: toNum(row.amount),
    is_active: row.is_active ?? true,
    financial_breakdown: parseJson(row.financial_breakdown, {}),
    adjusted_against_vendor_invoice_uuid: row.adjusted_against_vendor_invoice_uuid ?? null,
    costCodes,
  }
}

function mapAdjustedCostCodeRow(row: Record<string, unknown>) {
  const mapped: Record<string, unknown> = { ...row }
  mapped.metadata = parseJson(row.metadata, {})
  mapped.adjusted_amount = toNum(row.adjusted_amount) ?? 0
  if (mapped.id != null) mapped.id = String(mapped.id)
  return mapped
}

async function loadCostCodesByInvoiceUuids(invoiceUuids: string[]) {
  const byInvoice = new Map<string, Record<string, unknown>[]>()
  if (!invoiceUuids.length) return byInvoice

  const rows = await prisma.advancePaymentCostCode.findMany({
    where: {
      vendor_invoice_uuid: { in: invoiceUuids },
      is_active: true,
    },
    orderBy: { created_at: 'asc' },
  })

  for (const row of rows) {
    const key = row.vendor_invoice_uuid
    const list = byInvoice.get(key) ?? []
    list.push(mapAdvancePaymentCostCodeRow(row as unknown as Record<string, unknown>))
    byInvoice.set(key, list)
  }

  return byInvoice
}

export async function listAdvancePaymentsForPurchaseOrder(purchaseOrderUuid: string) {
  const invoices = await prisma.vendorInvoice.findMany({
    where: {
      purchase_order_uuid: purchaseOrderUuid,
      invoice_type: 'AGAINST_ADVANCE_PAYMENT',
      is_active: true,
    },
    select: {
      uuid: true,
      number: true,
      bill_date: true,
      amount: true,
      is_active: true,
      financial_breakdown: true,
      adjusted_against_vendor_invoice_uuid: true,
    },
    orderBy: { bill_date: 'desc' },
  })

  const costCodesByInvoice = await loadCostCodesByInvoiceUuids(invoices.map((i) => i.uuid))

  return invoices.map((invoice) =>
    mapAdvancePaymentInvoiceRow(
      invoice as unknown as Record<string, unknown>,
      costCodesByInvoice.get(invoice.uuid) ?? [],
    ),
  )
}

export async function listAdvancePaymentsForChangeOrder(changeOrderUuid: string) {
  const invoices = await prisma.vendorInvoice.findMany({
    where: {
      change_order_uuid: changeOrderUuid,
      invoice_type: 'AGAINST_ADVANCE_PAYMENT',
      is_active: true,
    },
    select: {
      uuid: true,
      number: true,
      bill_date: true,
      amount: true,
      is_active: true,
      financial_breakdown: true,
      adjusted_against_vendor_invoice_uuid: true,
    },
    orderBy: { bill_date: 'desc' },
  })

  const costCodesByInvoice = await loadCostCodesByInvoiceUuids(invoices.map((i) => i.uuid))

  return invoices.map((invoice) =>
    mapAdvancePaymentInvoiceRow(
      invoice as unknown as Record<string, unknown>,
      costCodesByInvoice.get(invoice.uuid) ?? [],
    ),
  )
}

export type AdjustedAdvancePaymentCostCodesQuery = {
  vendor_invoice_uuid?: string
  purchase_order_uuid?: string
  change_order_uuid?: string
  exclude_current_invoice?: boolean
}

export async function listAdjustedAdvancePaymentCostCodes(
  query: AdjustedAdvancePaymentCostCodesQuery,
) {
  const vendorInvoiceUuid = String(query.vendor_invoice_uuid ?? '').trim()
  const purchaseOrderUuid = String(query.purchase_order_uuid ?? '').trim()
  const changeOrderUuid = String(query.change_order_uuid ?? '').trim()
  const excludeCurrentInvoice = query.exclude_current_invoice === true

  if (!vendorInvoiceUuid && !purchaseOrderUuid && !changeOrderUuid) {
    throw new Error('Either vendor_invoice_uuid or (purchase_order_uuid/change_order_uuid) is required')
  }

  const where: Record<string, unknown> = { is_active: true }

  if (vendorInvoiceUuid && !excludeCurrentInvoice) {
    where.vendor_invoice_uuid = vendorInvoiceUuid
  } else {
    if (purchaseOrderUuid) where.purchase_order_uuid = purchaseOrderUuid
    if (changeOrderUuid) where.change_order_uuid = changeOrderUuid
    if (excludeCurrentInvoice && vendorInvoiceUuid) {
      where.vendor_invoice_uuid = { not: vendorInvoiceUuid }
    }
  }

  const rows = await prisma.adjustedAdvancePaymentCostCode.findMany({
    where: where as any,
    orderBy: { created_at: 'asc' },
  })

  return rows.map((row) => mapAdjustedCostCodeRow(row as unknown as Record<string, unknown>))
}
