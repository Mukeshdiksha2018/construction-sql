import { randomUUID } from 'node:crypto'
import { createError } from 'h3'
import { getPrisma } from './prisma'
import { sanitizeAttachments } from './financialBreakdown'
import {
  buildVendorInvoiceFinancialBreakdown,
  buildVendorInvoiceCoaAssignmentRows,
  decorateVendorInvoiceRecord,
  hasFinancialFields,
  sanitizeAdvancePaymentCostCode,
  sanitizeHoldbackCostCode,
  sanitizeVendorInvoiceHoldbackCoaBreakdownItem,
  shouldPersistVendorInvoiceCoaAssignments,
} from './vendorInvoiceUtils'
import {
  hydrateDirectVendorInvoiceLineItemFromDb,
  sanitizeChangeOrderInvoiceItem,
  sanitizeCoLwmInvoiceItem,
  sanitizeDirectVendorInvoiceLineItem,
  sanitizePoLwmInvoiceItem,
  sanitizePurchaseOrderInvoiceItem,
} from './vendorInvoiceLineItems'
import {
  defaultLabelForTaxLineKey,
  isTaxAdjustmentKey,
  taxLineKeyFromAdjustmentKey,
} from './advancePaymentTaxAdjustmentKeys'

const prisma = getPrisma()
const VENDOR_INVOICE_UUID_CHUNK = 200

export type VendorInvoiceListQuery = {
  corporation_uuid: string
  uuid?: string
  next_invoice_number?: string | boolean
  project_uuid?: string
  vendor_uuid?: string
  status?: string
  invoice_type?: string
  bill_date_from?: string
  bill_date_to?: string
  page?: number
  page_size?: number
}

export type PreviouslyInvoicedForOrderQuery = {
  corporation_uuid: string
  purchase_order_uuid?: string
  change_order_uuid?: string
  exclude_vendor_invoice_uuid?: string
}

// ─── JSON / date helpers ───────────────────────────────────────────────────────

function parseJson<T = unknown>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback
  try {
    return JSON.parse(val) as T
  } catch {
    return fallback
  }
}

function stringifyJson(val: unknown): string | null {
  if (val === null || val === undefined) return null
  return JSON.stringify(val)
}

function toNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = parseFloat(String(val))
  return Number.isNaN(n) ? null : n
}

function toLocalDate(d: Date | null | undefined): string | null {
  if (!d) return null
  return d.toISOString().split('T')[0]
}

function parseDate(val: string | null | undefined): Date | null {
  if (!val) return null
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00.000Z`)
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? null : d
}

function parseDateEndOfDay(val: string | null | undefined): Date | null {
  if (!val) return null
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T23:59:59.000Z`)
  return parseDate(val)
}

function normalizeUTC(val: unknown, endOfDay = false): Date | null {
  if (!val && val !== 0) return null
  const s = String(val)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return endOfDay ? new Date(`${s}T23:59:59.000Z`) : new Date(`${s}T00:00:00.000Z`)
  }
  const d = new Date(val as string)
  return Number.isNaN(d.getTime()) ? null : d
}

function normalizeInvoiceType(val: unknown): string | null {
  if (val === undefined || val === null) return null
  const str = String(val).trim().toUpperCase()
  const valid = [
    'ENTER_DIRECT_INVOICE',
    'AGAINST_PO',
    'AGAINST_CO',
    'AGAINST_ADVANCE_PAYMENT',
    'AGAINST_HOLDBACK_AMOUNT',
  ]
  return valid.includes(str) ? str : null
}

function normalizeCreditDays(val: unknown): string | null {
  if (val === undefined || val === null) return null
  const str = String(val).trim()
  if (!str) return null
  const upper = str.toUpperCase()
  const validDays = ['NET_15', 'NET_25', 'NET_30', 'NET_45', 'NET_60']
  if (validDays.includes(upper)) return upper
  return str
}

function normalizeCreditDaysId(val: unknown): string | null {
  if (val === undefined || val === null || val === '') return null
  const s = String(val).trim()
  return s || null
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return []
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size))
  }
  return out
}

function mapChildRow<T extends Record<string, unknown>>(row: T): T {
  const mapped = { ...row } as Record<string, unknown>
  if ('metadata' in mapped) {
    mapped.metadata = parseJson(mapped.metadata as string, {})
  }
  for (const key of [
    'invoice_quantity',
    'invoice_unit_price',
    'invoice_total',
    'unit_price',
    'quantity',
    'total',
    'invoice_amount',
    'po_amount',
    'co_amount',
    'material_budgeted_amount',
    'total_amount',
    'advance_amount',
    'retainage_amount',
    'release_amount',
    'adjusted_amount',
    'holdback_amount',
  ]) {
    if (key in mapped) mapped[key] = toNum(mapped[key])
  }
  if ('id' in mapped && mapped.id != null) mapped.id = String(mapped.id)
  return mapped as T
}

function mapVendorInvoiceRow(row: any, extras: Record<string, unknown> = {}) {
  const financialBreakdown = parseJson(row.financial_breakdown, {})
  const attachments = parseJson(row.attachments, [])
  const removed = parseJson(row.removed_advance_payment_cost_codes, [])

  const record: Record<string, unknown> = {
    id: row.id != null ? String(row.id) : undefined,
    uuid: row.uuid,
    corporation_uuid: row.corporation_uuid,
    project_uuid: row.project_uuid ?? null,
    vendor_uuid: row.vendor_uuid ?? null,
    purchase_order_uuid: row.purchase_order_uuid ?? null,
    change_order_uuid: row.change_order_uuid ?? null,
    invoice_type: row.invoice_type,
    number: row.number ?? null,
    bill_date: toLocalDate(row.bill_date),
    due_date: toLocalDate(row.due_date),
    credit_days: row.credit_days ?? null,
    credit_days_id: row.credit_days_id ?? null,
    amount: toNum(row.amount),
    holdback: toNum(row.holdback),
    financial_breakdown: financialBreakdown,
    attachments,
    status: row.status ?? 'Draft',
    is_active: row.is_active,
    adjusted_against_vendor_invoice_uuid: row.adjusted_against_vendor_invoice_uuid ?? null,
    adjusted_advance_payment_uuid: row.adjusted_advance_payment_uuid ?? null,
    removed_advance_payment_cost_codes: removed,
    holdback_fully_paid: row.holdback_fully_paid ?? null,
    nimble_jeid: row.nimble_jeid ?? null,
    created_at: row.created_at?.toISOString?.() ?? row.created_at ?? null,
    updated_at: row.updated_at?.toISOString?.() ?? row.updated_at ?? null,
    ...extras,
  }

  return decorateVendorInvoiceRecord(record as Record<string, any>)
}

async function fetchVendorInvoiceCoaAssignments(vendorInvoiceUuid: string) {
  const rows = await prisma.vendorInvoiceCoaAssignment.findMany({
    where: { vendor_invoice_uuid: vendorInvoiceUuid },
    orderBy: { segment: 'asc' },
    select: {
      uuid: true,
      segment: true,
      gl_account_uuid: true,
      created_at: true,
      updated_at: true,
    },
  })
  return rows.map((r) => ({
    uuid: r.uuid,
    segment: r.segment,
    gl_account_uuid: r.gl_account_uuid,
    created_at: r.created_at?.toISOString?.() ?? null,
    updated_at: r.updated_at?.toISOString?.() ?? null,
  }))
}

async function persistVendorInvoiceCoaAssignments(options: {
  vendorInvoiceUuid: string
  corporationUuid: string | null | undefined
  payload: Record<string, any>
}) {
  const { vendorInvoiceUuid, corporationUuid, payload } = options
  const corp = corporationUuid ? String(corporationUuid).trim() : ''
  if (!vendorInvoiceUuid || !corp) return

  await prisma.vendorInvoiceCoaAssignment.deleteMany({
    where: { vendor_invoice_uuid: vendorInvoiceUuid },
  })

  const rows = buildVendorInvoiceCoaAssignmentRows(payload).filter((r) => r.gl_account_uuid)
  if (rows.length === 0) return

  await prisma.vendorInvoiceCoaAssignment.createMany({
    data: rows.map((r) => ({
      uuid: randomUUID(),
      corporation_uuid: corp,
      vendor_invoice_uuid: vendorInvoiceUuid,
      segment: r.segment,
      gl_account_uuid: r.gl_account_uuid,
    })),
  })
}

// ─── Child persistence ─────────────────────────────────────────────────────────

async function persistDirectVendorInvoiceLineItems(options: {
  vendorInvoiceUuid: string
  corporationUuid: string | null
  projectUuid: string | null
  items: any[]
}) {
  const { vendorInvoiceUuid, corporationUuid, projectUuid, items = [] } = options
  await prisma.directVendorInvoiceLineItem.deleteMany({
    where: { vendor_invoice_uuid: vendorInvoiceUuid },
  })
  if (!items.length) return

  await prisma.directVendorInvoiceLineItem.createMany({
    data: items.map((item, index) => {
      const sanitized = sanitizeDirectVendorInvoiceLineItem(item, index)
      return {
        uuid: randomUUID(),
        corporation_uuid: corporationUuid!,
        project_uuid: projectUuid,
        vendor_invoice_uuid: vendorInvoiceUuid,
        ...sanitized,
        metadata: stringifyJson(sanitized.metadata),
      }
    }),
  })
}

async function markAdvancePaymentsAsAdjusted(options: {
  invoiceUuid: string
  purchaseOrderUuid?: string
  changeOrderUuid?: string
  deductionAmount: number
}) {
  const { invoiceUuid, purchaseOrderUuid, changeOrderUuid, deductionAmount } = options
  if (!invoiceUuid || (!purchaseOrderUuid && !changeOrderUuid) || deductionAmount <= 0) return

  const where: any = {
    invoice_type: 'AGAINST_ADVANCE_PAYMENT',
    adjusted_against_vendor_invoice_uuid: null,
    is_active: true,
  }
  if (purchaseOrderUuid) where.purchase_order_uuid = purchaseOrderUuid
  else if (changeOrderUuid) where.change_order_uuid = changeOrderUuid

  const advanceInvoices = await prisma.vendorInvoice.findMany({
    where,
    select: { uuid: true, amount: true },
    orderBy: { bill_date: 'asc' },
  })

  let remaining = deductionAmount
  const toMark: string[] = []
  for (const inv of advanceInvoices) {
    if (remaining <= 0) break
    toMark.push(inv.uuid)
    remaining -= toNum(inv.amount) ?? 0
  }

  if (toMark.length > 0) {
    await prisma.vendorInvoice.updateMany({
      where: { uuid: { in: toMark } },
      data: { adjusted_against_vendor_invoice_uuid: invoiceUuid },
    })
  }
}

async function persistAdvancePaymentCostCodes(options: {
  vendorInvoiceUuid: string
  corporationUuid: string | null
  projectUuid: string | null
  vendorUuid: string | null
  purchaseOrderUuid: string | null
  changeOrderUuid: string | null
  items: any[]
}) {
  const {
    vendorInvoiceUuid,
    corporationUuid,
    projectUuid,
    vendorUuid,
    purchaseOrderUuid,
    changeOrderUuid,
    items = [],
  } = options

  await prisma.advancePaymentCostCode.deleteMany({
    where: { vendor_invoice_uuid: vendorInvoiceUuid },
  })
  if (!items.length || !corporationUuid) return

  const prepared = items
    .filter((item) => item.cost_code_uuid)
    .map((item) => {
      const sanitized = sanitizeAdvancePaymentCostCode(item)
      return {
        uuid: randomUUID(),
        ...sanitized,
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        vendor_uuid: vendorUuid,
        purchase_order_uuid: purchaseOrderUuid,
        change_order_uuid: changeOrderUuid,
        vendor_invoice_uuid: vendorInvoiceUuid,
        metadata: stringifyJson(sanitized.metadata),
      }
    })

  if (prepared.length) {
    await prisma.advancePaymentCostCode.createMany({ data: prepared })
  }
}

async function updateHoldbackFullyPaidStatus(holdbackInvoiceUuid: string | null) {
  if (!holdbackInvoiceUuid) return

  const holdbackInvoice = await prisma.vendorInvoice.findFirst({
    where: { uuid: holdbackInvoiceUuid, is_active: true },
    select: {
      uuid: true,
      invoice_type: true,
      purchase_order_uuid: true,
      change_order_uuid: true,
    },
  })
  if (!holdbackInvoice) return

  const invoiceType = String(holdbackInvoice.invoice_type || '').toUpperCase()
  if (invoiceType !== 'AGAINST_PO' && invoiceType !== 'AGAINST_CO') return

  const poCoUuid =
    invoiceType === 'AGAINST_PO'
      ? holdbackInvoice.purchase_order_uuid
      : holdbackInvoice.change_order_uuid
  if (!poCoUuid) return

  const holdbackInvoices = await prisma.vendorInvoice.findMany({
    where: {
      invoice_type: 'AGAINST_HOLDBACK_AMOUNT',
      is_active: true,
      ...(invoiceType === 'AGAINST_PO'
        ? { purchase_order_uuid: poCoUuid }
        : { change_order_uuid: poCoUuid }),
    },
    select: { uuid: true },
  })

  if (!holdbackInvoices.length) {
    await prisma.vendorInvoice.update({
      where: { uuid: holdbackInvoiceUuid },
      data: { holdback_fully_paid: false },
    })
    return
  }

  const holdbackCostCodes = await prisma.holdbackCostCode.findMany({
    where: {
      vendor_invoice_uuid: { in: holdbackInvoices.map((i) => i.uuid) },
      is_active: true,
    },
    select: { cost_code_uuid: true, release_amount: true, retainage_amount: true },
  })

  const releasedMap = new Map<string, number>()
  const retainageMap = new Map<string, number>()

  for (const cc of holdbackCostCodes) {
    if (!cc.cost_code_uuid) continue
    const release = toNum(cc.release_amount) ?? 0
    const retainage = toNum(cc.retainage_amount) ?? 0
    releasedMap.set(cc.cost_code_uuid, (releasedMap.get(cc.cost_code_uuid) ?? 0) + release)
    const current = retainageMap.get(cc.cost_code_uuid) ?? 0
    if (retainage > current) retainageMap.set(cc.cost_code_uuid, retainage)
  }

  let allZero = true
  let hasRetainage = false
  retainageMap.forEach((retainageAmount, costCodeUuid) => {
    if (retainageAmount <= 0) return
    hasRetainage = true
    const released = releasedMap.get(costCodeUuid) ?? 0
    const available = Math.max(
      0,
      Math.round((retainageAmount + Number.EPSILON) * 100) / 100 -
        Math.round((released + Number.EPSILON) * 100) / 100,
    )
    if (available > 0.01) allZero = false
  })

  await prisma.vendorInvoice.update({
    where: { uuid: holdbackInvoiceUuid },
    data: { holdback_fully_paid: hasRetainage && allZero },
  })
}

async function persistHoldbackCostCodes(options: {
  vendorInvoiceUuid: string
  corporationUuid: string | null
  projectUuid: string | null
  vendorUuid: string | null
  purchaseOrderUuid: string | null
  changeOrderUuid: string | null
  holdbackInvoiceUuid: string | null
  items: any[]
}) {
  const {
    vendorInvoiceUuid,
    corporationUuid,
    projectUuid,
    vendorUuid,
    purchaseOrderUuid,
    changeOrderUuid,
    holdbackInvoiceUuid,
    items = [],
  } = options

  await prisma.holdbackCostCode.deleteMany({
    where: { vendor_invoice_uuid: vendorInvoiceUuid },
  })

  if (!items.length) {
    if (holdbackInvoiceUuid) await updateHoldbackFullyPaidStatus(holdbackInvoiceUuid)
    return
  }

  const prepared = items
    .filter((item) => item.cost_code_uuid)
    .map((item) => {
      const sanitized = sanitizeHoldbackCostCode(item)
      return {
        uuid: randomUUID(),
        ...sanitized,
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        vendor_uuid: vendorUuid,
        purchase_order_uuid: purchaseOrderUuid,
        change_order_uuid: changeOrderUuid,
        holdback_invoice_uuid: holdbackInvoiceUuid,
        vendor_invoice_uuid: vendorInvoiceUuid,
        metadata: stringifyJson(sanitized.metadata),
      }
    })

  if (prepared.length) {
    await prisma.holdbackCostCode.createMany({ data: prepared })
  }
  if (holdbackInvoiceUuid) await updateHoldbackFullyPaidStatus(holdbackInvoiceUuid)
}

async function persistVendorInvoiceHoldbackCoaBreakdown(options: {
  vendorInvoiceUuid: string
  corporationUuid: string | null
  projectUuid: string | null
  vendorUuid: string | null
  purchaseOrderUuid: string | null
  changeOrderUuid: string | null
  items: any[]
}) {
  const {
    vendorInvoiceUuid,
    corporationUuid,
    projectUuid,
    vendorUuid,
    purchaseOrderUuid,
    changeOrderUuid,
    items = [],
  } = options

  await prisma.vendorInvoiceHoldbackCoaBreakdown.deleteMany({
    where: { vendor_invoice_uuid: vendorInvoiceUuid },
  })
  if (!items.length) return

  const prepared = items
    .filter((item) => item?.cost_code_uuid)
    .map((item, index) => {
      const sanitized = sanitizeVendorInvoiceHoldbackCoaBreakdownItem(item, index)
      return {
        uuid: randomUUID(),
        ...sanitized,
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        vendor_uuid: vendorUuid,
        vendor_invoice_uuid: vendorInvoiceUuid,
        purchase_order_uuid: purchaseOrderUuid,
        change_order_uuid: changeOrderUuid,
        metadata: stringifyJson(sanitized.metadata),
      }
    })

  if (prepared.length) {
    await prisma.vendorInvoiceHoldbackCoaBreakdown.createMany({ data: prepared })
  }
}

async function persistPurchaseOrderInvoiceItems(options: {
  vendorInvoiceUuid: string
  corporationUuid: string | null
  projectUuid: string | null
  purchaseOrderUuid: string | null
  items: any[]
}) {
  const { vendorInvoiceUuid, corporationUuid, projectUuid, purchaseOrderUuid, items = [] } =
    options
  await prisma.purchaseOrderInvoiceItem.deleteMany({
    where: { vendor_invoice_uuid: vendorInvoiceUuid },
  })
  if (!items.length) return

  await prisma.purchaseOrderInvoiceItem.createMany({
    data: items.map((item, index) => {
      const sanitized = sanitizePurchaseOrderInvoiceItem(item, index)
      return {
        uuid: randomUUID(),
        ...sanitized,
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        purchase_order_uuid: purchaseOrderUuid,
        vendor_invoice_uuid: vendorInvoiceUuid,
        metadata: stringifyJson(sanitized.metadata),
      }
    }),
  })
}

async function persistChangeOrderInvoiceItems(options: {
  vendorInvoiceUuid: string
  corporationUuid: string | null
  projectUuid: string | null
  changeOrderUuid: string | null
  items: any[]
}) {
  const { vendorInvoiceUuid, corporationUuid, projectUuid, changeOrderUuid, items = [] } = options
  await prisma.changeOrderInvoiceItem.deleteMany({
    where: { vendor_invoice_uuid: vendorInvoiceUuid },
  })
  if (!items.length) return

  await prisma.changeOrderInvoiceItem.createMany({
    data: items.map((item, index) => {
      const sanitized = sanitizeChangeOrderInvoiceItem(item, index)
      return {
        uuid: randomUUID(),
        ...sanitized,
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        change_order_uuid: changeOrderUuid,
        vendor_invoice_uuid: vendorInvoiceUuid,
        metadata: stringifyJson(sanitized.metadata),
      }
    }),
  })
}

async function persistPoLwmInvoiceItems(options: {
  vendorInvoiceUuid: string
  corporationUuid: string | null
  projectUuid: string | null
  purchaseOrderUuid: string | null
  items: any[]
}) {
  const { vendorInvoiceUuid, corporationUuid, projectUuid, purchaseOrderUuid, items = [] } =
    options
  await prisma.poLwmInvoiceItem.deleteMany({ where: { vendor_invoice_uuid: vendorInvoiceUuid } })
  if (!items.length) return

  await prisma.poLwmInvoiceItem.createMany({
    data: items.map((item, index) => {
      const sanitized = sanitizePoLwmInvoiceItem(item, index)
      return {
        uuid: randomUUID(),
        ...sanitized,
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        purchase_order_uuid: purchaseOrderUuid,
        vendor_invoice_uuid: vendorInvoiceUuid,
        metadata: stringifyJson(sanitized.metadata),
      }
    }),
  })
}

async function persistCoLwmInvoiceItems(options: {
  vendorInvoiceUuid: string
  corporationUuid: string | null
  projectUuid: string | null
  changeOrderUuid: string | null
  purchaseOrderUuid: string | null
  items: any[]
}) {
  const {
    vendorInvoiceUuid,
    corporationUuid,
    projectUuid,
    changeOrderUuid,
    purchaseOrderUuid,
    items = [],
  } = options
  await prisma.coLwmInvoiceItem.deleteMany({ where: { vendor_invoice_uuid: vendorInvoiceUuid } })
  if (!items.length) return

  await prisma.coLwmInvoiceItem.createMany({
    data: items.map((item, index) => {
      const sanitized = sanitizeCoLwmInvoiceItem(item, index)
      return {
        uuid: randomUUID(),
        ...sanitized,
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        change_order_uuid: changeOrderUuid,
        purchase_order_uuid: purchaseOrderUuid,
        vendor_invoice_uuid: vendorInvoiceUuid,
        metadata: stringifyJson(sanitized.metadata),
      }
    }),
  })
}

async function persistLaborInvoiceItems(options: {
  vendorInvoiceUuid: string
  corporationUuid: string | null
  projectUuid: string | null
  purchaseOrderUuid: string | null
  changeOrderUuid: string | null
  items: any[]
}) {
  const {
    vendorInvoiceUuid,
    corporationUuid,
    projectUuid,
    purchaseOrderUuid,
    changeOrderUuid,
    items = [],
  } = options
  if (!corporationUuid) return

  await prisma.laborInvoiceItem.deleteMany({
    where: { vendor_invoice_uuid: vendorInvoiceUuid },
  })
  if (!items.length) return

  await prisma.laborInvoiceItem.createMany({
    data: items.map((item: any, index: number) => ({
      uuid: randomUUID(),
      corporation_uuid: corporationUuid,
      project_uuid: projectUuid,
      purchase_order_uuid: purchaseOrderUuid,
      change_order_uuid: changeOrderUuid,
      vendor_invoice_uuid: vendorInvoiceUuid,
      labor_po_item_uuid: item.labor_po_item_uuid || null,
      labor_co_item_uuid: item.labor_co_item_uuid || null,
      cost_code_uuid: item.cost_code_uuid || null,
      cost_code_label: item.cost_code_label ?? null,
      cost_code_number: item.cost_code_number ?? null,
      cost_code_name: item.cost_code_name ?? null,
      division_name: item.division_name ?? null,
      invoice_amount: toNum(item.invoice_amount) ?? 0,
      order_index: item.order_index ?? index,
      metadata: stringifyJson(item.metadata ?? {}),
      is_active: true,
    })),
  })
}

async function persistAdjustedAdvancePaymentCostCodes(options: {
  vendorInvoiceUuid: string
  advancePaymentUuid: string
  corporationUuid: string | null
  projectUuid: string | null
  purchaseOrderUuid: string | null
  changeOrderUuid: string | null
  adjustedAmounts: Record<string, number>
  advancePaymentCostCodes: any[]
}) {
  const {
    vendorInvoiceUuid,
    advancePaymentUuid,
    corporationUuid,
    projectUuid,
    purchaseOrderUuid,
    changeOrderUuid,
    adjustedAmounts = {},
    advancePaymentCostCodes = [],
  } = options

  if (!vendorInvoiceUuid || !advancePaymentUuid) return

  await prisma.adjustedAdvancePaymentCostCode.deleteMany({
    where: { vendor_invoice_uuid: vendorInvoiceUuid },
  })

  const prepared: any[] = []

  for (const [costCodeUuid, adjustedAmount] of Object.entries(adjustedAmounts)) {
    if (!costCodeUuid || adjustedAmount <= 0) continue

    if (isTaxAdjustmentKey(costCodeUuid)) {
      const taxLineKey = taxLineKeyFromAdjustmentKey(costCodeUuid)
      prepared.push({
        uuid: randomUUID(),
        vendor_invoice_uuid: vendorInvoiceUuid,
        advance_payment_uuid: advancePaymentUuid,
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        purchase_order_uuid: purchaseOrderUuid,
        change_order_uuid: changeOrderUuid,
        cost_code_uuid: null,
        cost_code_label: defaultLabelForTaxLineKey(taxLineKey),
        cost_code_number: null,
        cost_code_name: null,
        adjusted_amount: parseFloat(String(adjustedAmount)) || 0,
        metadata: stringifyJson({ tax_line_key: taxLineKey }),
        is_active: true,
      })
      continue
    }

    const original = advancePaymentCostCodes.find(
      (cc) => cc.uuid === costCodeUuid || cc.cost_code_uuid === costCodeUuid,
    )

    if (!original) {
      prepared.push({
        uuid: randomUUID(),
        vendor_invoice_uuid: vendorInvoiceUuid,
        advance_payment_uuid: advancePaymentUuid,
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        purchase_order_uuid: purchaseOrderUuid,
        change_order_uuid: changeOrderUuid,
        cost_code_uuid: costCodeUuid,
        adjusted_amount: parseFloat(String(adjustedAmount)) || 0,
        is_active: true,
      })
      continue
    }

    prepared.push({
      uuid: randomUUID(),
      vendor_invoice_uuid: vendorInvoiceUuid,
      advance_payment_uuid: advancePaymentUuid,
      corporation_uuid: corporationUuid,
      project_uuid: projectUuid,
      purchase_order_uuid: purchaseOrderUuid,
      change_order_uuid: changeOrderUuid,
      cost_code_uuid: original.cost_code_uuid || costCodeUuid,
      cost_code_label:
        original.cost_code_label ||
        (original.cost_code_number && original.cost_code_name
          ? `${original.cost_code_number} ${original.cost_code_name}`.trim()
          : null),
      cost_code_number: original.cost_code_number || null,
      cost_code_name: original.cost_code_name || null,
      adjusted_amount: parseFloat(String(adjustedAmount)) || 0,
      is_active: true,
    })
  }

  if (prepared.length) {
    await prisma.adjustedAdvancePaymentCostCode.createMany({ data: prepared })
  }
}

function computeDeductionAmount(body: Record<string, any>, financialBreakdown: unknown, amount: unknown) {
  if (body.advance_payment_deduction !== undefined && body.advance_payment_deduction !== null) {
    return parseFloat(String(body.advance_payment_deduction)) || 0
  }
  if (financialBreakdown && typeof financialBreakdown === 'object') {
    const fb = financialBreakdown as any
    const itemTotal = parseFloat(fb.totals?.item_total || '0') || 0
    const chargesTotal = parseFloat(fb.totals?.charges_total || '0') || 0
    const taxTotal = parseFloat(fb.totals?.tax_total || '0') || 0
    const totalBefore = itemTotal + chargesTotal + taxTotal
    const finalTotal = parseFloat(String(amount ?? '0')) || 0
    return Math.max(0, totalBefore - finalTotal)
  }
  return 0
}

async function persistAdjustedAdvanceFromBody(
  data: { uuid: string; corporation_uuid: string; project_uuid: string | null; purchase_order_uuid: string | null; change_order_uuid: string | null },
  body: Record<string, any>,
  invoiceType: string,
) {
  if (
    (invoiceType !== 'AGAINST_PO' && invoiceType !== 'AGAINST_CO') ||
    body.adjusted_advance_payment_amounts === undefined ||
    !body.adjusted_advance_payment_uuid
  ) {
    return
  }

  const advancePaymentUuid = body.adjusted_advance_payment_uuid
  const adjustedAmounts = body.adjusted_advance_payment_amounts
  const adjustedAmountsForPayment = adjustedAmounts[advancePaymentUuid] || {}

  if (Object.keys(adjustedAmountsForPayment).length === 0) return

  const advancePaymentCostCodes = await prisma.advancePaymentCostCode.findMany({
    where: { vendor_invoice_uuid: advancePaymentUuid, is_active: true },
  })

  await persistAdjustedAdvancePaymentCostCodes({
    vendorInvoiceUuid: data.uuid,
    advancePaymentUuid,
    corporationUuid: data.corporation_uuid,
    projectUuid: data.project_uuid,
    purchaseOrderUuid: invoiceType === 'AGAINST_PO' ? data.purchase_order_uuid : null,
    changeOrderUuid: invoiceType === 'AGAINST_CO' ? data.change_order_uuid : null,
    adjustedAmounts: adjustedAmountsForPayment,
    advancePaymentCostCodes,
  })
}

async function persistChildrenForInvoice(
  data: {
    uuid: string
    corporation_uuid: string
    project_uuid: string | null
    vendor_uuid: string | null
    purchase_order_uuid: string | null
    change_order_uuid: string | null
    amount: unknown
  },
  body: Record<string, any>,
  invoiceType: string,
  financialBreakdown: unknown,
) {
  if (invoiceType === 'ENTER_DIRECT_INVOICE' && Array.isArray(body.line_items)) {
    await persistDirectVendorInvoiceLineItems({
      vendorInvoiceUuid: data.uuid,
      corporationUuid: data.corporation_uuid,
      projectUuid: data.project_uuid,
      items: body.line_items,
    })
  }

  if (invoiceType === 'AGAINST_ADVANCE_PAYMENT' && Array.isArray(body.advance_payment_cost_codes)) {
    await persistAdvancePaymentCostCodes({
      vendorInvoiceUuid: data.uuid,
      corporationUuid: data.corporation_uuid,
      projectUuid: data.project_uuid,
      vendorUuid: data.vendor_uuid,
      purchaseOrderUuid: data.purchase_order_uuid,
      changeOrderUuid: data.change_order_uuid,
      items: body.advance_payment_cost_codes,
    })
  }

  if (invoiceType === 'AGAINST_HOLDBACK_AMOUNT' && Array.isArray(body.holdback_cost_codes)) {
    await persistHoldbackCostCodes({
      vendorInvoiceUuid: data.uuid,
      corporationUuid: data.corporation_uuid,
      projectUuid: data.project_uuid,
      vendorUuid: data.vendor_uuid,
      purchaseOrderUuid: data.purchase_order_uuid,
      changeOrderUuid: data.change_order_uuid,
      holdbackInvoiceUuid: body.holdback_invoice_uuid ?? null,
      items: body.holdback_cost_codes,
    })
  }

  if (invoiceType === 'AGAINST_ADVANCE_PAYMENT' && Array.isArray(body.labor_invoice_items)) {
    await persistLaborInvoiceItems({
      vendorInvoiceUuid: data.uuid,
      corporationUuid: data.corporation_uuid,
      projectUuid: data.project_uuid,
      purchaseOrderUuid: data.purchase_order_uuid,
      changeOrderUuid: data.change_order_uuid,
      items: body.labor_invoice_items,
    })
  }

  if (invoiceType === 'AGAINST_PO') {
    if (Array.isArray(body.po_invoice_items)) {
      await persistPurchaseOrderInvoiceItems({
        vendorInvoiceUuid: data.uuid,
        corporationUuid: data.corporation_uuid,
        projectUuid: data.project_uuid,
        purchaseOrderUuid: data.purchase_order_uuid,
        items: body.po_invoice_items,
      })
    }
    if (Array.isArray(body.po_lwm_invoice_items)) {
      await persistPoLwmInvoiceItems({
        vendorInvoiceUuid: data.uuid,
        corporationUuid: data.corporation_uuid,
        projectUuid: data.project_uuid,
        purchaseOrderUuid: data.purchase_order_uuid,
        items: body.po_lwm_invoice_items,
      })
    }
    if (Array.isArray(body.labor_invoice_items)) {
      await persistLaborInvoiceItems({
        vendorInvoiceUuid: data.uuid,
        corporationUuid: data.corporation_uuid,
        projectUuid: data.project_uuid,
        purchaseOrderUuid: data.purchase_order_uuid,
        changeOrderUuid: data.change_order_uuid,
        items: body.labor_invoice_items,
      })
    }
    await persistAdjustedAdvanceFromBody(data, body, invoiceType)
    const deduction = computeDeductionAmount(body, financialBreakdown, data.amount)
    if (deduction > 0 && data.purchase_order_uuid) {
      await markAdvancePaymentsAsAdjusted({
        invoiceUuid: data.uuid,
        purchaseOrderUuid: data.purchase_order_uuid,
        deductionAmount: deduction,
      })
    }
  }

  if (invoiceType === 'AGAINST_CO') {
    if (Array.isArray(body.co_invoice_items)) {
      await persistChangeOrderInvoiceItems({
        vendorInvoiceUuid: data.uuid,
        corporationUuid: data.corporation_uuid,
        projectUuid: data.project_uuid,
        changeOrderUuid: data.change_order_uuid,
        items: body.co_invoice_items,
      })
    }
    if (Array.isArray(body.co_lwm_invoice_items)) {
      await persistCoLwmInvoiceItems({
        vendorInvoiceUuid: data.uuid,
        corporationUuid: data.corporation_uuid,
        projectUuid: data.project_uuid,
        changeOrderUuid: data.change_order_uuid,
        purchaseOrderUuid: data.purchase_order_uuid,
        items: body.co_lwm_invoice_items,
      })
    }
    if (Array.isArray(body.labor_invoice_items)) {
      await persistLaborInvoiceItems({
        vendorInvoiceUuid: data.uuid,
        corporationUuid: data.corporation_uuid,
        projectUuid: data.project_uuid,
        purchaseOrderUuid: data.purchase_order_uuid,
        changeOrderUuid: data.change_order_uuid,
        items: body.labor_invoice_items,
      })
    }
    await persistAdjustedAdvanceFromBody(data, body, invoiceType)
    const deduction = computeDeductionAmount(body, financialBreakdown, data.amount)
    if (deduction > 0 && data.change_order_uuid) {
      await markAdvancePaymentsAsAdjusted({
        invoiceUuid: data.uuid,
        changeOrderUuid: data.change_order_uuid,
        deductionAmount: deduction,
      })
    }
  }

  if (
    (invoiceType === 'AGAINST_PO' || invoiceType === 'AGAINST_CO') &&
    Array.isArray(body.holdback_coa_breakdown)
  ) {
    await persistVendorInvoiceHoldbackCoaBreakdown({
      vendorInvoiceUuid: data.uuid,
      corporationUuid: data.corporation_uuid,
      projectUuid: data.project_uuid,
      vendorUuid: data.vendor_uuid,
      purchaseOrderUuid: data.purchase_order_uuid,
      changeOrderUuid: data.change_order_uuid,
      items: body.holdback_coa_breakdown,
    })
  }
}

async function loadInvoiceChildren(uuid: string, invoiceType: string) {
  const extras: Record<string, unknown> = {
    line_items: [] as any[],
    po_invoice_items: [] as any[],
    co_invoice_items: [] as any[],
    po_lwm_invoice_items: [] as any[],
    co_lwm_invoice_items: [] as any[],
    labor_invoice_items: [] as any[],
    advance_payment_cost_codes: [] as any[],
    holdback_cost_codes: [] as any[],
    coa_assignments: await fetchVendorInvoiceCoaAssignments(uuid),
  }

  if (invoiceType === 'ENTER_DIRECT_INVOICE') {
    const rows = await prisma.directVendorInvoiceLineItem.findMany({
      where: { vendor_invoice_uuid: uuid, is_active: true },
      orderBy: { order_index: 'asc' },
    })
    extras.line_items = rows.map((r) =>
      hydrateDirectVendorInvoiceLineItemFromDb(mapChildRow(r)),
    )
  }

  if (invoiceType === 'AGAINST_PO') {
    const poItems = await prisma.purchaseOrderInvoiceItem.findMany({
      where: { vendor_invoice_uuid: uuid, is_active: true },
      orderBy: { order_index: 'asc' },
    })
    extras.po_invoice_items = poItems.map(mapChildRow)

    const poLwm = await prisma.poLwmInvoiceItem.findMany({
      where: { vendor_invoice_uuid: uuid, is_active: true },
      orderBy: { order_index: 'asc' },
    })
    extras.po_lwm_invoice_items = poLwm.map(mapChildRow)
  }

  if (invoiceType === 'AGAINST_CO') {
    const coItems = await prisma.changeOrderInvoiceItem.findMany({
      where: { vendor_invoice_uuid: uuid, is_active: true },
      orderBy: { order_index: 'asc' },
    })
    extras.co_invoice_items = coItems.map(mapChildRow)

    const coLwm = await prisma.coLwmInvoiceItem.findMany({
      where: { vendor_invoice_uuid: uuid, is_active: true },
      orderBy: { order_index: 'asc' },
    })
    extras.co_lwm_invoice_items = coLwm.map(mapChildRow)
  }

  if (invoiceType === 'AGAINST_ADVANCE_PAYMENT') {
    const apcc = await prisma.advancePaymentCostCode.findMany({
      where: { vendor_invoice_uuid: uuid, is_active: true },
      orderBy: { created_at: 'asc' },
    })
    extras.advance_payment_cost_codes = apcc.map((r) => ({
      ...mapChildRow(r),
      metadata: parseJson(r.metadata, {}),
    }))
  }

  if (invoiceType === 'AGAINST_HOLDBACK_AMOUNT') {
    const hcc = await prisma.holdbackCostCode.findMany({
      where: { vendor_invoice_uuid: uuid, is_active: true },
      orderBy: { created_at: 'asc' },
    })
    extras.holdback_cost_codes = hcc.map((r) => ({
      ...mapChildRow(r),
      metadata: parseJson(r.metadata, {}),
    }))
    if (hcc.length > 0) {
      extras.holdback_invoice_uuid =
        hcc.find((row) => row.holdback_invoice_uuid)?.holdback_invoice_uuid ?? null
    }
  }

  const laborItems = await prisma.laborInvoiceItem.findMany({
    where: { vendor_invoice_uuid: uuid, is_active: true },
    orderBy: { order_index: 'asc' },
  })
  extras.labor_invoice_items = laborItems.map((r) => ({
    ...mapChildRow(r),
    metadata: parseJson(r.metadata, {}),
  }))

  return extras
}

async function enrichListMetadata(rows: any[]) {
  const projectUuids = [...new Set(rows.map((r) => r.project_uuid).filter(Boolean))] as string[]
  const poUuids = [...new Set(rows.map((r) => r.purchase_order_uuid).filter(Boolean))] as string[]
  const coUuids = [...new Set(rows.map((r) => r.change_order_uuid).filter(Boolean))] as string[]

  const [projects, pos, cos] = await Promise.all([
    projectUuids.length
      ? prisma.project.findMany({
          where: { uuid: { in: projectUuids } },
          select: { uuid: true, project_name: true, project_id: true },
        })
      : [],
    poUuids.length
      ? prisma.purchaseOrderForm.findMany({
          where: { uuid: { in: poUuids } },
          select: { uuid: true, po_number: true },
        })
      : [],
    coUuids.length
      ? prisma.changeOrder.findMany({
          where: { uuid: { in: coUuids } },
          select: { uuid: true, co_number: true },
        })
      : [],
  ])

  const projectMap = new Map(projects.map((p) => [p.uuid, p]))
  const poMap = new Map(pos.map((p) => [p.uuid, p]))
  const coMap = new Map(cos.map((c) => [c.uuid, c]))

  return rows.map((row) => {
    const extras: Record<string, unknown> = {}
    const proj = row.project_uuid ? projectMap.get(row.project_uuid) : null
    if (proj) {
      extras.project_name = proj.project_name
      extras.project_id = proj.project_id
    }
    const po = row.purchase_order_uuid ? poMap.get(row.purchase_order_uuid) : null
    if (po) extras.po_number = po.po_number
    const co = row.change_order_uuid ? coMap.get(row.change_order_uuid) : null
    if (co) extras.co_number = co.co_number
    return mapVendorInvoiceRow(row, extras)
  })
}

function buildInsertData(body: Record<string, any>, invoiceUuid: string, invoiceType: string) {
  const financialBreakdown = buildVendorInvoiceFinancialBreakdown(body)
  return {
    uuid: invoiceUuid,
    corporation_uuid: body.corporation_uuid,
    project_uuid: body.project_uuid || null,
    vendor_uuid: body.vendor_uuid || null,
    purchase_order_uuid: body.purchase_order_uuid || null,
    change_order_uuid: body.change_order_uuid || null,
    invoice_type: invoiceType,
    number: body.number || null,
    bill_date: normalizeUTC(body.bill_date)!,
    due_date: normalizeUTC(body.due_date, true),
    credit_days: normalizeCreditDays(body.credit_days),
    credit_days_id: normalizeCreditDaysId(body.credit_days_id),
    amount: parseFloat(String(body.amount)) || 0,
    holdback: body.holdback ? parseFloat(String(body.holdback)) : null,
    status: body.status || 'Draft',
    is_active: true,
    adjusted_advance_payment_uuid: body.adjusted_advance_payment_uuid || null,
    financial_breakdown: stringifyJson(financialBreakdown),
    attachments: stringifyJson(sanitizeAttachments(body.attachments)),
    removed_advance_payment_cost_codes: Array.isArray(body.removed_advance_payment_cost_codes)
      ? stringifyJson(body.removed_advance_payment_cost_codes)
      : stringifyJson([]),
  }
}

function normalizeEmptyUuids(data: Record<string, any>) {
  for (const key of [
    'project_uuid',
    'vendor_uuid',
    'purchase_order_uuid',
    'change_order_uuid',
    'number',
  ]) {
    if (data[key] === '') data[key] = null
  }
}

// ─── Exported API ──────────────────────────────────────────────────────────────

export async function computeNextVendorInvoiceNumberForCorporation(
  corporationUuid: string,
): Promise<string> {
  const rows = await prisma.vendorInvoice.findMany({
    where: { corporation_uuid: corporationUuid, is_active: true },
    select: { number: true },
    orderBy: { created_at: 'desc' },
    take: 500,
  })

  let maxNum = 0
  for (const r of rows) {
    const num = parseInt(String(r.number || '').replace(/^INV-/i, ''), 10)
    if (!Number.isNaN(num)) maxNum = Math.max(maxNum, num)
  }
  return `INV-${maxNum + 1}`
}

export async function hasVendorInvoicesForPurchaseOrder(
  purchaseOrderUuid: string,
): Promise<boolean> {
  const count = await prisma.vendorInvoice.count({
    where: { purchase_order_uuid: purchaseOrderUuid, is_active: true },
  })
  return count > 0
}

export async function hasVendorInvoicesForChangeOrder(changeOrderUuid: string): Promise<boolean> {
  const count = await prisma.vendorInvoice.count({
    where: { change_order_uuid: changeOrderUuid, is_active: true },
  })
  return count > 0
}

export async function getVendorInvoice(uuid: string) {
  const row = await prisma.vendorInvoice.findFirst({ where: { uuid, is_active: true } })
  if (!row) return null

  const invoiceType = String(row.invoice_type || '')
  const children = await loadInvoiceChildren(uuid, invoiceType)
  const [decorated] = await enrichListMetadata([row])
  return { ...decorated, ...children }
}

export async function listVendorInvoices(query: VendorInvoiceListQuery) {
  const corporationUuid = String(query.corporation_uuid || '').trim()
  if (!corporationUuid) {
    throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
  }

  if (query.uuid) {
    const one = await getVendorInvoice(String(query.uuid))
    if (!one) throw createError({ statusCode: 404, statusMessage: 'Vendor invoice not found' })
    return { data: one }
  }

  if (
    String(query.next_invoice_number || '').toLowerCase() === 'true' ||
    String(query.next_invoice_number || '') === '1'
  ) {
    const number = await computeNextVendorInvoiceNumberForCorporation(corporationUuid)
    return { data: { number } }
  }

  const where: any = { corporation_uuid: corporationUuid, is_active: true }
  if (query.project_uuid) where.project_uuid = query.project_uuid
  if (query.vendor_uuid) where.vendor_uuid = query.vendor_uuid
  if (query.invoice_type) where.invoice_type = query.invoice_type
  if (query.status) {
    if (query.status === 'Pending') {
      where.status = { in: ['Draft', 'Pending'] }
    } else {
      where.status = query.status
    }
  }
  if (query.bill_date_from || query.bill_date_to) {
    where.bill_date = {}
    if (query.bill_date_from) where.bill_date.gte = parseDate(query.bill_date_from)
    if (query.bill_date_to) where.bill_date.lte = parseDateEndOfDay(query.bill_date_to)
  }

  const page = parseInt(String(query.page || 1), 10) || 1
  const pageSize = parseInt(String(query.page_size || 100), 10) || 100
  const skip = (page - 1) * pageSize

  const [totalRecords, rows] = await Promise.all([
    prisma.vendorInvoice.count({ where }),
    prisma.vendorInvoice.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: pageSize,
    }),
  ])

  const totalPages = Math.ceil(totalRecords / pageSize)
  const data = await enrichListMetadata(rows)

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalRecords,
      totalPages,
      hasMore: page < totalPages,
    },
  }
}

export async function createVendorInvoice(body: Record<string, any>) {
  if (!body?.corporation_uuid) {
    throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
  }
  if (!body?.invoice_type) {
    throw createError({ statusCode: 400, statusMessage: 'invoice_type is required' })
  }
  if (!body?.bill_date) {
    throw createError({ statusCode: 400, statusMessage: 'bill_date is required' })
  }
  if (body.amount === null || body.amount === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'amount is required' })
  }

  const invoiceType = normalizeInvoiceType(body.invoice_type)
  if (!invoiceType) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid invoice_type' })
  }

  const invoiceUuid =
    body.uuid && typeof body.uuid === 'string' ? body.uuid : randomUUID()
  const insertData = buildInsertData(body, invoiceUuid, invoiceType)
  normalizeEmptyUuids(insertData)

  const financialBreakdown = parseJson(insertData.financial_breakdown, {})
  const row = await prisma.vendorInvoice.create({ data: insertData })

  if (shouldPersistVendorInvoiceCoaAssignments(body)) {
    await persistVendorInvoiceCoaAssignments({
      vendorInvoiceUuid: row.uuid,
      corporationUuid: row.corporation_uuid,
      payload: body,
    })
  }

  await persistChildrenForInvoice(
    {
      uuid: row.uuid,
      corporation_uuid: row.corporation_uuid,
      project_uuid: row.project_uuid,
      vendor_uuid: row.vendor_uuid,
      purchase_order_uuid: row.purchase_order_uuid,
      change_order_uuid: row.change_order_uuid,
      amount: row.amount,
    },
    body,
    invoiceType,
    financialBreakdown,
  )

  const children = await loadInvoiceChildren(row.uuid, invoiceType)
  const [decorated] = await enrichListMetadata([row])
  return { data: { ...decorated, ...children } }
}

export async function updateVendorInvoice(uuid: string, body: Record<string, any>) {
  const existing = await prisma.vendorInvoice.findFirst({ where: { uuid } })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Vendor invoice not found' })
  }

  const currentInvoiceType = existing.invoice_type
  const newInvoiceType = body.invoice_type
    ? normalizeInvoiceType(body.invoice_type) || currentInvoiceType
    : currentInvoiceType

  const updateData: Record<string, any> = {}
  const fields = [
    'corporation_uuid',
    'project_uuid',
    'vendor_uuid',
    'purchase_order_uuid',
    'change_order_uuid',
    'invoice_type',
    'number',
    'bill_date',
    'due_date',
    'credit_days',
    'credit_days_id',
    'amount',
    'holdback',
    'status',
    'is_active',
    'adjusted_advance_payment_uuid',
  ] as const

  for (const f of fields) {
    if (body[f] === undefined) continue
    if (f === 'bill_date') updateData[f] = normalizeUTC(body[f])
    else if (f === 'due_date') updateData[f] = normalizeUTC(body[f], true)
    else if (f === 'invoice_type') {
      const normalized = normalizeInvoiceType(body[f])
      if (normalized) updateData[f] = normalized
    } else if (f === 'credit_days') updateData[f] = normalizeCreditDays(body[f])
    else if (f === 'credit_days_id') updateData[f] = normalizeCreditDaysId(body[f])
    else if (f === 'amount') updateData[f] = parseFloat(String(body[f])) || 0
    else if (f === 'holdback') updateData[f] = body[f] ? parseFloat(String(body[f])) : null
    else if (f === 'status') {
      const valid = ['Draft', 'Pending', 'Approved', 'Paid']
      if (body[f] && valid.includes(body[f])) updateData[f] = body[f]
    } else updateData[f] = body[f]
  }

  if (body.financial_breakdown !== undefined || hasFinancialFields(body)) {
    updateData.financial_breakdown = stringifyJson(buildVendorInvoiceFinancialBreakdown(body))
  }
  if (body.attachments !== undefined) {
    updateData.attachments = stringifyJson(sanitizeAttachments(body.attachments))
  }
  if (body.removed_advance_payment_cost_codes !== undefined) {
    updateData.removed_advance_payment_cost_codes = stringifyJson(
      Array.isArray(body.removed_advance_payment_cost_codes)
        ? body.removed_advance_payment_cost_codes
        : [],
    )
  }

  normalizeEmptyUuids(updateData)

  const currentPoUuid = existing.purchase_order_uuid
  const newPoUuid =
    body.purchase_order_uuid !== undefined
      ? body.purchase_order_uuid === ''
        ? null
        : body.purchase_order_uuid
      : currentPoUuid

  if (
    currentInvoiceType === 'AGAINST_PO' &&
    currentPoUuid &&
    newPoUuid !== currentPoUuid
  ) {
    await prisma.vendorInvoice.updateMany({
      where: {
        adjusted_against_vendor_invoice_uuid: uuid,
        purchase_order_uuid: currentPoUuid,
      },
      data: { adjusted_against_vendor_invoice_uuid: null },
    })
  }

  const row = await prisma.vendorInvoice.update({ where: { uuid }, data: updateData })

  if (shouldPersistVendorInvoiceCoaAssignments(body)) {
    await persistVendorInvoiceCoaAssignments({
      vendorInvoiceUuid: row.uuid,
      corporationUuid: row.corporation_uuid,
      payload: body,
    })
  }

  const financialBreakdown = parseJson(
    updateData.financial_breakdown ?? row.financial_breakdown,
    {},
  )

  // Type-switch cleanup and child persistence (mirrors reference PUT)
  if (newInvoiceType === 'ENTER_DIRECT_INVOICE') {
    if (body.line_items !== undefined) {
      await persistDirectVendorInvoiceLineItems({
        vendorInvoiceUuid: row.uuid,
        corporationUuid: row.corporation_uuid,
        projectUuid: row.project_uuid,
        items: Array.isArray(body.line_items) ? body.line_items : [],
      })
    } else if (currentInvoiceType !== 'ENTER_DIRECT_INVOICE') {
      await prisma.directVendorInvoiceLineItem.deleteMany({
        where: { vendor_invoice_uuid: row.uuid },
      })
    }
  } else if (currentInvoiceType === 'ENTER_DIRECT_INVOICE') {
    await prisma.directVendorInvoiceLineItem.deleteMany({
      where: { vendor_invoice_uuid: row.uuid },
    })
  }

  if (newInvoiceType === 'AGAINST_ADVANCE_PAYMENT') {
    if (body.advance_payment_cost_codes !== undefined) {
      await persistAdvancePaymentCostCodes({
        vendorInvoiceUuid: row.uuid,
        corporationUuid: row.corporation_uuid,
        projectUuid: row.project_uuid,
        vendorUuid: row.vendor_uuid,
        purchaseOrderUuid: row.purchase_order_uuid,
        changeOrderUuid: row.change_order_uuid,
        items: Array.isArray(body.advance_payment_cost_codes)
          ? body.advance_payment_cost_codes
          : [],
      })
    } else if (currentInvoiceType !== 'AGAINST_ADVANCE_PAYMENT') {
      await prisma.advancePaymentCostCode.deleteMany({
        where: { vendor_invoice_uuid: row.uuid },
      })
    }
  } else if (currentInvoiceType === 'AGAINST_ADVANCE_PAYMENT') {
    await prisma.advancePaymentCostCode.deleteMany({
      where: { vendor_invoice_uuid: row.uuid },
    })
  }

  if (newInvoiceType === 'AGAINST_HOLDBACK_AMOUNT') {
    if (body.holdback_cost_codes !== undefined) {
      await persistHoldbackCostCodes({
        vendorInvoiceUuid: row.uuid,
        corporationUuid: row.corporation_uuid,
        projectUuid: row.project_uuid,
        vendorUuid: row.vendor_uuid,
        purchaseOrderUuid: row.purchase_order_uuid,
        changeOrderUuid: row.change_order_uuid,
        holdbackInvoiceUuid: body.holdback_invoice_uuid ?? null,
        items: Array.isArray(body.holdback_cost_codes) ? body.holdback_cost_codes : [],
      })
    } else if (currentInvoiceType !== 'AGAINST_HOLDBACK_AMOUNT') {
      await prisma.holdbackCostCode.deleteMany({ where: { vendor_invoice_uuid: row.uuid } })
    }
  } else if (currentInvoiceType === 'AGAINST_HOLDBACK_AMOUNT') {
    await prisma.holdbackCostCode.deleteMany({ where: { vendor_invoice_uuid: row.uuid } })
  }

  if (newInvoiceType === 'AGAINST_PO') {
    if (body.po_invoice_items !== undefined) {
      await persistPurchaseOrderInvoiceItems({
        vendorInvoiceUuid: row.uuid,
        corporationUuid: row.corporation_uuid,
        projectUuid: row.project_uuid,
        purchaseOrderUuid: row.purchase_order_uuid,
        items: Array.isArray(body.po_invoice_items) ? body.po_invoice_items : [],
      })
    } else if (currentInvoiceType !== 'AGAINST_PO') {
      await prisma.purchaseOrderInvoiceItem.deleteMany({
        where: { vendor_invoice_uuid: row.uuid },
      })
    }

    if (body.po_lwm_invoice_items !== undefined) {
      await persistPoLwmInvoiceItems({
        vendorInvoiceUuid: row.uuid,
        corporationUuid: row.corporation_uuid,
        projectUuid: row.project_uuid,
        purchaseOrderUuid: row.purchase_order_uuid,
        items: Array.isArray(body.po_lwm_invoice_items) ? body.po_lwm_invoice_items : [],
      })
    } else if (currentInvoiceType !== 'AGAINST_PO') {
      await prisma.poLwmInvoiceItem.deleteMany({ where: { vendor_invoice_uuid: row.uuid } })
    }

    if (body.labor_invoice_items !== undefined) {
      await persistLaborInvoiceItems({
        vendorInvoiceUuid: row.uuid,
        corporationUuid: row.corporation_uuid,
        projectUuid: row.project_uuid,
        purchaseOrderUuid: row.purchase_order_uuid,
        changeOrderUuid: row.change_order_uuid,
        items: Array.isArray(body.labor_invoice_items) ? body.labor_invoice_items : [],
      })
    } else if (currentInvoiceType !== 'AGAINST_PO') {
      await prisma.laborInvoiceItem.deleteMany({ where: { vendor_invoice_uuid: row.uuid } })
    }

    if (
      body.adjusted_advance_payment_amounts !== undefined &&
      body.adjusted_advance_payment_uuid
    ) {
      await persistAdjustedAdvanceFromBody(
        {
          uuid: row.uuid,
          corporation_uuid: row.corporation_uuid,
          project_uuid: row.project_uuid,
          purchase_order_uuid: row.purchase_order_uuid,
          change_order_uuid: row.change_order_uuid,
          amount: row.amount,
        },
        body,
        'AGAINST_PO',
      )
    } else if (
      body.adjusted_advance_payment_uuid === null ||
      body.adjusted_advance_payment_uuid === undefined
    ) {
      await prisma.adjustedAdvancePaymentCostCode.deleteMany({
        where: { vendor_invoice_uuid: row.uuid },
      })
    }

    const deduction = computeDeductionAmount(body, financialBreakdown, row.amount)
    if (deduction > 0 && row.purchase_order_uuid) {
      await markAdvancePaymentsAsAdjusted({
        invoiceUuid: row.uuid,
        purchaseOrderUuid: row.purchase_order_uuid,
        deductionAmount: deduction,
      })
    }
  } else if (currentInvoiceType === 'AGAINST_PO' && newInvoiceType !== 'AGAINST_PO') {
    await prisma.purchaseOrderInvoiceItem.deleteMany({
      where: { vendor_invoice_uuid: row.uuid },
    })
    await prisma.poLwmInvoiceItem.deleteMany({ where: { vendor_invoice_uuid: row.uuid } })
    await prisma.vendorInvoiceHoldbackCoaBreakdown.deleteMany({
      where: { vendor_invoice_uuid: row.uuid },
    })
  }

  if (newInvoiceType === 'AGAINST_CO') {
    if (body.co_invoice_items !== undefined) {
      await persistChangeOrderInvoiceItems({
        vendorInvoiceUuid: row.uuid,
        corporationUuid: row.corporation_uuid,
        projectUuid: row.project_uuid,
        changeOrderUuid: row.change_order_uuid,
        items: Array.isArray(body.co_invoice_items) ? body.co_invoice_items : [],
      })
    } else if (currentInvoiceType !== 'AGAINST_CO') {
      await prisma.changeOrderInvoiceItem.deleteMany({
        where: { vendor_invoice_uuid: row.uuid },
      })
    }

    if (body.co_lwm_invoice_items !== undefined) {
      await persistCoLwmInvoiceItems({
        vendorInvoiceUuid: row.uuid,
        corporationUuid: row.corporation_uuid,
        projectUuid: row.project_uuid,
        changeOrderUuid: row.change_order_uuid,
        purchaseOrderUuid: row.purchase_order_uuid,
        items: Array.isArray(body.co_lwm_invoice_items) ? body.co_lwm_invoice_items : [],
      })
    } else if (currentInvoiceType !== 'AGAINST_CO') {
      await prisma.coLwmInvoiceItem.deleteMany({ where: { vendor_invoice_uuid: row.uuid } })
    }

    if (body.labor_invoice_items !== undefined) {
      await persistLaborInvoiceItems({
        vendorInvoiceUuid: row.uuid,
        corporationUuid: row.corporation_uuid,
        projectUuid: row.project_uuid,
        purchaseOrderUuid: row.purchase_order_uuid,
        changeOrderUuid: row.change_order_uuid,
        items: Array.isArray(body.labor_invoice_items) ? body.labor_invoice_items : [],
      })
    } else if (currentInvoiceType !== 'AGAINST_CO') {
      await prisma.laborInvoiceItem.deleteMany({ where: { vendor_invoice_uuid: row.uuid } })
    }

    if (
      body.adjusted_advance_payment_amounts !== undefined &&
      body.adjusted_advance_payment_uuid
    ) {
      await persistAdjustedAdvanceFromBody(
        {
          uuid: row.uuid,
          corporation_uuid: row.corporation_uuid,
          project_uuid: row.project_uuid,
          purchase_order_uuid: row.purchase_order_uuid,
          change_order_uuid: row.change_order_uuid,
          amount: row.amount,
        },
        body,
        'AGAINST_CO',
      )
    } else if (
      body.adjusted_advance_payment_uuid === null ||
      body.adjusted_advance_payment_uuid === undefined
    ) {
      await prisma.adjustedAdvancePaymentCostCode.deleteMany({
        where: { vendor_invoice_uuid: row.uuid },
      })
    }

    const deduction = computeDeductionAmount(body, financialBreakdown, row.amount)
    if (deduction > 0 && row.change_order_uuid) {
      await markAdvancePaymentsAsAdjusted({
        invoiceUuid: row.uuid,
        changeOrderUuid: row.change_order_uuid,
        deductionAmount: deduction,
      })
    }
  } else if (currentInvoiceType === 'AGAINST_CO' && newInvoiceType !== 'AGAINST_CO') {
    await prisma.changeOrderInvoiceItem.deleteMany({
      where: { vendor_invoice_uuid: row.uuid },
    })
    await prisma.coLwmInvoiceItem.deleteMany({ where: { vendor_invoice_uuid: row.uuid } })
    await prisma.vendorInvoiceHoldbackCoaBreakdown.deleteMany({
      where: { vendor_invoice_uuid: row.uuid },
    })
  }

  if (newInvoiceType === 'AGAINST_ADVANCE_PAYMENT' && body.labor_invoice_items !== undefined) {
    await persistLaborInvoiceItems({
      vendorInvoiceUuid: row.uuid,
      corporationUuid: row.corporation_uuid,
      projectUuid: row.project_uuid,
      purchaseOrderUuid: row.purchase_order_uuid,
      changeOrderUuid: row.change_order_uuid,
      items: Array.isArray(body.labor_invoice_items) ? body.labor_invoice_items : [],
    })
  }

  if (
    (newInvoiceType === 'AGAINST_PO' || newInvoiceType === 'AGAINST_CO') &&
    body.holdback_coa_breakdown !== undefined
  ) {
    await persistVendorInvoiceHoldbackCoaBreakdown({
      vendorInvoiceUuid: row.uuid,
      corporationUuid: row.corporation_uuid,
      projectUuid: row.project_uuid,
      vendorUuid: row.vendor_uuid,
      purchaseOrderUuid: row.purchase_order_uuid,
      changeOrderUuid: row.change_order_uuid,
      items: Array.isArray(body.holdback_coa_breakdown) ? body.holdback_coa_breakdown : [],
    })
  }

  const children = await loadInvoiceChildren(row.uuid, newInvoiceType)
  const [decorated] = await enrichListMetadata([row])
  return { data: { ...decorated, ...children } }
}

export async function deleteVendorInvoice(uuid: string) {
  const invoice = await prisma.vendorInvoice.findFirst({
    where: { uuid },
    select: {
      uuid: true,
      invoice_type: true,
      purchase_order_uuid: true,
      change_order_uuid: true,
    },
  })
  if (!invoice) {
    throw createError({ statusCode: 404, statusMessage: 'Vendor invoice not found' })
  }

  let parentHoldbackInvoiceUuid: string | null = null
  const invoiceType = String(invoice.invoice_type || '').toUpperCase()

  if (invoiceType === 'AGAINST_PO' || invoiceType === 'AGAINST_CO') {
    await prisma.vendorInvoice.updateMany({
      where: { adjusted_against_vendor_invoice_uuid: invoice.uuid },
      data: { adjusted_against_vendor_invoice_uuid: null },
    })
    await prisma.adjustedAdvancePaymentCostCode.updateMany({
      where: { vendor_invoice_uuid: invoice.uuid },
      data: { is_active: false },
    })
  }

  if (invoiceType === 'AGAINST_HOLDBACK_AMOUNT') {
    const hcc = await prisma.holdbackCostCode.findFirst({
      where: { vendor_invoice_uuid: invoice.uuid },
      select: { holdback_invoice_uuid: true },
    })
    parentHoldbackInvoiceUuid = hcc?.holdback_invoice_uuid ?? null
  }

  const row = await prisma.vendorInvoice.update({
    where: { uuid },
    data: { is_active: false },
  })

  if (parentHoldbackInvoiceUuid) {
    await updateHoldbackFullyPaidStatus(parentHoldbackInvoiceUuid)
  }

  return { data: mapVendorInvoiceRow(row) }
}

export async function getPreviouslyInvoicedForOrder(query: PreviouslyInvoicedForOrderQuery) {
  const corporationUuid = String(query.corporation_uuid || '').trim()
  const purchaseOrderUuid = String(query.purchase_order_uuid || '').trim()
  const changeOrderUuid = String(query.change_order_uuid || '').trim()
  const excludeVendorInvoiceUuid = String(query.exclude_vendor_invoice_uuid || '').trim() || undefined

  if (!corporationUuid) {
    throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
  }
  if (!purchaseOrderUuid && !changeOrderUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Exactly one of purchase_order_uuid or change_order_uuid is required',
    })
  }
  if (purchaseOrderUuid && changeOrderUuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Provide only one of purchase_order_uuid or change_order_uuid',
    })
  }

  const isPO = !!purchaseOrderUuid
  const invWhere: any = {
    corporation_uuid: corporationUuid,
    is_active: true,
    invoice_type: isPO ? 'AGAINST_PO' : 'AGAINST_CO',
  }
  if (isPO) invWhere.purchase_order_uuid = purchaseOrderUuid
  else invWhere.change_order_uuid = changeOrderUuid
  if (excludeVendorInvoiceUuid) invWhere.uuid = { not: excludeVendorInvoiceUuid }

  const invRows = await prisma.vendorInvoice.findMany({
    where: invWhere,
    select: { uuid: true },
  })

  const lineQuantities: Record<string, number> = {}
  const lwmAmounts: Record<string, number> = {}
  const vendorInvoiceUuids = invRows.map((r) => r.uuid)

  if (vendorInvoiceUuids.length === 0) {
    return { data: { lineQuantities, lwmAmounts } }
  }

  const toAggregateNum = (val: unknown) => {
    if (val === null || val === undefined || val === '') return 0
    const n = parseFloat(String(val))
    return Number.isFinite(n) ? n : 0
  }

  if (isPO) {
    for (const batch of chunkArray(vendorInvoiceUuids, VENDOR_INVOICE_UUID_CHUNK)) {
      const rows = await prisma.purchaseOrderInvoiceItem.findMany({
        where: { vendor_invoice_uuid: { in: batch }, is_active: true },
        select: { po_item_uuid: true, invoice_quantity: true },
      })
      for (const row of rows) {
        if (!row.po_item_uuid) continue
        lineQuantities[row.po_item_uuid] =
          (lineQuantities[row.po_item_uuid] || 0) + toAggregateNum(row.invoice_quantity)
      }
    }
    for (const batch of chunkArray(vendorInvoiceUuids, VENDOR_INVOICE_UUID_CHUNK)) {
      const rows = await prisma.poLwmInvoiceItem.findMany({
        where: { vendor_invoice_uuid: { in: batch }, is_active: true },
        select: { po_lwm_uuid: true, invoice_amount: true },
      })
      for (const row of rows) {
        if (!row.po_lwm_uuid) continue
        lwmAmounts[row.po_lwm_uuid] =
          (lwmAmounts[row.po_lwm_uuid] || 0) + toAggregateNum(row.invoice_amount)
      }
    }
  } else {
    for (const batch of chunkArray(vendorInvoiceUuids, VENDOR_INVOICE_UUID_CHUNK)) {
      const rows = await prisma.changeOrderInvoiceItem.findMany({
        where: { vendor_invoice_uuid: { in: batch }, is_active: true },
        select: { co_item_uuid: true, invoice_quantity: true },
      })
      for (const row of rows) {
        if (!row.co_item_uuid) continue
        lineQuantities[row.co_item_uuid] =
          (lineQuantities[row.co_item_uuid] || 0) + toAggregateNum(row.invoice_quantity)
      }
    }
    for (const batch of chunkArray(vendorInvoiceUuids, VENDOR_INVOICE_UUID_CHUNK)) {
      const rows = await prisma.coLwmInvoiceItem.findMany({
        where: { vendor_invoice_uuid: { in: batch }, is_active: true },
        select: { co_lwm_uuid: true, invoice_amount: true },
      })
      for (const row of rows) {
        if (!row.co_lwm_uuid) continue
        lwmAmounts[row.co_lwm_uuid] =
          (lwmAmounts[row.co_lwm_uuid] || 0) + toAggregateNum(row.invoice_amount)
      }
    }
  }

  return { data: { lineQuantities, lwmAmounts } }
}
