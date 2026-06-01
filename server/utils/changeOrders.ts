import { randomUUID } from 'node:crypto'
import { getPrisma } from './prisma'
import {
  buildFinancialBreakdown,
  hasFinancialPayload,
  sanitizeAttachments,
} from './financialBreakdown'
import {
  decorateChangeOrderRecord,
  buildLaborCOFinancialBreakdown,
  sanitizeChangeOrderItem,
} from '../api/change-orders/utils'
import { sanitizeLaborChangeOrderItem } from '../api/labor-change-order-items/utils'
import { sanitizeCoLocationWiseMaterialItem } from '../api/co-location-wise-material-items/utils'
import { normalizeAppUserUuidOrNimbleUserId } from './appUserOrNimbleUserId'

const prisma = getPrisma()

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024
const ALLOWED_ATTACHMENT_TYPES = ['application/pdf']

const FK_FIELDS = [
  'project_uuid',
  'vendor_uuid',
  'requested_by',
  'original_purchase_order_uuid',
  'ship_via_uuid',
  'freight_uuid',
  'reason_uuid',
  'shipping_address_uuid',
  'terms_and_conditions_uuid',
  'special_instruction_uuid',
] as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseJson<T = unknown>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback
  try { return JSON.parse(val) as T } catch { return fallback }
}

function stringifyJson(val: unknown): string | null {
  if (val === null || val === undefined) return null
  return JSON.stringify(val)
}

function toLocalDate(d: Date | null | undefined): string | null {
  if (!d) return null
  return d.toISOString().split('T')[0]
}

function parseDate(val: string | null | undefined): Date | null {
  if (!val) return null
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T00:00:00.000Z`)
  }
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

function parseDateEndOfDay(val: string | null | undefined): Date | null {
  if (!val) return null
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T23:59:59.000Z`)
  }
  return parseDate(val)
}

function toNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = parseFloat(String(val))
  return isNaN(n) ? null : n
}

function normalizePrintBooleanFlag(value: unknown): boolean | null {
  if (value === null || value === undefined) return null
  return Boolean(value)
}

function normalizeCoType(val: unknown): string | null {
  if (val === undefined || val === null) return null
  const str = String(val).trim().toUpperCase()
  if (str === 'LABOR' || str === 'MATERIAL') return str
  return null
}

function normalizeFkFields(obj: Record<string, unknown>) {
  for (const key of FK_FIELDS) {
    if (obj[key] === '') obj[key] = null
  }
}

function extractCoSequenceNumber(rawValue: unknown): number | null {
  const coNumber = String(rawValue || '').trim()
  if (!coNumber) return null

  const coTokenMatch = coNumber.match(/CO[^0-9]*(\d+)/i)
  if (coTokenMatch?.[1]) {
    const parsed = parseInt(coTokenMatch[1], 10)
    if (!Number.isNaN(parsed)) return parsed
  }

  const lastNumericMatch = coNumber.match(/(\d+)(?!.*\d)/)
  if (lastNumericMatch?.[1]) {
    const parsed = parseInt(lastNumericMatch[1], 10)
    if (!Number.isNaN(parsed)) return parsed
  }

  return null
}

function buildItemKey(item: any) {
  return `${String(item?.cost_code_uuid ?? '').trim().toUpperCase()}|${String(item?.item_uuid ?? '').trim().toUpperCase()}|${String(item?.model_number ?? '').trim().toUpperCase()}`
}

function getUserInfoFromBody(body: any) {
  const { user_name, user_email, user_image_url } = body || {}
  const resolvedName =
    (typeof body?.prepared_by === 'string' && body.prepared_by.trim()) ||
    (typeof user_name === 'string' && user_name.trim()) ||
    ''
  const resolvedEmail =
    (typeof user_email === 'string' && user_email.trim()) || ''

  if (!resolvedName && !resolvedEmail) return null

  return {
    name: resolvedName || 'Unknown User',
    email: resolvedEmail,
    user_image_url: user_image_url || null,
  }
}

function buildCreateAuditLogEntries(userInfo: NonNullable<ReturnType<typeof getUserInfoFromBody>>, coNumber: string | null, status: string) {
  const entries: any[] = [{
    timestamp: new Date().toISOString(),
    user_name: userInfo.name,
    user_email: userInfo.email,
    user_image_url: userInfo.user_image_url,
    action: 'created',
    description: `Change order ${coNumber || 'created'} created`,
  }]

  if (status === 'Ready') {
    entries.push({
      timestamp: new Date().toISOString(),
      user_name: userInfo.name,
      user_email: userInfo.email,
      user_image_url: userInfo.user_image_url,
      action: 'marked_ready',
      description: 'Change order marked as ready for approval',
    })
  } else if (status === 'Approved') {
    entries.push({
      timestamp: new Date().toISOString(),
      user_name: userInfo.name,
      user_email: userInfo.email,
      user_image_url: userInfo.user_image_url,
      action: 'approved',
      description: 'Change order approved',
    })
  }

  return entries
}

function normalizeStatus(status: unknown): string {
  if (!status) return 'Draft'
  return String(status).trim()
}

function buildStatusAuditEntry(
  userInfo: NonNullable<ReturnType<typeof getUserInfoFromBody>>,
  oldStatus: string,
  newStatus: string,
  isRevised?: boolean,
) {
  if (oldStatus === newStatus) return null

  if (newStatus === 'Ready' && oldStatus !== 'Ready') {
    return {
      timestamp: new Date().toISOString(),
      user_name: userInfo.name,
      user_email: userInfo.email,
      user_image_url: userInfo.user_image_url,
      action: 'marked_ready',
      description: 'Change order marked as ready for approval',
    }
  }
  if (newStatus === 'Approved' && oldStatus !== 'Approved') {
    return {
      timestamp: new Date().toISOString(),
      user_name: userInfo.name,
      user_email: userInfo.email,
      user_image_url: userInfo.user_image_url,
      action: 'approved',
      description: 'Change order approved',
    }
  }
  if (newStatus === 'Rejected' && oldStatus !== 'Rejected') {
    return {
      timestamp: new Date().toISOString(),
      user_name: userInfo.name,
      user_email: userInfo.email,
      user_image_url: userInfo.user_image_url,
      action: 'rejected',
      description: 'Change order rejected',
    }
  }
  if (newStatus === 'Draft' && oldStatus === 'Approved' && isRevised === true) {
    return {
      timestamp: new Date().toISOString(),
      user_name: userInfo.name,
      user_email: userInfo.email,
      user_image_url: userInfo.user_image_url,
      action: 'revised',
      description: 'Change order revised',
    }
  }
  return null
}

async function enrichCoItemsWithCategoryDivision(items: any[], originalPoUuid: string | null): Promise<any[]> {
  if (!originalPoUuid || !Array.isArray(items) || items.length === 0) return items

  const needEnrich = items.some(
    (it: any) =>
      (it?.category == null || it?.category === '') &&
      (it?.division_name == null || it?.division_name === '') &&
      it?.item_division_uuid == null,
  )
  if (!needEnrich) return items

  const poItems = await prisma.purchaseOrderItem.findMany({
    where: { purchase_order_uuid: originalPoUuid, is_active: true },
    select: {
      cost_code_uuid: true,
      item_uuid: true,
      model_number: true,
      category: true,
      division_name: true,
      item_division_uuid: true,
    },
  })
  if (!poItems.length) return items

  const poByKey = new Map<string, typeof poItems[0]>()
  for (const po of poItems) poByKey.set(buildItemKey(po), po)

  return items.map((item: any) => {
    const po = poByKey.get(buildItemKey(item))
    if (!po) return item
    const out = { ...item }
    if ((out.category == null || out.category === '') && po.category) out.category = po.category
    if ((out.division_name == null || out.division_name === '') && po.division_name) {
      out.division_name = po.division_name
    }
    if (out.item_division_uuid == null && po.item_division_uuid) {
      out.item_division_uuid = po.item_division_uuid
    }
    return out
  })
}

async function copyPoItemsToCoItems(originalPoUuid: string) {
  const poItems = await prisma.purchaseOrderItem.findMany({
    where: { purchase_order_uuid: originalPoUuid, is_active: true },
    orderBy: { order_index: 'asc' },
  })
  return poItems.map((poItem) => ({
    order_index: poItem.order_index,
    source: poItem.source,
    cost_code_uuid: poItem.cost_code_uuid,
    cost_code_label: poItem.cost_code_label,
    cost_code_number: poItem.cost_code_number,
    cost_code_name: poItem.cost_code_name,
    division_name: poItem.division_name,
    category: poItem.category,
    item_division_uuid: poItem.item_division_uuid,
    item_type_uuid: poItem.item_type_uuid,
    item_type_label: poItem.item_type_label,
    item_uuid: poItem.item_uuid,
    item_name: poItem.item_name,
    description: poItem.description,
    model_number: poItem.model_number,
    location_uuid: poItem.location_uuid,
    location_label: poItem.location_label,
    unit_uuid: poItem.unit_uuid,
    unit_label: poItem.unit_label,
    co_quantity: poItem.po_quantity,
    co_unit_price: poItem.po_unit_price,
    co_total: poItem.po_total,
    quantity: poItem.po_quantity,
    unit_price: poItem.po_unit_price,
    total: poItem.po_total,
    approval_checks_uuids: parseJson(poItem.approval_checks_uuids, []),
    configuration_name: poItem.configuration_name,
    metadata: parseJson(poItem.metadata, {}),
  }))
}

async function hydrateCoMetadata(mapped: any, row: { project_uuid?: string | null, vendor_uuid?: string | null, original_purchase_order_uuid?: string | null }) {
  if (row.project_uuid) {
    const proj = await prisma.project.findFirst({
      where: { uuid: row.project_uuid },
      select: { project_name: true, project_id: true },
    })
    if (proj) {
      mapped.project_name = proj.project_name
      mapped.project_id = proj.project_id
    }
  }

  if (row.original_purchase_order_uuid) {
    const po = await prisma.purchaseOrderForm.findFirst({
      where: { uuid: row.original_purchase_order_uuid },
      select: { po_number: true },
    })
    if (po) mapped.po_number = po.po_number ?? null
  }

  return mapped
}

// ─── Row Mappers ──────────────────────────────────────────────────────────────

function mapCORow(row: any): any {
  const financialBreakdown = parseJson(row.financial_breakdown, null) as any
  const savedCharges = financialBreakdown?.charges ?? {}
  const savedSalesTaxes = financialBreakdown?.sales_taxes ?? {}

  return {
    id: String(row.id),
    uuid: row.uuid,
    corporation_uuid: row.corporation_uuid,
    project_uuid: row.project_uuid ?? null,
    vendor_uuid: row.vendor_uuid ?? null,
    original_purchase_order_uuid: row.original_purchase_order_uuid ?? null,
    co_number: row.co_number ?? null,
    created_date: toLocalDate(row.created_date),
    credit_days: row.credit_days ?? null,
    credit_days_id: row.credit_days_id ?? null,
    estimated_delivery_date: toLocalDate(row.estimated_delivery_date),
    requested_by: row.requested_by ?? null,
    nimble_requested_by_user_id: row.nimble_requested_by_user_id ?? null,
    co_type: row.co_type ?? null,
    ship_via_uuid: row.ship_via_uuid ?? null,
    freight_uuid: row.freight_uuid ?? null,
    shipping_instructions: row.shipping_instructions ?? null,
    quote_reference: row.quote_reference ?? null,
    reason: row.reason ?? null,
    reason_uuid: row.reason_uuid ?? null,
    shipping_address_uuid: row.shipping_address_uuid ?? null,
    terms_and_conditions_uuid: row.terms_and_conditions_uuid ?? null,
    special_instruction_uuid: row.special_instruction_uuid ?? null,
    item_total: toNum(row.item_total),
    charges_total: toNum(row.charges_total),
    tax_total: toNum(row.tax_total),
    total_co_amount: toNum(row.total_co_amount),
    status: row.status,
    financial_breakdown: financialBreakdown,
    attachments: parseJson(row.attachments, []),
    removed_co_items: parseJson(row.removed_co_items, []),
    audit_log: parseJson(row.audit_log, []),
    prepared_by: row.prepared_by ?? null,
    print_include_approved_by_vendor: row.print_include_approved_by_vendor ?? null,
    print_use_entity_name: row.print_use_entity_name ?? null,
    is_revised: row.is_revised ?? false,
    revision_number: row.revision_number ?? null,
    revision_notes: row.revision_notes ?? null,
    revision_date: toLocalDate(row.revision_date),
    is_active: row.is_active,
    created_at: row.created_at?.toISOString() ?? null,
    updated_at: row.updated_at?.toISOString() ?? null,
    project_name: row.project_name ?? null,
    project_id: row.project_id ?? null,
    po_number: row.po_number ?? null,
    co_items: [],
    labor_co_items: [],
    co_location_wise_material_items: [],
    freight_charges_percentage: savedCharges.freight?.percentage ?? null,
    freight_charges_amount: savedCharges.freight?.amount ?? null,
    freight_charges_taxable: savedCharges.freight?.taxable ?? false,
    packing_charges_percentage: savedCharges.packing?.percentage ?? null,
    packing_charges_amount: savedCharges.packing?.amount ?? null,
    packing_charges_taxable: savedCharges.packing?.taxable ?? false,
    custom_duties_charges_percentage: savedCharges.custom_duties?.percentage ?? null,
    custom_duties_charges_amount: savedCharges.custom_duties?.amount ?? null,
    custom_duties_charges_taxable: savedCharges.custom_duties?.taxable ?? false,
    other_charges_percentage: savedCharges.other?.percentage ?? null,
    other_charges_amount: savedCharges.other?.amount ?? null,
    other_charges_taxable: savedCharges.other?.taxable ?? false,
    sales_tax_1_percentage: savedSalesTaxes.sales_tax_1?.percentage ?? null,
    sales_tax_1_amount: savedSalesTaxes.sales_tax_1?.amount ?? null,
    sales_tax_2_percentage: savedSalesTaxes.sales_tax_2?.percentage ?? null,
    sales_tax_2_amount: savedSalesTaxes.sales_tax_2?.amount ?? null,
  }
}

function mapCOItem(row: any): any {
  const meta = parseJson(row.metadata, {})
  const itemSequence = meta?.item_sequence ?? meta?.sequence ?? null
  const unitLabel = String(
    row.unit_label ?? meta?.unit_label ?? meta?.uom_label ?? meta?.uom ?? meta?.unit ?? '',
  ).trim()
  const unitUuid = row.unit_uuid ?? meta?.unit_uuid ?? meta?.uom_uuid ?? null

  return {
    id: String(row.id),
    uuid: row.uuid,
    corporation_uuid: row.corporation_uuid ?? null,
    project_uuid: row.project_uuid ?? null,
    change_order_uuid: row.change_order_uuid,
    order_index: row.order_index ?? 0,
    source: row.source ?? null,
    cost_code_uuid: row.cost_code_uuid ?? null,
    cost_code_label: row.cost_code_label ?? '',
    cost_code_number: row.cost_code_number ?? '',
    cost_code_name: row.cost_code_name ?? '',
    division_name: row.division_name ?? '',
    category: row.category ?? null,
    item_division_uuid: row.item_division_uuid ?? null,
    item_type_uuid: row.item_type_uuid ?? null,
    item_type_label: row.item_type_label ?? '',
    item_uuid: row.item_uuid ?? null,
    item_name: row.item_name ?? '',
    name: row.item_name ?? '',
    description: row.description ?? '',
    model_number: row.model_number ?? '',
    location_uuid: row.location_uuid ?? null,
    location_label: row.location_label ?? '',
    location: row.location_label ?? '',
    storage_location_uuid: row.storage_location_uuid ?? null,
    storage_location_label: row.storage_location_label ?? '',
    unit_uuid: unitUuid,
    uom_uuid: unitUuid,
    unit_label: unitLabel,
    uom_label: unitLabel,
    unit: unitLabel,
    uom: unitLabel,
    item_sequence: itemSequence,
    sequence: itemSequence,
    quantity: toNum(row.quantity),
    unit_price: toNum(row.unit_price),
    co_quantity: toNum(row.co_quantity),
    co_unit_price: toNum(row.co_unit_price),
    co_total: toNum(row.co_total),
    total: toNum(row.total),
    approval_checks_uuids: parseJson(row.approval_checks_uuids, []),
    approval_checks: parseJson(row.approval_checks_uuids, []),
    configuration_name: row.configuration_name ?? null,
    metadata: meta,
    is_active: row.is_active,
  }
}

function mapLaborCOItem(row: any): any {
  return {
    id: String(row.id),
    uuid: row.uuid,
    corporation_uuid: row.corporation_uuid ?? null,
    project_uuid: row.project_uuid ?? null,
    purchase_order_uuid: row.purchase_order_uuid,
    change_order_uuid: row.change_order_uuid,
    order_index: row.order_index ?? 0,
    cost_code_uuid: row.cost_code_uuid ?? null,
    cost_code_label: row.cost_code_label ?? '',
    cost_code_number: row.cost_code_number ?? '',
    cost_code_name: row.cost_code_name ?? '',
    division_name: row.division_name ?? '',
    location_uuid: row.location_uuid ?? null,
    location_label: row.location_label ?? '',
    po_amount: toNum(row.po_amount) ?? 0,
    co_amount: toNum(row.co_amount),
    description: row.description ?? '',
    metadata: parseJson(row.metadata, {}),
    is_active: row.is_active,
  }
}

function mapCoLocationWiseItem(row: any): any {
  return {
    id: String(row.id),
    uuid: row.uuid,
    corporation_uuid: row.corporation_uuid ?? null,
    project_uuid: row.project_uuid ?? null,
    change_order_uuid: row.change_order_uuid,
    purchase_order_uuid: row.purchase_order_uuid ?? null,
    order_index: row.order_index ?? 0,
    cost_code_uuid: row.cost_code_uuid ?? null,
    cost_code_label: row.cost_code_label ?? '',
    cost_code_number: row.cost_code_number ?? '',
    cost_code_name: row.cost_code_name ?? '',
    division_name: row.division_name ?? '',
    location_uuid: row.location_uuid ?? null,
    location_label: row.location_label ?? '',
    material_budgeted_amount: toNum(row.material_budgeted_amount),
    po_amount: toNum(row.po_amount) ?? 0,
    co_amount: toNum(row.co_amount),
    description: row.description ?? '',
    metadata: parseJson(row.metadata, {}),
    is_active: row.is_active,
  }
}

// ─── CO Number Generation ─────────────────────────────────────────────────────

export async function generateNextCoNumber(
  corporationUuid: string,
  projectId?: string | null,
): Promise<string> {
  const rows = await prisma.changeOrder.findMany({
    where: { corporation_uuid: corporationUuid },
    select: { co_number: true },
  })

  let maxSeq = 0
  for (const row of rows) {
    const seq = extractCoSequenceNumber(row.co_number)
    if (seq !== null) maxSeq = Math.max(maxSeq, seq)
  }

  const nextSuffix = `CO-${maxSeq + 1}`
  const normalizedProjectId = String(projectId || '').trim()
  return normalizedProjectId ? `${normalizedProjectId}-${nextSuffix}` : nextSuffix
}

// ─── Change Order CRUD ────────────────────────────────────────────────────────

export async function listChangeOrders(
  corporationUuid: string,
  options: {
    projectUuid?: string
    vendorUuid?: string
    createdDateFrom?: string
    createdDateTo?: string
    page?: number
    pageSize?: number
  } = {},
) {
  const {
    projectUuid,
    vendorUuid,
    createdDateFrom,
    createdDateTo,
    page = 1,
    pageSize = 100,
  } = options

  const where: any = { corporation_uuid: corporationUuid, is_active: true }
  if (projectUuid) where.project_uuid = projectUuid
  if (vendorUuid) where.vendor_uuid = vendorUuid
  if (createdDateFrom || createdDateTo) {
    where.created_at = {}
    if (createdDateFrom) where.created_at.gte = parseDate(createdDateFrom)
    if (createdDateTo) where.created_at.lte = parseDateEndOfDay(createdDateTo)
  }

  const [total, rows] = await Promise.all([
    prisma.changeOrder.count({ where }),
    prisma.changeOrder.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const projectUuids = [...new Set(rows.map(r => r.project_uuid).filter(Boolean))] as string[]
  const poUuids = [...new Set(rows.map(r => r.original_purchase_order_uuid).filter(Boolean))] as string[]

  const [projects, purchaseOrders] = await Promise.all([
    projectUuids.length
      ? prisma.project.findMany({
          where: { uuid: { in: projectUuids } },
          select: { uuid: true, project_name: true, project_id: true },
        })
      : Promise.resolve([]),
    poUuids.length
      ? prisma.purchaseOrderForm.findMany({
          where: { uuid: { in: poUuids } },
          select: { uuid: true, po_number: true },
        })
      : Promise.resolve([]),
  ])

  const projectMap: Record<string, typeof projects[0]> = {}
  for (const p of projects) projectMap[p.uuid] = p

  const poMap: Record<string, typeof purchaseOrders[0]> = {}
  for (const po of purchaseOrders) poMap[po.uuid] = po

  const totalPages = Math.ceil(total / pageSize)
  const data = rows.map((r) => {
    const mapped = decorateChangeOrderRecord(mapCORow(r) as any)
    const proj = projectMap[r.project_uuid ?? '']
    if (proj) {
      mapped.project_name = proj.project_name
      mapped.project_id = proj.project_id
    }
    const po = poMap[r.original_purchase_order_uuid ?? '']
    if (po) mapped.po_number = po.po_number ?? null
    return mapped
  })

  return {
    data,
    pagination: {
      page,
      pageSize,
      totalRecords: total,
      totalPages,
      hasMore: page < totalPages,
    },
  }
}

export async function getChangeOrder(uuid: string) {
  const row = await prisma.changeOrder.findFirst({ where: { uuid, is_active: true } })
  if (!row) return null

  const mapped = decorateChangeOrderRecord(mapCORow(row) as any)
  await hydrateCoMetadata(mapped, row)

  const normalizedType = (row.co_type || '').toUpperCase()
  if (normalizedType === 'LABOR') {
    const laborItems = await prisma.laborChangeOrderItem.findMany({
      where: { change_order_uuid: uuid, is_active: true },
      orderBy: { order_index: 'asc' },
    })
    mapped.labor_co_items = laborItems.map(mapLaborCOItem)
  } else {
    const coItems = await prisma.changeOrderItem.findMany({
      where: { change_order_uuid: uuid, is_active: true },
      orderBy: { order_index: 'asc' },
    })
    mapped.co_items = coItems.map(mapCOItem)

    const lwItems = await prisma.cOLocationWiseMaterialItem.findMany({
      where: { change_order_uuid: uuid, is_active: true },
      orderBy: { order_index: 'asc' },
    })
    mapped.co_location_wise_material_items = lwItems.map(mapCoLocationWiseItem)
  }

  return mapped
}

export async function createChangeOrder(input: any) {
  const normalizedCoType = normalizeCoType(input.co_type)
  const normalizedRequestedBy = normalizeAppUserUuidOrNimbleUserId(input.requested_by)

  const shouldAutoGenerate = input.auto_generate_co_number === true
  const resolvedCoNumber = shouldAutoGenerate
    ? await generateNextCoNumber(String(input.corporation_uuid), input.project_id)
    : input.co_number ?? null

  const insertData: Record<string, unknown> = {
    corporation_uuid: input.corporation_uuid,
    project_uuid: input.project_uuid ?? null,
    vendor_uuid: input.vendor_uuid ?? null,
    prepared_by: input.prepared_by ?? null,
    original_purchase_order_uuid: input.original_purchase_order_uuid ?? null,
    co_number: resolvedCoNumber,
    created_date: parseDate(input.created_date),
    credit_days: input.credit_days ?? null,
    credit_days_id: input.credit_days_id ?? null,
    estimated_delivery_date: parseDateEndOfDay(input.estimated_delivery_date),
    requested_by: normalizedRequestedBy.appUserUuid,
    nimble_requested_by_user_id: normalizedRequestedBy.nimbleUserId,
    co_type: normalizedCoType,
    ship_via_uuid: input.ship_via_uuid || input.ship_via || null,
    freight_uuid: input.freight_uuid || input.freight || null,
    shipping_instructions: input.shipping_instructions ?? null,
    quote_reference: input.quote_reference ?? null,
    reason_uuid: input.reason_uuid ?? null,
    reason: input.reason ?? null,
    shipping_address_uuid: input.shipping_address_uuid ?? null,
    terms_and_conditions_uuid: input.terms_and_conditions_uuid ?? null,
    special_instruction_uuid: input.special_instruction_uuid ?? null,
    status: input.status ?? 'Draft',
    financial_breakdown: stringifyJson(buildFinancialBreakdown(input)),
    attachments: stringifyJson(sanitizeAttachments(input.attachments ?? [])),
    removed_co_items: stringifyJson(Array.isArray(input.removed_co_items) ? input.removed_co_items : []),
    is_revised: input.is_revised ?? false,
    revision_number: input.revision_number ?? null,
    revision_notes: input.revision_notes ?? null,
    revision_date: input.revision_date ? parseDate(input.revision_date) : null,
    print_include_approved_by_vendor: normalizePrintBooleanFlag(input.print_include_approved_by_vendor),
    print_use_entity_name: normalizePrintBooleanFlag(input.print_use_entity_name),
    is_active: true,
  }

  normalizeFkFields(insertData)

  const userInfo = getUserInfoFromBody(input)
  const auditLogEntries = userInfo
    ? buildCreateAuditLogEntries(userInfo, resolvedCoNumber, String(insertData.status || 'Draft'))
    : []
  insertData.audit_log = stringifyJson(auditLogEntries)

  const co = await prisma.changeOrder.create({ data: insertData as any })

  let coItems = Array.isArray(input.co_items) ? input.co_items : []
  if (
    coItems.length === 0 &&
    input.original_purchase_order_uuid &&
    normalizedCoType === 'MATERIAL'
  ) {
    coItems = await copyPoItemsToCoItems(String(input.original_purchase_order_uuid))
  }

  if (co.uuid) {
    await replaceChangeOrderItems(
      co.uuid,
      co.corporation_uuid ?? null,
      co.project_uuid ?? null,
      coItems,
      input.original_purchase_order_uuid ?? null,
    )

    if (normalizedCoType === 'MATERIAL' || normalizedCoType === null) {
      await replaceCoLocationWiseMaterialItems(
        co.uuid,
        co.corporation_uuid ?? null,
        co.project_uuid ?? null,
        input.original_purchase_order_uuid ?? null,
        Array.isArray(input.co_location_wise_material_items)
          ? input.co_location_wise_material_items
          : [],
      )
    }

    if (normalizedCoType === 'LABOR' && input.original_purchase_order_uuid) {
      const laborItems = Array.isArray(input.labor_co_items) ? input.labor_co_items : []
      await replaceLaborChangeOrderItems(
        co.uuid,
        co.corporation_uuid ?? null,
        co.project_uuid ?? null,
        String(input.original_purchase_order_uuid),
        laborItems,
      )

      const laborItemsTotal = laborItems.reduce((sum: number, item: any) => {
        const amount = toNum(item?.co_amount) ?? 0
        return sum + amount
      }, 0)

      const laborFinancialBreakdown = buildLaborCOFinancialBreakdown(laborItemsTotal, input)
      await prisma.changeOrder.update({
        where: { uuid: co.uuid },
        data: { financial_breakdown: stringifyJson(laborFinancialBreakdown) },
      })
    }
  }

  return getChangeOrder(co.uuid)
}

export async function updateChangeOrder(uuid: string, input: any) {
  const existing = await prisma.changeOrder.findFirst({ where: { uuid, is_active: true } })
  if (!existing) return null

  const updateData: Record<string, unknown> = {}
  const fields = [
    'corporation_uuid',
    'project_uuid',
    'vendor_uuid',
    'prepared_by',
    'original_purchase_order_uuid',
    'co_number',
    'created_date',
    'credit_days',
    'credit_days_id',
    'estimated_delivery_date',
    'co_type',
    'shipping_instructions',
    'quote_reference',
    'reason',
    'reason_uuid',
    'shipping_address_uuid',
    'terms_and_conditions_uuid',
    'special_instruction_uuid',
    'status',
    'is_active',
    'is_revised',
    'revision_number',
    'revision_notes',
  ] as const

  for (const f of fields) {
    if (!(f in input)) continue
    if (f === 'created_date') updateData[f] = parseDate(input[f])
    else if (f === 'estimated_delivery_date') updateData[f] = parseDateEndOfDay(input[f])
    else if (f === 'co_type') updateData[f] = normalizeCoType(input[f])
    else if (f === 'print_include_approved_by_vendor' || f === 'print_use_entity_name') {
      updateData[f] = normalizePrintBooleanFlag(input[f])
    } else {
      updateData[f] = input[f] ?? null
    }
  }

  if ('ship_via_uuid' in input || 'ship_via' in input) {
    updateData.ship_via_uuid = input.ship_via_uuid || input.ship_via || null
  }
  if ('freight_uuid' in input || 'freight' in input) {
    updateData.freight_uuid = input.freight_uuid || input.freight || null
  }

  if (input.requested_by !== undefined) {
    const n = normalizeAppUserUuidOrNimbleUserId(input.requested_by)
    updateData.requested_by = n.appUserUuid
    updateData.nimble_requested_by_user_id = n.nimbleUserId
  }

  if (input.revision_date !== undefined) {
    updateData.revision_date = input.revision_date ? parseDate(input.revision_date) : null
  }

  if (input.removed_co_items !== undefined) {
    updateData.removed_co_items = stringifyJson(
      Array.isArray(input.removed_co_items) ? input.removed_co_items : [],
    )
  }

  normalizeFkFields(updateData)

  if (
    hasFinancialPayload(input) ||
    (input.financial_breakdown && typeof input.financial_breakdown === 'object')
  ) {
    updateData.financial_breakdown = stringifyJson(buildFinancialBreakdown(input))
  }
  if (input.attachments !== undefined) {
    updateData.attachments = stringifyJson(sanitizeAttachments(input.attachments))
  }

  if ('print_include_approved_by_vendor' in input) {
    updateData.print_include_approved_by_vendor = normalizePrintBooleanFlag(
      input.print_include_approved_by_vendor,
    )
  }
  if ('print_use_entity_name' in input) {
    updateData.print_use_entity_name = normalizePrintBooleanFlag(input.print_use_entity_name)
  }

  const userInfo = getUserInfoFromBody(input)
  const existingAuditLog = parseJson(existing.audit_log, []) as any[]
  const oldStatus = normalizeStatus(existing.status)
  const newStatus =
    updateData.status !== undefined && updateData.status !== null
      ? normalizeStatus(updateData.status)
      : oldStatus

  if (userInfo) {
    const statusEntry = buildStatusAuditEntry(
      userInfo,
      oldStatus,
      newStatus,
      input.is_revised === true,
    )
    if (statusEntry) {
      updateData.audit_log = stringifyJson([...existingAuditLog, statusEntry])
    } else {
      const hasFieldChanges = Object.keys(updateData).some(
        (key) => key !== 'status' && key !== 'audit_log',
      )
      if (hasFieldChanges) {
        updateData.audit_log = stringifyJson([
          ...existingAuditLog,
          {
            timestamp: new Date().toISOString(),
            user_name: userInfo.name,
            user_email: userInfo.email,
            user_image_url: userInfo.user_image_url,
            action: 'updated',
            description: 'Change order updated',
          },
        ])
      }
    }
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.changeOrder.update({ where: { uuid }, data: updateData as any })
  }

  const refreshed = await prisma.changeOrder.findFirst({ where: { uuid, is_active: true } })
  if (!refreshed) return null

  const shouldPersistLineItems =
    input.co_items !== undefined ||
    input.co_location_wise_material_items !== undefined ||
    input.labor_co_items !== undefined

  if (shouldPersistLineItems) {
    const originalPoUuid =
      input.original_purchase_order_uuid ?? refreshed.original_purchase_order_uuid ?? null

    if (input.co_items !== undefined) {
      await replaceChangeOrderItems(
        uuid,
        refreshed.corporation_uuid ?? null,
        refreshed.project_uuid ?? null,
        Array.isArray(input.co_items) ? input.co_items : [],
        originalPoUuid,
      )
    }

    const currentCoType = normalizeCoType(input.co_type ?? refreshed.co_type)
    if (currentCoType === 'MATERIAL' || currentCoType === null) {
      if ('co_location_wise_material_items' in input) {
        await replaceCoLocationWiseMaterialItems(
          uuid,
          refreshed.corporation_uuid ?? null,
          refreshed.project_uuid ?? null,
          originalPoUuid,
          Array.isArray(input.co_location_wise_material_items)
            ? input.co_location_wise_material_items
            : [],
        )
      }
    }

    const purchaseOrderUuid =
      input.original_purchase_order_uuid ?? refreshed.original_purchase_order_uuid ?? null

    if (currentCoType === 'LABOR' && purchaseOrderUuid) {
      if ('labor_co_items' in input) {
        const laborItems = Array.isArray(input.labor_co_items) ? input.labor_co_items : []
        await replaceLaborChangeOrderItems(
          uuid,
          refreshed.corporation_uuid ?? null,
          refreshed.project_uuid ?? null,
          String(purchaseOrderUuid),
          laborItems,
        )

        const laborItemsTotal = laborItems.reduce((sum: number, item: any) => {
          return sum + (toNum(item?.co_amount) ?? 0)
        }, 0)

        const laborFinancialPayload = {
          ...decorateChangeOrderRecord(mapCORow(refreshed) as any),
          ...input,
        }
        const laborFinancialBreakdown = buildLaborCOFinancialBreakdown(
          laborItemsTotal,
          laborFinancialPayload,
        )
        await prisma.changeOrder.update({
          where: { uuid },
          data: { financial_breakdown: stringifyJson(laborFinancialBreakdown) },
        })
      } else {
        const existingLaborItems = await prisma.laborChangeOrderItem.findMany({
          where: { change_order_uuid: uuid, is_active: true },
          select: { co_amount: true },
        })
        const laborItemsTotal = existingLaborItems.reduce(
          (sum, item) => sum + (toNum(item.co_amount) ?? 0),
          0,
        )
        const laborFinancialPayload = {
          ...decorateChangeOrderRecord(mapCORow(refreshed) as any),
          ...input,
        }
        const laborFinancialBreakdown = buildLaborCOFinancialBreakdown(
          laborItemsTotal,
          laborFinancialPayload,
        )
        await prisma.changeOrder.update({
          where: { uuid },
          data: { financial_breakdown: stringifyJson(laborFinancialBreakdown) },
        })
      }
    }
  }

  return getChangeOrder(uuid)
}

export async function deleteChangeOrder(uuid: string) {
  const row = await prisma.changeOrder.findFirst({ where: { uuid, is_active: true } })
  if (!row) return null
  await prisma.changeOrder.update({ where: { uuid }, data: { is_active: false } })
  return decorateChangeOrderRecord(mapCORow(row) as any)
}

// ─── CO Items CRUD ──────────────────────────────────────────────────────────────

export async function getChangeOrderItems(changeOrderUuid: string) {
  const rows = await prisma.changeOrderItem.findMany({
    where: { change_order_uuid: changeOrderUuid, is_active: true },
    orderBy: { order_index: 'asc' },
  })
  return rows.map(mapCOItem)
}

export async function getLaborChangeOrderItems(changeOrderUuid: string) {
  const rows = await prisma.laborChangeOrderItem.findMany({
    where: { change_order_uuid: changeOrderUuid, is_active: true },
    orderBy: { order_index: 'asc' },
  })
  return rows.map(mapLaborCOItem)
}

async function replaceChangeOrderItems(
  changeOrderUuid: string,
  corporationUuid: string | null,
  projectUuid: string | null,
  items: any[],
  originalPoUuid?: string | null,
) {
  await prisma.changeOrderItem.deleteMany({ where: { change_order_uuid: changeOrderUuid } })
  if (!items.length) return []

  const enriched = await enrichCoItemsWithCategoryDivision(items, originalPoUuid ?? null)
  const rows = enriched.map((item, index) => {
    const sanitized = sanitizeChangeOrderItem(item, index)
    return {
      corporation_uuid: corporationUuid,
      project_uuid: projectUuid,
      change_order_uuid: changeOrderUuid,
      order_index: sanitized.order_index,
      source: sanitized.source,
      cost_code_uuid: sanitized.cost_code_uuid,
      cost_code_label: sanitized.cost_code_label,
      cost_code_number: sanitized.cost_code_number,
      cost_code_name: sanitized.cost_code_name,
      division_name: sanitized.division_name,
      category: sanitized.category,
      item_division_uuid: sanitized.item_division_uuid,
      item_type_uuid: sanitized.item_type_uuid,
      item_type_label: sanitized.item_type_label,
      item_uuid: sanitized.item_uuid,
      item_name: sanitized.item_name,
      description: sanitized.description,
      model_number: sanitized.model_number,
      location_uuid: sanitized.location_uuid,
      location_label: sanitized.location_label,
      storage_location_uuid: sanitized.storage_location_uuid,
      storage_location_label: sanitized.storage_location_label,
      unit_uuid: sanitized.unit_uuid,
      unit_label: sanitized.unit_label,
      quantity: sanitized.quantity,
      unit_price: sanitized.unit_price,
      co_quantity: sanitized.co_quantity,
      co_unit_price: sanitized.co_unit_price,
      co_total: sanitized.co_total,
      total: sanitized.total,
      approval_checks_uuids: stringifyJson(sanitized.approval_checks_uuids ?? []),
      configuration_name: sanitized.configuration_name,
      metadata: stringifyJson(sanitized.metadata ?? {}),
      is_active: true,
    }
  })

  await prisma.changeOrderItem.createMany({ data: rows })
  return getChangeOrderItems(changeOrderUuid)
}

async function replaceLaborChangeOrderItems(
  changeOrderUuid: string,
  corporationUuid: string | null,
  projectUuid: string | null,
  purchaseOrderUuid: string,
  items: any[],
) {
  if (!purchaseOrderUuid) return []

  await prisma.laborChangeOrderItem.deleteMany({ where: { change_order_uuid: changeOrderUuid } })
  if (!items.length) return []

  const rows = items.map((item, index) => {
    const sanitized = sanitizeLaborChangeOrderItem(item, index)
    return {
      corporation_uuid: corporationUuid,
      project_uuid: projectUuid,
      purchase_order_uuid: purchaseOrderUuid,
      change_order_uuid: changeOrderUuid,
      order_index: sanitized.order_index,
      cost_code_uuid: sanitized.cost_code_uuid,
      cost_code_number: sanitized.cost_code_number,
      cost_code_name: sanitized.cost_code_name,
      cost_code_label: sanitized.cost_code_label,
      division_name: sanitized.division_name,
      location_uuid: sanitized.location_uuid,
      location_label: sanitized.location_label,
      po_amount: sanitized.po_amount,
      co_amount: sanitized.co_amount,
      description: sanitized.description,
      metadata: stringifyJson(sanitized.metadata ?? {}),
      is_active: true,
    }
  })

  await prisma.laborChangeOrderItem.createMany({ data: rows })
  return getLaborChangeOrderItems(changeOrderUuid)
}

async function replaceCoLocationWiseMaterialItems(
  changeOrderUuid: string,
  corporationUuid: string | null,
  projectUuid: string | null,
  purchaseOrderUuid: string | null,
  items: any[],
) {
  await prisma.cOLocationWiseMaterialItem.deleteMany({ where: { change_order_uuid: changeOrderUuid } })
  if (!items.length) return []

  const rows = items.map((item, index) => {
    const sanitized = sanitizeCoLocationWiseMaterialItem(item, index)
    return {
      corporation_uuid: corporationUuid,
      project_uuid: projectUuid,
      change_order_uuid: changeOrderUuid,
      purchase_order_uuid: purchaseOrderUuid,
      order_index: sanitized.order_index,
      cost_code_uuid: sanitized.cost_code_uuid,
      cost_code_number: sanitized.cost_code_number,
      cost_code_name: sanitized.cost_code_name,
      cost_code_label: sanitized.cost_code_label,
      division_name: sanitized.division_name,
      location_uuid: sanitized.location_uuid,
      location_label: sanitized.location_label,
      material_budgeted_amount: sanitized.material_budgeted_amount,
      po_amount: sanitized.po_amount,
      co_amount: sanitized.co_amount,
      description: sanitized.description,
      metadata: stringifyJson(sanitized.metadata ?? {}),
      is_active: true,
    }
  })

  await prisma.cOLocationWiseMaterialItem.createMany({ data: rows })
  const saved = await prisma.cOLocationWiseMaterialItem.findMany({
    where: { change_order_uuid: changeOrderUuid, is_active: true },
    orderBy: { order_index: 'asc' },
  })
  return saved.map(mapCoLocationWiseItem)
}

// ─── Attachments ──────────────────────────────────────────────────────────────

function toDataUrl(fileData: string, mimeType: string): string {
  if (/^data:/i.test(fileData)) return fileData
  const matches = fileData.match(/^data:(.*?);base64,(.*)$/)
  if (matches) return fileData
  const base64 = fileData.includes(',') ? fileData.split(',').pop()! : fileData
  return `data:${mimeType};base64,${base64}`
}

export async function uploadChangeOrderAttachments(changeOrderUuid: string, files: any[]) {
  const row = await prisma.changeOrder.findFirst({
    where: { uuid: changeOrderUuid, is_active: true },
    select: { uuid: true, attachments: true },
  })
  if (!row) return null

  const existingAttachments: any[] = parseJson(row.attachments, [])
  const uploadedAttachments: any[] = []
  const errors: Array<{ fileName: string, error: string }> = []

  for (const file of files) {
    try {
      const name = file?.name
      const type = file?.type
      const size = Number(file?.size)
      const fileData: string | undefined = file?.fileData || file?.url || file?.file

      if (!name || !type || Number.isNaN(size) || !fileData) {
        errors.push({ fileName: name || 'Unknown', error: 'Missing required file properties' })
        continue
      }

      if (!ALLOWED_ATTACHMENT_TYPES.includes(type)) {
        errors.push({ fileName: name, error: 'Invalid file type. Only PDF files are allowed' })
        continue
      }

      if (size > MAX_ATTACHMENT_SIZE) {
        errors.push({ fileName: name, error: 'File size too large. Maximum size is 10MB' })
        continue
      }

      const fileUrl = toDataUrl(fileData, type)
      uploadedAttachments.push({
        uuid: randomUUID(),
        document_name: name,
        mime_type: type,
        file_size: size,
        file_url: fileUrl,
        uploaded_at: new Date().toISOString(),
      })
    } catch (err: any) {
      errors.push({
        fileName: file?.name || 'Unknown',
        error: `Unexpected error processing file: ${err?.message || 'Unknown error'}`,
      })
    }
  }

  if (!uploadedAttachments.length) {
    return {
      success: false,
      attachments: existingAttachments,
      errors,
    }
  }

  const updatedAttachments = [...existingAttachments, ...uploadedAttachments]
  await prisma.changeOrder.update({
    where: { uuid: changeOrderUuid },
    data: { attachments: stringifyJson(updatedAttachments) },
  })

  return {
    success: true,
    attachments: updatedAttachments,
    errors,
  }
}

export async function removeChangeOrderAttachment(changeOrderUuid: string, attachmentUuid: string) {
  const row = await prisma.changeOrder.findFirst({
    where: { uuid: changeOrderUuid, is_active: true },
    select: { uuid: true, attachments: true },
  })
  if (!row) return null

  const existing: any[] = parseJson(row.attachments, [])
  const updatedAttachments = existing.filter((a) => a?.uuid !== attachmentUuid)

  await prisma.changeOrder.update({
    where: { uuid: changeOrderUuid },
    data: { attachments: stringifyJson(updatedAttachments) },
  })

  return {
    success: true,
    attachments: updatedAttachments,
  }
}

// ─── Invoice Summary ────────────────────────────────────────────────────────────

export async function getChangeOrderInvoiceSummary(changeOrderUuid: string) {
  const co = await prisma.changeOrder.findFirst({
    where: { uuid: changeOrderUuid, is_active: true },
    select: { uuid: true, financial_breakdown: true },
  })
  if (!co) return null

  let totalCOValue = 0
  const breakdown = parseJson(co.financial_breakdown, null) as any
  if (breakdown?.totals) {
    totalCOValue =
      toNum(
        breakdown.totals.total_co_amount ??
          breakdown.totals.total_po_amount ??
          breakdown.totals.totalAmount ??
          breakdown.totals.total,
      ) ?? 0
  }

  const coItems = await prisma.changeOrderItem.findMany({
    where: { change_order_uuid: changeOrderUuid, is_active: true },
    select: { uuid: true, co_quantity: true, co_unit_price: true, unit_price: true },
  })

  const totalCOQuantity = coItems.reduce((sum, it) => sum + (toNum(it.co_quantity) ?? 0), 0)

  const balanceFromItems = coItems.reduce((sum, it) => {
    const qty = toNum(it.co_quantity) ?? 0
    const price = toNum(it.co_unit_price ?? it.unit_price) ?? 0
    return sum + qty * price
  }, 0)

  const balanceToBeInvoiced = balanceFromItems > 0
    ? balanceFromItems
    : Math.max(0, totalCOValue)

  const resolvedTotal = totalCOValue > 0 ? totalCOValue : balanceToBeInvoiced

  return {
    change_order_uuid: changeOrderUuid,
    total_co_value: resolvedTotal,
    advance_paid: 0,
    advance_paid_including_taxes: 0,
    invoiced_value: 0,
    holdback_released: 0,
    holdback_balance_to_be_invoiced: 0,
    balance_to_be_invoiced: balanceToBeInvoiced,
    total_co_quantity: totalCOQuantity,
    invoiced_quantity: 0,
    qty_remaining_to_be_invoiced: totalCOQuantity,
  }
}
