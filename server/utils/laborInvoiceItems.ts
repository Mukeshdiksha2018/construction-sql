import { getPrisma } from './prisma'

const prisma = getPrisma()

function toNum(val: unknown): number | null {
  if (val == null || val === '') return null
  const n = typeof val === 'number' ? val : Number(val)
  return Number.isFinite(n) ? n : null
}

function parseMetadata(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>
  }
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }
  return {}
}

/**
 * Stable key per labor schedule line. Must stay in sync with
 * VendorInvoiceForm.getLaborInvoiceAggregationKey.
 */
export function laborInvoiceLineAggregationKey(item: {
  labor_co_item_uuid?: string | null
  labor_po_item_uuid?: string | null
  cost_code_uuid?: string | null
  location_uuid?: string | null
}): string {
  if (item.labor_co_item_uuid) return `lco:${item.labor_co_item_uuid}`
  if (item.labor_po_item_uuid) return `lpo:${item.labor_po_item_uuid}`
  const costCodeUuid = item.cost_code_uuid || ''
  const locationUuid = item.location_uuid || ''
  return locationUuid ? `${costCodeUuid}|${locationUuid}` : costCodeUuid
}

function parseLegacyCostLocationKey(key: string): {
  cost_code_uuid: string
  location_uuid: string | null
} {
  const idx = key.indexOf('|')
  if (idx === -1) {
    return { cost_code_uuid: key, location_uuid: null }
  }
  return {
    cost_code_uuid: key.slice(0, idx),
    location_uuid: key.slice(idx + 1) || null,
  }
}

export function aggregationBucketToRow(key: string, totalAmount: number) {
  if (key.startsWith('lco:')) {
    return {
      labor_co_item_uuid: key.slice(4),
      labor_po_item_uuid: null,
      cost_code_uuid: null,
      location_uuid: null,
      total_invoiced_amount: totalAmount,
    }
  }
  if (key.startsWith('lpo:')) {
    return {
      labor_co_item_uuid: null,
      labor_po_item_uuid: key.slice(4),
      cost_code_uuid: null,
      location_uuid: null,
      total_invoiced_amount: totalAmount,
    }
  }
  const { cost_code_uuid, location_uuid } = parseLegacyCostLocationKey(key)
  return {
    labor_co_item_uuid: null,
    labor_po_item_uuid: null,
    cost_code_uuid,
    location_uuid,
    total_invoiced_amount: totalAmount,
  }
}

function normalizeLaborItemLocation(item: Record<string, unknown>) {
  const meta = parseMetadata(item.metadata)
  return {
    location_uuid:
      (item.location_uuid as string | null | undefined) ??
      (meta.location_uuid as string | null | undefined) ??
      null,
    location_label:
      (item.location_label as string | null | undefined) ??
      (meta.location_label as string | null | undefined) ??
      null,
    description:
      (item.description as string | null | undefined) ??
      (meta.description as string | null | undefined) ??
      null,
  }
}

function mapLaborInvoiceItemRow(row: Record<string, unknown>) {
  const mapped: Record<string, unknown> = { ...row }
  mapped.metadata = parseMetadata(row.metadata)
  if (mapped.id != null) mapped.id = String(mapped.id)
  mapped.invoice_amount = toNum(mapped.invoice_amount)
  const loc = normalizeLaborItemLocation(mapped)
  mapped.location_uuid = loc.location_uuid
  mapped.location_label = loc.location_label
  if (loc.description != null) mapped.description = loc.description
  return mapped
}

export type ListLaborInvoiceItemsParams = {
  vendor_invoice_uuid?: string
  purchase_order_uuid?: string
  change_order_uuid?: string
  include_inactive?: boolean
  exclude_vendor_invoice_uuid?: string
  aggregate_invoiced?: boolean
}

async function enrichSavedLaborInvoiceItems(savedItems: Record<string, unknown>[]) {
  const poUuids = [
    ...new Set(
      savedItems
        .map((i) => i.labor_po_item_uuid as string | null | undefined)
        .filter((u): u is string => Boolean(u)),
    ),
  ]
  const coUuids = [
    ...new Set(
      savedItems
        .map((i) => i.labor_co_item_uuid as string | null | undefined)
        .filter((u): u is string => Boolean(u)),
    ),
  ]

  const [poItems, coItems] = await Promise.all([
    poUuids.length
      ? prisma.laborPurchaseOrderItem.findMany({
          where: { uuid: { in: poUuids }, is_active: true },
        })
      : Promise.resolve([]),
    coUuids.length
      ? prisma.laborChangeOrderItem.findMany({
          where: { uuid: { in: coUuids }, is_active: true },
        })
      : Promise.resolve([]),
  ])

  const poByUuid = new Map(poItems.map((r) => [r.uuid, r]))
  const coByUuid = new Map(coItems.map((r) => [r.uuid, r]))

  return savedItems.map((item) => {
    let originalAmount = 0
    let laborBudgetedAmount = 0
    let poAmount = 0
    let coAmount = 0

    const mapped = mapLaborInvoiceItemRow(item)

    if (mapped.labor_po_item_uuid) {
      const poItem = poByUuid.get(String(mapped.labor_po_item_uuid))
      if (poItem) {
        poAmount = toNum(poItem.po_amount) ?? 0
        originalAmount = poAmount
        laborBudgetedAmount = toNum(poItem.labor_budgeted_amount) ?? 0
        if (!mapped.location_uuid && poItem.location_uuid) {
          mapped.location_uuid = poItem.location_uuid
        }
        if (!mapped.location_label && poItem.location_label) {
          mapped.location_label = poItem.location_label
        }
        if (!mapped.description && poItem.description) {
          mapped.description = poItem.description
        }
      }
    } else if (mapped.labor_co_item_uuid) {
      const coItem = coByUuid.get(String(mapped.labor_co_item_uuid))
      if (coItem) {
        poAmount = toNum(coItem.po_amount) ?? 0
        coAmount = toNum(coItem.co_amount) ?? 0
        // Invoices against a labor CO bill the CO delta per line (co_amount).
        originalAmount = coAmount
        if (!mapped.location_uuid && coItem.location_uuid) {
          mapped.location_uuid = coItem.location_uuid
        }
        if (!mapped.location_label && coItem.location_label) {
          mapped.location_label = coItem.location_label
        }
        if (!mapped.description && coItem.description) {
          mapped.description = coItem.description
        }
      }
    }

    return {
      ...mapped,
      po_amount: poAmount,
      co_amount: coAmount,
      labor_budgeted_amount: laborBudgetedAmount,
      ...(mapped.labor_co_item_uuid || mapped.labor_po_item_uuid
        ? { original_amount: originalAmount }
        : {}),
    }
  })
}

async function listAggregatedInvoicedAmounts(params: {
  purchase_order_uuid?: string
  change_order_uuid?: string
  exclude_vendor_invoice_uuid?: string
}) {
  const invoiceWhere: Record<string, unknown> = {
    is_active: true,
    status: { not: 'Draft' },
  }
  if (params.purchase_order_uuid) {
    invoiceWhere.purchase_order_uuid = params.purchase_order_uuid
  } else if (params.change_order_uuid) {
    invoiceWhere.change_order_uuid = params.change_order_uuid
  }

  const invoices = await prisma.vendorInvoice.findMany({
    where: invoiceWhere,
    select: { uuid: true },
  })

  let invoiceUuids = invoices.map((i) => i.uuid)
  if (params.exclude_vendor_invoice_uuid) {
    invoiceUuids = invoiceUuids.filter(
      (uuid) => uuid !== params.exclude_vendor_invoice_uuid,
    )
  }
  if (!invoiceUuids.length) return []

  const laborItems = await prisma.laborInvoiceItem.findMany({
    where: {
      is_active: true,
      vendor_invoice_uuid: { in: invoiceUuids },
    },
    select: {
      labor_co_item_uuid: true,
      labor_po_item_uuid: true,
      cost_code_uuid: true,
      invoice_amount: true,
      metadata: true,
    },
  })

  const aggregated: Record<string, number> = {}
  for (const item of laborItems) {
    const meta = parseMetadata(item.metadata)
    const locationUuid =
      (meta.location_uuid as string | null | undefined) ?? null
    const amount = toNum(item.invoice_amount) ?? 0
    const key = laborInvoiceLineAggregationKey({
      labor_co_item_uuid: item.labor_co_item_uuid,
      labor_po_item_uuid: item.labor_po_item_uuid,
      cost_code_uuid: item.cost_code_uuid,
      location_uuid: locationUuid,
    })
    if (!key) continue
    aggregated[key] = (aggregated[key] || 0) + amount
  }

  return Object.entries(aggregated).map(([key, totalAmount]) =>
    aggregationBucketToRow(key, totalAmount),
  )
}

async function listLaborScheduleTemplates(params: {
  purchase_order_uuid?: string
  change_order_uuid?: string
}) {
  if (params.purchase_order_uuid) {
    const laborItems = await prisma.laborPurchaseOrderItem.findMany({
      where: {
        purchase_order_uuid: params.purchase_order_uuid,
        is_active: true,
        is_removed: false,
      },
      orderBy: { order_index: 'asc' },
    })

    return laborItems.map((item, index) => {
      const loc = normalizeLaborItemLocation(item as unknown as Record<string, unknown>)
      const costCodeLabel =
        item.cost_code_label ||
        `${item.cost_code_number || ''} - ${item.cost_code_name || ''}`.trim()
      return {
        uuid: item.uuid,
        cost_code_uuid: item.cost_code_uuid,
        cost_code_label: costCodeLabel,
        cost_code_number: item.cost_code_number,
        cost_code_name: item.cost_code_name,
        description: loc.description || item.description || null,
        location_uuid: loc.location_uuid,
        location_label: loc.location_label,
        po_amount: toNum(item.po_amount),
        co_amount: null,
        labor_budgeted_amount: toNum(item.labor_budgeted_amount),
        invoice_amount: 0,
        order_index: item.order_index ?? index,
        labor_po_item_uuid: item.uuid,
        labor_co_item_uuid: null,
      }
    })
  }

  if (params.change_order_uuid) {
    const laborItems = await prisma.laborChangeOrderItem.findMany({
      where: {
        change_order_uuid: params.change_order_uuid,
        is_active: true,
      },
      orderBy: { order_index: 'asc' },
    })

    return laborItems.map((item, index) => {
      const loc = normalizeLaborItemLocation(item as unknown as Record<string, unknown>)
      const costCodeLabel =
        item.cost_code_label ||
        `${item.cost_code_number || ''} - ${item.cost_code_name || ''}`.trim()
      return {
        uuid: item.uuid,
        cost_code_uuid: item.cost_code_uuid,
        cost_code_label: costCodeLabel,
        cost_code_number: item.cost_code_number,
        cost_code_name: item.cost_code_name,
        description: loc.description || item.description || null,
        location_uuid: loc.location_uuid,
        location_label: loc.location_label,
        po_amount: toNum(item.po_amount),
        co_amount: toNum(item.co_amount),
        labor_budgeted_amount: null,
        invoice_amount: 0,
        order_index: item.order_index ?? index,
        labor_po_item_uuid: null,
        labor_co_item_uuid: item.uuid,
      }
    })
  }

  return []
}

/**
 * GET logic for /api/labor-invoice-items — matches construction-management behaviour.
 */
export async function listLaborInvoiceItems(params: ListLaborInvoiceItemsParams) {
  const {
    vendor_invoice_uuid,
    purchase_order_uuid,
    change_order_uuid,
    include_inactive = false,
    exclude_vendor_invoice_uuid,
    aggregate_invoiced = false,
  } = params

  if (!vendor_invoice_uuid && !purchase_order_uuid && !change_order_uuid) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Either vendor_invoice_uuid, purchase_order_uuid, or change_order_uuid is required',
    })
  }

  if (vendor_invoice_uuid) {
    const where: Record<string, unknown> = {
      vendor_invoice_uuid,
    }
    if (!include_inactive) where.is_active = true

    const savedItems = await prisma.laborInvoiceItem.findMany({
      where,
      orderBy: { order_index: 'asc' },
    })

    return enrichSavedLaborInvoiceItems(
      savedItems as unknown as Record<string, unknown>[],
    )
  }

  if (aggregate_invoiced) {
    return listAggregatedInvoicedAmounts({
      purchase_order_uuid,
      change_order_uuid,
      exclude_vendor_invoice_uuid,
    })
  }

  return listLaborScheduleTemplates({
    purchase_order_uuid,
    change_order_uuid,
  })
}
