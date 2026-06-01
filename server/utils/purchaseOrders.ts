import { getPrisma } from './prisma'

const prisma = getPrisma()

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
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}
function toNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = parseFloat(String(val))
  return isNaN(n) ? null : n
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function looksLikeUuid(value: unknown): boolean {
  return typeof value === 'string' && UUID_REGEX.test(value.trim())
}

/** PO form stores the master-record UUID in `terms_and_conditions` (no separate uuid column). */
function normalizePrintBooleanFlag(value: unknown): boolean | null {
  if (value === null || value === undefined) return null
  return Boolean(value)
}

function resolveTermsAndConditionsForStorage(input: any): string | null {
  const fromUuid = input?.terms_and_conditions_uuid
  if (fromUuid !== null && fromUuid !== undefined && String(fromUuid).trim() !== '') {
    return String(fromUuid).trim()
  }
  const legacy = input?.terms_and_conditions
  if (legacy === null || legacy === undefined || String(legacy).trim() === '') return null
  return String(legacy).trim()
}

// ─── Row Mappers ──────────────────────────────────────────────────────────────

function mapPORow(row: any): any {
  const financialBreakdown = parseJson(row.financial_breakdown, null) as any
  const savedCharges = financialBreakdown?.charges ?? {}
  const savedSalesTaxes = financialBreakdown?.sales_taxes ?? {}

  return {
    id: String(row.id),
    uuid: row.uuid,
    corporation_uuid: row.corporation_uuid,
    project_uuid: row.project_uuid ?? null,
    po_number: row.po_number ?? null,
    entry_date: toLocalDate(row.entry_date),
    po_type: row.po_type ?? null,
    credit_days: row.credit_days ?? null,
    credit_days_id: row.credit_days_id ?? null,
    // ship_via stores a UUID — the client resolves it to a display name via the ship-via master
    ship_via: row.ship_via ?? null,
    // freight stores a UUID — the client resolves it to a display name via the freight master
    freight: row.freight ?? null,
    shipping_instructions: row.shipping_instructions ?? null,
    estimated_delivery_date: toLocalDate(row.estimated_delivery_date),
    include_items: row.include_items ?? null,
    quote_reference: row.quote_reference ?? null,
    terms_and_conditions: row.terms_and_conditions ?? null,
    terms_and_conditions_uuid: looksLikeUuid(row.terms_and_conditions)
      ? String(row.terms_and_conditions).trim()
      : null,
    item_total: toNum(row.item_total),
    charges_total: toNum(row.charges_total),
    tax_total: toNum(row.tax_total),
    total_po_amount: toNum(row.total_po_amount),
    vendor_uuid: row.vendor_uuid ?? null,
    billing_address_uuid: row.billing_address_uuid ?? null,
    shipping_address_uuid: row.shipping_address_uuid ?? null,
    status: row.status,
    financial_breakdown: financialBreakdown,
    attachments: parseJson(row.attachments, []),
    removed_po_items: parseJson(row.removed_po_items, []),
    audit_log: parseJson(row.audit_log, []),
    prepared_by: row.prepared_by ?? null,
    approved_by: row.approved_by ?? null,
    approved_at: row.approved_at ? row.approved_at.toISOString() : null,
    print_include_approved_by_vendor: row.print_include_approved_by_vendor ?? null,
    print_use_entity_name: row.print_use_entity_name ?? null,
    special_instruction_uuid: row.special_instruction_uuid ?? null,
    is_active: row.is_active,
    created_at: row.created_at?.toISOString() ?? null,
    updated_at: row.updated_at?.toISOString() ?? null,
    project_name: row.project_name ?? null,
    project_id: row.project_id ?? null,
    vendor_name: row.vendor_name ?? null,
    po_items: [],
    labor_po_items: [],
    location_wise_material: [],
    // Expose freight/ship_via UUID explicitly so the form select-models resolve
    // without having to treat the `freight`/`ship_via` columns as fallback UUIDs.
    freight_uuid: row.freight ?? null,
    ship_via_uuid: row.ship_via ?? null,
    // ── Restore charge / tax fields from financial_breakdown so the form
    //    re-hydrates correctly when a saved PO is reopened for editing.
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

function mapPOItem(row: any): any {
  const meta = parseJson(row.metadata, {})
  const itemSequence =
    meta?.item_sequence ?? meta?.sequence ?? null
  const unitLabel = String(
    row.unit_label ?? meta?.unit_label ?? meta?.uom_label ?? meta?.uom ?? meta?.unit ?? '',
  ).trim()
  const unitUuid = row.unit_uuid ?? meta?.unit_uuid ?? meta?.uom_uuid ?? null
  return {
    id: String(row.id),
    uuid: row.uuid,
    corporation_uuid: row.corporation_uuid ?? null,
    project_uuid: row.project_uuid ?? null,
    purchase_order_uuid: row.purchase_order_uuid,
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
    po_quantity: toNum(row.po_quantity),
    po_unit_price: toNum(row.po_unit_price),
    po_total: toNum(row.po_total),
    total: toNum(row.total),
    approval_checks_uuids: parseJson(row.approval_checks_uuids, []),
    approval_checks: parseJson(row.approval_checks_uuids, []),
    configuration_name: row.configuration_name ?? null,
    metadata: meta,
    is_active: row.is_active,
  }
}

function mapLaborItem(row: any): any {
  return {
    id: String(row.id),
    uuid: row.uuid,
    corporation_uuid: row.corporation_uuid ?? null,
    project_uuid: row.project_uuid ?? null,
    purchase_order_uuid: row.purchase_order_uuid,
    order_index: row.order_index ?? 0,
    cost_code_uuid: row.cost_code_uuid ?? null,
    cost_code_label: row.cost_code_label ?? '',
    cost_code_number: row.cost_code_number ?? '',
    cost_code_name: row.cost_code_name ?? '',
    division_name: row.division_name ?? '',
    location_uuid: row.location_uuid ?? null,
    location_label: row.location_label ?? '',
    labor_budgeted_amount: toNum(row.labor_budgeted_amount),
    po_amount: toNum(row.po_amount) ?? 0,
    description: row.description ?? '',
    metadata: parseJson(row.metadata, {}),
    is_active: row.is_active,
  }
}

function mapLocationWiseItem(row: any): any {
  return {
    id: String(row.id),
    uuid: row.uuid,
    corporation_uuid: row.corporation_uuid ?? null,
    project_uuid: row.project_uuid ?? null,
    purchase_order_uuid: row.purchase_order_uuid,
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
    description: row.description ?? '',
    metadata: parseJson(row.metadata, {}),
    is_active: row.is_active,
  }
}

function mapReturnNoteRow(row: any): any {
  return {
    id: String(row.id),
    uuid: row.uuid,
    corporation_uuid: row.corporation_uuid,
    project_uuid: row.project_uuid ?? null,
    purchase_order_uuid: row.purchase_order_uuid ?? null,
    return_type: row.return_type ?? null,
    vendor_uuid: row.vendor_uuid ?? null,
    entry_date: toLocalDate(row.entry_date),
    return_note_number: row.return_note_number,
    reference_number: row.reference_number ?? null,
    location_uuid: row.location_uuid ?? null,
    notes: row.notes ?? null,
    status: row.status,
    total_return_amount: toNum(row.total_return_amount),
    attachments: parseJson(row.attachments, []),
    metadata: parseJson(row.metadata, {}),
    audit_log: parseJson(row.audit_log, []),
    is_active: row.is_active,
    created_at: row.created_at?.toISOString() ?? null,
    updated_at: row.updated_at?.toISOString() ?? null,
  }
}

function mapReturnNoteItem(row: any): any {
  return {
    id: String(row.id),
    uuid: row.uuid,
    corporation_uuid: row.corporation_uuid ?? null,
    project_uuid: row.project_uuid ?? null,
    return_note_uuid: row.return_note_uuid,
    item_type: row.item_type ?? null,
    purchase_order_uuid: row.purchase_order_uuid ?? null,
    change_order_uuid: row.change_order_uuid ?? null,
    cost_code_uuid: row.cost_code_uuid ?? null,
    cost_code_label: row.cost_code_label ?? '',
    cost_code_number: row.cost_code_number ?? '',
    cost_code_name: row.cost_code_name ?? '',
    division_name: row.division_name ?? '',
    item_uuid: row.item_uuid ?? null,
    item_name: row.item_name ?? '',
    description: row.description ?? '',
    model_number: row.model_number ?? '',
    location_uuid: row.location_uuid ?? null,
    unit_uuid: row.unit_uuid ?? null,
    unit_label: row.unit_label ?? '',
    category: row.category ?? null,
    po_quantity: toNum(row.po_quantity),
    return_quantity: toNum(row.return_quantity),
    unit_price: toNum(row.unit_price),
    total: toNum(row.total),
    po_item_uuid: row.po_item_uuid ?? null,
    receipt_note_uuid: row.receipt_note_uuid ?? null,
    metadata: parseJson(row.metadata, {}),
    is_active: row.is_active,
  }
}

// ─── PO Number Generation ─────────────────────────────────────────────────────

export async function generateNextPoNumber(corporationUuid: string, projectId?: string | null): Promise<string> {
  const rows = await prisma.purchaseOrderForm.findMany({
    where: { corporation_uuid: corporationUuid, is_active: true },
    select: { po_number: true },
  })
  const prefix = projectId ? `${projectId}-` : ''
  let maxNum = 0
  for (const row of rows) {
    const poNumber = String(row.po_number || '')
    if (!poNumber) continue
    if (prefix) {
      if (!poNumber.startsWith(prefix)) continue
      const num = parseInt(poNumber.slice(prefix.length), 10)
      if (!isNaN(num)) maxNum = Math.max(maxNum, num)
    } else {
      const match = poNumber.match(/(\d+)(?!.*\d)/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (!isNaN(num)) maxNum = Math.max(maxNum, num)
      }
    }
  }
  return String(maxNum + 1)
}

// ─── Purchase Order CRUD ──────────────────────────────────────────────────────

export async function listPurchaseOrders(
  corporationUuid: string,
  options: {
    projectUuid?: string
    vendorUuid?: string
    entryDateFrom?: string
    entryDateTo?: string
    page?: number
    pageSize?: number
  } = {}
) {
  const { projectUuid, vendorUuid, entryDateFrom, entryDateTo, page = 1, pageSize = 100 } = options
  const where: any = { corporation_uuid: corporationUuid, is_active: true }
  if (projectUuid) where.project_uuid = projectUuid
  if (vendorUuid) where.vendor_uuid = vendorUuid
  if (entryDateFrom || entryDateTo) {
    where.entry_date = {}
    if (entryDateFrom) where.entry_date.gte = new Date(entryDateFrom)
    if (entryDateTo) where.entry_date.lte = new Date(`${entryDateTo}T23:59:59.000Z`)
  }

  const [total, rows] = await Promise.all([
    prisma.purchaseOrderForm.count({ where }),
    prisma.purchaseOrderForm.findMany({
      where,
      orderBy: { entry_date: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  // Load project names
  const projectUuids = [...new Set(rows.map(r => r.project_uuid).filter(Boolean))] as string[]
  const projects = await prisma.project.findMany({
    where: { uuid: { in: projectUuids } },
    select: { uuid: true, project_name: true, project_id: true },
  })
  const projectMap: Record<string, any> = {}
  for (const p of projects) projectMap[p.uuid] = p

  const totalPages = Math.ceil(total / pageSize)
  const data = rows.map(r => {
    const mapped = mapPORow(r)
    const proj = projectMap[r.project_uuid ?? '']
    if (proj) {
      mapped.project_name = proj.project_name
      mapped.project_id = proj.project_id
    }
    return mapped
  })

  return {
    data,
    pagination: { page, pageSize, totalRecords: total, totalPages, hasMore: page < totalPages },
  }
}

export async function getPurchaseOrder(uuid: string) {
  const row = await prisma.purchaseOrderForm.findFirst({ where: { uuid, is_active: true } })
  if (!row) return null
  const mapped = mapPORow(row)

  const proj = await prisma.project.findFirst({
    where: { uuid: row.project_uuid ?? '' },
    select: { uuid: true, project_name: true, project_id: true },
  })
  if (proj) {
    mapped.project_name = proj.project_name
    mapped.project_id = proj.project_id
  }

  const normalizedType = (row.po_type || '').toUpperCase()
  if (normalizedType === 'LABOR') {
    const laborItems = await prisma.laborPurchaseOrderItem.findMany({
      where: { purchase_order_uuid: uuid, is_active: true },
      orderBy: { order_index: 'asc' },
    })
    mapped.labor_po_items = laborItems.map(mapLaborItem)

    const lwItems = await prisma.pOLocationWiseMaterialItem.findMany({
      where: { purchase_order_uuid: uuid, is_active: true },
      orderBy: { order_index: 'asc' },
    })
    mapped.location_wise_material = lwItems.map(mapLocationWiseItem)
  } else {
    const poItems = await prisma.purchaseOrderItem.findMany({
      where: { purchase_order_uuid: uuid, is_active: true },
      orderBy: { order_index: 'asc' },
    })
    mapped.po_items = poItems.map(mapPOItem)
  }

  return mapped
}

export async function createPurchaseOrder(input: any) {
  const poData = {
    corporation_uuid: input.corporation_uuid,
    project_uuid: input.project_uuid ?? null,
    po_number: input.po_number ?? null,
    entry_date: parseDate(input.entry_date),
    po_type: input.po_type ? String(input.po_type).toUpperCase() : null,
    credit_days: input.credit_days ?? null,
    credit_days_id: input.credit_days_id ?? null,
    // Prefer UUID over display name so the client can resolve to a name via the master table.
    ship_via: input.ship_via_uuid || input.ship_via || null,
    freight: input.freight_uuid || input.freight || null,
    shipping_instructions: input.shipping_instructions ?? null,
    estimated_delivery_date: parseDate(input.estimated_delivery_date),
    include_items: input.include_items ?? null,
    quote_reference: input.quote_reference ?? null,
    terms_and_conditions: resolveTermsAndConditionsForStorage(input),
    item_total: toNum(input.item_total),
    charges_total: toNum(input.charges_total),
    tax_total: toNum(input.tax_total),
    total_po_amount: toNum(input.total_po_amount),
    vendor_uuid: input.vendor_uuid ?? null,
    billing_address_uuid: input.billing_address_uuid ?? null,
    shipping_address_uuid: input.shipping_address_uuid ?? null,
    status: input.status ?? 'Draft',
    financial_breakdown: stringifyJson(input.financial_breakdown ?? null),
    attachments: stringifyJson(input.attachments ?? []),
    removed_po_items: stringifyJson(input.removed_po_items ?? []),
    audit_log: stringifyJson(input.audit_log ?? []),
    prepared_by: input.prepared_by ?? null,
    approved_by: input.approved_by ?? null,
    approved_at: parseDate(input.approved_at),
    print_include_approved_by_vendor: normalizePrintBooleanFlag(input.print_include_approved_by_vendor),
    print_use_entity_name: normalizePrintBooleanFlag(input.print_use_entity_name),
    special_instruction_uuid: input.special_instruction_uuid ?? null,
    is_active: true,
  }

  const po = await prisma.purchaseOrderForm.create({ data: poData })
  return mapPORow(po)
}

export async function updatePurchaseOrder(uuid: string, input: any) {
  const existing = await prisma.purchaseOrderForm.findFirst({ where: { uuid, is_active: true } })
  if (!existing) return null

  const updateData: any = {}
  const fields = [
    'po_number', 'credit_days', 'credit_days_id',
    'shipping_instructions', 'include_items', 'quote_reference',
    'vendor_uuid', 'billing_address_uuid', 'shipping_address_uuid', 'status',
    'prepared_by', 'approved_by', 'print_include_approved_by_vendor',
    'print_use_entity_name', 'special_instruction_uuid', 'project_uuid',
  ]
  for (const f of fields) {
    if (!(f in input)) continue
    if (f === 'print_include_approved_by_vendor' || f === 'print_use_entity_name') {
      updateData[f] = normalizePrintBooleanFlag(input[f])
    }
    else {
      updateData[f] = input[f] ?? null
    }
  }
  // Prefer UUID over display name — store the master-table UUID so the client
  // can always resolve it to a name via the ship-via / freight master tables.
  if ('ship_via_uuid' in input || 'ship_via' in input) {
    updateData.ship_via = input.ship_via_uuid || input.ship_via || null
  }
  if ('freight_uuid' in input || 'freight' in input) {
    updateData.freight = input.freight_uuid || input.freight || null
  }
  if ('terms_and_conditions_uuid' in input || 'terms_and_conditions' in input) {
    updateData.terms_and_conditions = resolveTermsAndConditionsForStorage(input)
  }
  const numericFields = ['item_total', 'charges_total', 'tax_total', 'total_po_amount']
  for (const f of numericFields) {
    if (f in input) updateData[f] = toNum(input[f])
  }
  const dateFields = ['entry_date', 'estimated_delivery_date', 'approved_at']
  for (const f of dateFields) {
    if (f in input) updateData[f] = parseDate(input[f])
  }
  const jsonFields = ['financial_breakdown', 'attachments', 'removed_po_items', 'audit_log']
  for (const f of jsonFields) {
    if (f in input) updateData[f] = stringifyJson(input[f])
  }
  if (input.po_type !== undefined) updateData.po_type = input.po_type ? String(input.po_type).toUpperCase() : null

  await prisma.purchaseOrderForm.update({ where: { uuid }, data: updateData })
  return getPurchaseOrder(uuid)
}

export async function deletePurchaseOrder(uuid: string) {
  // Guard: check active vendor invoice would be done here in future
  const row = await prisma.purchaseOrderForm.findFirst({ where: { uuid, is_active: true } })
  if (!row) return null
  await prisma.purchaseOrderForm.update({ where: { uuid }, data: { is_active: false } })
  return mapPORow(row)
}

// ─── PO Items CRUD ────────────────────────────────────────────────────────────

export async function getPurchaseOrderItems(purchaseOrderUuid: string) {
  const rows = await prisma.purchaseOrderItem.findMany({
    where: { purchase_order_uuid: purchaseOrderUuid, is_active: true },
    orderBy: { order_index: 'asc' },
  })
  return rows.map(mapPOItem)
}

export async function replacePurchaseOrderItems(
  purchaseOrderUuid: string,
  corporationUuid: string | null,
  projectUuid: string | null,
  items: any[]
) {
  await prisma.purchaseOrderItem.deleteMany({ where: { purchase_order_uuid: purchaseOrderUuid } })
  if (!items.length) return []

  const rows = items.map((item, index) => {
    const meta = { ...(item?.metadata || {}) }
    const display =
      item?.display_metadata && typeof item.display_metadata === 'object'
        ? item.display_metadata
        : {}
    if ('preferred_vendor_uuid' in (item || {})) {
      const v = item.preferred_vendor_uuid
      meta.preferred_vendor_uuid = v === null || v === undefined || String(v).trim() === '' ? null : String(v).trim()
    }
    const unitLabel = String(
      item?.uom_label ??
        item?.unit_label ??
        meta?.unit_label ??
        meta?.uom_label ??
        display?.unit_label ??
        display?.uom ??
        '',
    ).trim()
    if (unitLabel) {
      meta.unit_label = unitLabel
      meta.uom_label = unitLabel
      meta.uom = unitLabel
      meta.unit = unitLabel
    }
    const unitUuid =
      item?.uom_uuid ??
      item?.unit_uuid ??
      meta?.unit_uuid ??
      meta?.uom_uuid ??
      display?.unit_uuid ??
      null
    if (unitUuid) {
      meta.unit_uuid = String(unitUuid)
      meta.uom_uuid = String(unitUuid)
    }
    const sequenceRaw =
      item?.item_sequence ??
      item?.sequence ??
      meta?.item_sequence ??
      meta?.sequence ??
      (item?.display_metadata && typeof item.display_metadata === 'object'
        ? (item.display_metadata as Record<string, unknown>).sequence
        : null)
    if (sequenceRaw != null && String(sequenceRaw).trim() !== '') {
      const seq = String(sequenceRaw).trim()
      meta.sequence = seq
      meta.item_sequence = seq
    }
    return {
      corporation_uuid: corporationUuid,
      project_uuid: projectUuid,
      purchase_order_uuid: purchaseOrderUuid,
      order_index: item?.order_index ?? index,
      source: item?.source ?? null,
      cost_code_uuid: item?.cost_code_uuid ?? null,
      cost_code_label: item?.cost_code_label ?? null,
      cost_code_number: item?.cost_code_number ?? null,
      cost_code_name: item?.cost_code_name ?? null,
      division_name: item?.division_name ?? null,
      category: item?.category ?? null,
      item_division_uuid: item?.item_division_uuid ?? null,
      item_type_uuid: item?.item_type_uuid ?? null,
      item_type_label: item?.item_type_label ?? null,
      item_uuid: item?.item_uuid ?? null,
      item_name: item?.name ?? item?.item_name ?? item?.description ?? '',
      description: item?.description ?? '',
      model_number: item?.model_number ?? '',
      location_uuid: item?.location_uuid ?? null,
      location_label: item?.location_label ?? item?.location ?? null,
      unit_uuid: unitUuid ? String(unitUuid) : null,
      unit_label: unitLabel || null,
      quantity: toNum(item?.quantity),
      unit_price: toNum(item?.unit_price),
      po_quantity: toNum(item?.po_quantity),
      po_unit_price: toNum(item?.po_unit_price),
      po_total: toNum(item?.po_total),
      total: toNum(item?.total),
      approval_checks_uuids: stringifyJson(
        Array.isArray(item?.approval_checks_uuids) && item.approval_checks_uuids.length
          ? item.approval_checks_uuids
          : (Array.isArray(item?.approval_checks) && item.approval_checks.length ? item.approval_checks : [])
      ),
      configuration_name: item?.configuration_name ?? null,
      metadata: stringifyJson(meta),
      is_active: true,
    }
  })

  await prisma.purchaseOrderItem.createMany({ data: rows })
  return getPurchaseOrderItems(purchaseOrderUuid)
}

// ─── Labor PO Items CRUD ──────────────────────────────────────────────────────

export async function getLaborPurchaseOrderItems(purchaseOrderUuid: string) {
  const rows = await prisma.laborPurchaseOrderItem.findMany({
    where: { purchase_order_uuid: purchaseOrderUuid, is_active: true },
    orderBy: { order_index: 'asc' },
  })
  return rows.map(mapLaborItem)
}

export async function replaceLaborPurchaseOrderItems(
  purchaseOrderUuid: string,
  corporationUuid: string | null,
  projectUuid: string | null,
  items: any[]
) {
  await prisma.laborPurchaseOrderItem.deleteMany({ where: { purchase_order_uuid: purchaseOrderUuid } })
  if (!items.length) return []

  const rows = items.map((item, index) => {
    const meta = item?.metadata || {}
    const merged = typeof meta === 'object' && meta !== null
      ? { ...meta, ...(item?.location_uuid != null ? { location_uuid: item.location_uuid } : {}), ...(item?.location_label != null ? { location_label: item.location_label } : {}) }
      : {}
    return {
      corporation_uuid: corporationUuid,
      project_uuid: projectUuid,
      purchase_order_uuid: purchaseOrderUuid,
      order_index: item?.order_index ?? index,
      cost_code_uuid: item?.cost_code_uuid ?? null,
      cost_code_label: item?.cost_code_label ?? null,
      cost_code_number: item?.cost_code_number ?? null,
      cost_code_name: item?.cost_code_name ?? null,
      division_name: item?.division_name ?? null,
      location_uuid: item?.location_uuid ?? null,
      location_label: item?.location_label ?? null,
      labor_budgeted_amount: toNum(item?.labor_budgeted_amount),
      po_amount: toNum(item?.po_amount) ?? 0,
      description: item?.description ?? null,
      metadata: stringifyJson(merged),
      is_active: true,
    }
  })

  await prisma.laborPurchaseOrderItem.createMany({ data: rows })
  return getLaborPurchaseOrderItems(purchaseOrderUuid)
}

// ─── Location-Wise Material Items ─────────────────────────────────────────────

export async function getLocationWiseMaterialItems(purchaseOrderUuid: string) {
  const rows = await prisma.pOLocationWiseMaterialItem.findMany({
    where: { purchase_order_uuid: purchaseOrderUuid, is_active: true },
    orderBy: { order_index: 'asc' },
  })
  return rows.map(mapLocationWiseItem)
}

export async function replaceLocationWiseMaterialItems(
  purchaseOrderUuid: string,
  corporationUuid: string | null,
  projectUuid: string | null,
  items: any[]
) {
  await prisma.pOLocationWiseMaterialItem.deleteMany({ where: { purchase_order_uuid: purchaseOrderUuid } })
  if (!items.length) return []

  const rows = items.map((item, index) => ({
    corporation_uuid: corporationUuid,
    project_uuid: projectUuid,
    purchase_order_uuid: purchaseOrderUuid,
    order_index: item?.order_index ?? index,
    cost_code_uuid: item?.cost_code_uuid ?? null,
    cost_code_label: item?.cost_code_label ?? null,
    cost_code_number: item?.cost_code_number ?? null,
    cost_code_name: item?.cost_code_name ?? null,
    division_name: item?.division_name ?? null,
    location_uuid: item?.location_uuid ?? null,
    location_label: item?.location_label ?? null,
    material_budgeted_amount: toNum(item?.material_budgeted_amount),
    po_amount: toNum(item?.po_amount) ?? 0,
    description: item?.description ?? '',
    metadata: stringifyJson(typeof item?.metadata === 'object' && item.metadata !== null ? item.metadata : {}),
    is_active: true,
  }))

  await prisma.pOLocationWiseMaterialItem.createMany({ data: rows })
  return getLocationWiseMaterialItems(purchaseOrderUuid)
}

// ─── Stock Return Notes ───────────────────────────────────────────────────────

export async function generateNextReturnNoteNumber(corporationUuid: string): Promise<string> {
  const rows = await prisma.stockReturnNote.findMany({
    where: { corporation_uuid: corporationUuid, is_active: true },
    select: { return_note_number: true },
  })
  let maxNum = 0
  for (const row of rows) {
    const num = parseInt(String(row.return_note_number || '').replace(/^RTN-/i, ''), 10)
    if (!isNaN(num)) maxNum = Math.max(maxNum, num)
  }
  return `RTN-${maxNum + 1}`
}

export async function listStockReturnNotes(
  corporationUuid: string,
  options: { projectUuid?: string; vendorUuid?: string } = {}
) {
  const where: any = { corporation_uuid: corporationUuid, is_active: true }
  if (options.projectUuid) where.project_uuid = options.projectUuid
  if (options.vendorUuid) where.vendor_uuid = options.vendorUuid

  const rows = await prisma.stockReturnNote.findMany({ where, orderBy: { entry_date: 'desc' } })
  return rows.map(mapReturnNoteRow)
}

export async function getStockReturnNote(uuid: string) {
  const row = await prisma.stockReturnNote.findFirst({ where: { uuid, is_active: true } })
  if (!row) return null
  return mapReturnNoteRow(row)
}

export async function createStockReturnNote(input: any) {
  const row = await prisma.stockReturnNote.create({
    data: {
      corporation_uuid: input.corporation_uuid,
      project_uuid: input.project_uuid ?? null,
      purchase_order_uuid: input.purchase_order_uuid ?? null,
      return_type: input.return_type ?? null,
      vendor_uuid: input.vendor_uuid ?? null,
      entry_date: parseDate(input.entry_date),
      return_note_number: input.return_note_number || await generateNextReturnNoteNumber(input.corporation_uuid),
      reference_number: input.reference_number ?? null,
      location_uuid: input.location_uuid ?? null,
      notes: input.notes ?? null,
      status: input.status ?? 'Draft',
      total_return_amount: toNum(input.total_return_amount),
      attachments: stringifyJson(input.attachments ?? []),
      metadata: stringifyJson(input.metadata ?? {}),
      audit_log: stringifyJson(input.audit_log ?? []),
      is_active: true,
    },
  })
  return mapReturnNoteRow(row)
}

export async function updateStockReturnNote(uuid: string, input: any) {
  const existing = await prisma.stockReturnNote.findFirst({ where: { uuid, is_active: true } })
  if (!existing) return null

  const updateData: any = {}
  const fields = ['project_uuid', 'purchase_order_uuid', 'return_type', 'vendor_uuid', 'return_note_number',
    'reference_number', 'location_uuid', 'notes', 'status']
  for (const f of fields) {
    if (f in input) updateData[f] = input[f] ?? null
  }
  if ('entry_date' in input) updateData.entry_date = parseDate(input.entry_date)
  if ('total_return_amount' in input) updateData.total_return_amount = toNum(input.total_return_amount)
  if ('attachments' in input) updateData.attachments = stringifyJson(input.attachments)
  if ('metadata' in input) updateData.metadata = stringifyJson(input.metadata)
  if ('audit_log' in input) updateData.audit_log = stringifyJson(input.audit_log)

  const row = await prisma.stockReturnNote.update({ where: { uuid }, data: updateData })
  return mapReturnNoteRow(row)
}

export async function deleteStockReturnNote(uuid: string) {
  const row = await prisma.stockReturnNote.findFirst({ where: { uuid, is_active: true } })
  if (!row) return null
  await prisma.stockReturnNote.update({ where: { uuid }, data: { is_active: false } })
  return mapReturnNoteRow(row)
}

// ─── Return Note Items ────────────────────────────────────────────────────────

export async function getReturnNoteItems(returnNoteUuid: string) {
  const rows = await prisma.returnNoteItem.findMany({
    where: { return_note_uuid: returnNoteUuid, is_active: true },
    orderBy: { id: 'asc' },
  })
  return rows.map(mapReturnNoteItem)
}

export async function replaceReturnNoteItems(returnNoteUuid: string, corporationUuid: string | null, projectUuid: string | null, items: any[]) {
  await prisma.returnNoteItem.deleteMany({ where: { return_note_uuid: returnNoteUuid } })
  if (!items.length) return []

  const rows = items.map(item => ({
    corporation_uuid: corporationUuid,
    project_uuid: projectUuid,
    return_note_uuid: returnNoteUuid,
    item_type: item?.item_type ?? null,
    purchase_order_uuid: item?.purchase_order_uuid ?? null,
    change_order_uuid: item?.change_order_uuid ?? null,
    cost_code_uuid: item?.cost_code_uuid ?? null,
    cost_code_label: item?.cost_code_label ?? null,
    cost_code_number: item?.cost_code_number ?? null,
    cost_code_name: item?.cost_code_name ?? null,
    division_name: item?.division_name ?? null,
    item_uuid: item?.item_uuid ?? null,
    item_name: item?.item_name ?? item?.name ?? '',
    description: item?.description ?? '',
    model_number: item?.model_number ?? '',
    location_uuid: item?.location_uuid ?? null,
    unit_uuid: item?.unit_uuid ?? null,
    unit_label: item?.unit_label ?? null,
    category: item?.category ?? null,
    po_quantity: toNum(item?.po_quantity),
    return_quantity: toNum(item?.return_quantity),
    unit_price: toNum(item?.unit_price),
    total: toNum(item?.total),
    po_item_uuid: item?.po_item_uuid ?? null,
    receipt_note_uuid: item?.receipt_note_uuid ?? null,
    metadata: stringifyJson(item?.metadata ?? {}),
    is_active: true,
  }))

  await prisma.returnNoteItem.createMany({ data: rows })
  return getReturnNoteItems(returnNoteUuid)
}

// ─── Vendor List for Filters ──────────────────────────────────────────────────

export async function getVendorsForPurchaseOrders(corporationUuid: string) {
  const rows = await prisma.purchaseOrderForm.findMany({
    where: { corporation_uuid: corporationUuid, is_active: true, vendor_uuid: { not: null } },
    select: { vendor_uuid: true },
    distinct: ['vendor_uuid'],
  })
  return rows.map(r => ({ vendor_uuid: r.vendor_uuid })).filter(r => r.vendor_uuid)
}
