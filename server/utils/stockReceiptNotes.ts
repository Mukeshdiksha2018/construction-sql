import { randomUUID } from 'node:crypto'
import { getPrisma } from './prisma'
import { sanitizeAttachments } from './financialBreakdown'
import {
  applyChangeOrderReceiptFieldsUpdate,
  applyPurchaseOrderReceiptFieldsUpdate,
} from './receiptNoteReceiptLinePersistence'

const prisma = getPrisma()
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T00:00:00.000Z`)
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

function parseDateEndOfDay(val: string | null | undefined): Date | null {
  if (!val) return null
  const s = String(val).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(`${s}T23:59:59.000Z`)
  return parseDate(val)
}

function toNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = parseFloat(String(val))
  return isNaN(n) ? null : n
}

function normalizeStatus(status?: string | null): string {
  const s = String(status || '').trim()
  return s.toLowerCase() === 'received' ? 'Received' : 'Shipment'
}

function normalizeReceiptType(val: unknown): 'purchase_order' | 'change_order' {
  return String(val || '').trim() === 'change_order' ? 'change_order' : 'purchase_order'
}

function normalizeReceivedByFields(rawValue: unknown) {
  if (rawValue === null || rawValue === undefined) {
    return { receivedBy: null as string | null, nimbleReceivedByUserId: null as string | null }
  }
  const value = String(rawValue).trim()
  if (!value) return { receivedBy: null, nimbleReceivedByUserId: null }
  if (UUID_REGEX.test(value)) {
    return { receivedBy: value, nimbleReceivedByUserId: null }
  }
  return { receivedBy: null, nimbleReceivedByUserId: value }
}

function buildReceiptMetadata(input: Record<string, any>): Record<string, unknown> {
  const base =
    input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata)
      ? { ...input.metadata }
      : {}
  const financialKeys = [
    'item_total',
    'charges_total',
    'tax_total',
    'grn_total_with_charges_taxes',
    'financial_breakdown',
    'has_excluded_source_items',
  ] as const
  for (const key of financialKeys) {
    if (input[key] !== undefined) base[key] = input[key]
  }
  return base
}

function mapReceiptNoteRow(row: any): any {
  const metadata = parseJson<Record<string, unknown>>(row.metadata, {})
  const record: Record<string, unknown> = {
    id: String(row.id),
    uuid: row.uuid,
    corporation_uuid: row.corporation_uuid,
    project_uuid: row.project_uuid ?? null,
    purchase_order_uuid: row.purchase_order_uuid ?? null,
    change_order_uuid: row.change_order_uuid ?? null,
    receipt_type: row.receipt_type ?? null,
    vendor_uuid: row.vendor_uuid ?? null,
    entry_date: toLocalDate(row.entry_date),
    received_date: toLocalDate(row.received_date),
    shipment_date: toLocalDate(row.shipment_date),
    grn_number: row.grn_number,
    reference_number: row.reference_number ?? null,
    received_by: row.received_by ?? null,
    nimble_received_by_user_id: row.nimble_received_by_user_id ?? null,
    location_uuid: row.location_uuid ?? null,
    notes: row.notes ?? null,
    status: row.status,
    total_received_amount: toNum(row.total_received_amount),
    attachments: parseJson(row.attachments, []),
    metadata,
    audit_log: parseJson(row.audit_log, []),
    is_active: row.is_active,
    created_at: row.created_at?.toISOString?.() ?? row.created_at ?? null,
    updated_at: row.updated_at?.toISOString?.() ?? row.updated_at ?? null,
  }
  for (const key of ['item_total', 'charges_total', 'tax_total', 'grn_total_with_charges_taxes', 'financial_breakdown'] as const) {
    if (metadata[key] !== undefined) record[key] = metadata[key]
  }
  return record
}

function mapReceiptNoteItem(row: any): any {
  return {
    id: String(row.id),
    uuid: row.uuid,
    corporation_uuid: row.corporation_uuid ?? null,
    project_uuid: row.project_uuid ?? null,
    receipt_note_uuid: row.receipt_note_uuid,
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
    received_quantity: toNum(row.received_quantity),
    received_total: toNum(row.received_total),
    grn_total: toNum(row.grn_total),
    grn_total_with_charges_taxes: toNum(row.grn_total_with_charges_taxes),
    unit_price: toNum(row.unit_price),
    total: toNum(row.total),
    po_item_uuid: row.po_item_uuid ?? null,
    metadata: parseJson(row.metadata, {}),
    is_active: row.is_active,
  }
}

export async function generateNextGrnNumber(corporationUuid: string): Promise<string> {
  const rows = await prisma.stockReceiptNote.findMany({
    where: { corporation_uuid: corporationUuid, is_active: true },
    select: { grn_number: true },
  })
  let maxNum = 0
  for (const row of rows) {
    const num = parseInt(String(row.grn_number || '').replace(/^GRN-/i, ''), 10)
    if (!isNaN(num)) maxNum = Math.max(maxNum, num)
  }
  return `GRN-${maxNum + 1}`
}

async function ensureUniqueGrnNumber(corporationUuid: string, requested?: string | null): Promise<string> {
  const trimmed = String(requested || '').trim()
  if (trimmed) {
    const exists = await prisma.stockReceiptNote.findFirst({
      where: { corporation_uuid: corporationUuid, grn_number: trimmed, is_active: true },
    })
    if (!exists) return trimmed
  }
  return generateNextGrnNumber(corporationUuid)
}

function resolveSourceUuids(body: Record<string, any>, receiptType: 'purchase_order' | 'change_order') {
  const purchaseOrderUuid =
    receiptType === 'purchase_order' ? (body.purchase_order_uuid || null) : null
  const changeOrderUuid =
    receiptType === 'change_order'
      ? (body.change_order_uuid || body.purchase_order_uuid || null)
      : null
  return { purchaseOrderUuid, changeOrderUuid }
}

async function persistReceiptItems(
  body: Record<string, any>,
  noteUuid: string,
  receiptType: 'purchase_order' | 'change_order',
  purchaseOrderUuid: string | null,
  changeOrderUuid: string | null,
) {
  const items = body.receipt_items
  if (!Array.isArray(items) || items.length === 0) return

  const sourceUuid = purchaseOrderUuid || changeOrderUuid
  const linePayload = {
    receipt_note_uuid: noteUuid,
    corporation_uuid: body.corporation_uuid,
    project_uuid: body.project_uuid || null,
    purchase_order_uuid: receiptType === 'purchase_order' ? sourceUuid : null,
    change_order_uuid: receiptType === 'change_order' ? sourceUuid : null,
    items: items.map((item: any) => ({
      uuid: item.uuid || item.base_item_uuid || item.id,
      cost_code_uuid: item.cost_code_uuid,
      received_quantity: item.received_quantity,
      unit_price: item.unit_price,
      grn_total: item.grn_total,
      grn_total_with_charges_taxes: item.grn_total_with_charges_taxes,
    })),
  }

  if (receiptType === 'change_order') {
    await applyChangeOrderReceiptFieldsUpdate(linePayload)
  } else {
    await applyPurchaseOrderReceiptFieldsUpdate(linePayload)
  }
}

async function updateSourceOrderStatusOnSave(body: Record<string, any>, receiptType: 'purchase_order' | 'change_order', purchaseOrderUuid: string | null, changeOrderUuid: string | null) {
  if (body.save_as_open_po !== true) return

  const status = 'Partially_Received'
  if (receiptType === 'purchase_order' && purchaseOrderUuid) {
    await prisma.purchaseOrderForm.update({
      where: { uuid: purchaseOrderUuid },
      data: { status },
    }).catch((e) => console.error('[StockReceiptNotes] PO status update failed', e))
  }
  if (receiptType === 'change_order' && changeOrderUuid) {
    await prisma.changeOrder.update({
      where: { uuid: changeOrderUuid },
      data: { status },
    }).catch((e) => console.error('[StockReceiptNotes] CO status update failed', e))
  }
}

async function maybeMarkSourceOrderCompleted(
  body: Record<string, any>,
  receiptType: 'purchase_order' | 'change_order',
  purchaseOrderUuid: string | null,
  changeOrderUuid: string | null,
) {
  if (body.save_as_open_po === true || body.has_excluded_source_items === true) return

  if (receiptType === 'purchase_order' && purchaseOrderUuid) {
    const poItems = await prisma.purchaseOrderItem.findMany({
      where: { purchase_order_uuid: purchaseOrderUuid, is_active: true },
      select: { uuid: true, po_quantity: true },
    })
    if (!poItems.length) return

    const receiptLines = await prisma.receiptNoteItem.findMany({
      where: { purchase_order_uuid: purchaseOrderUuid, is_active: true },
      select: { item_uuid: true, received_quantity: true, receipt_note_uuid: true },
    })
    const activeNotes = new Set(
      (
        await prisma.stockReceiptNote.findMany({
          where: { purchase_order_uuid: purchaseOrderUuid, is_active: true },
          select: { uuid: true },
        })
      ).map((n) => n.uuid),
    )

    const returnLines = await prisma.returnNoteItem.findMany({
      where: { purchase_order_uuid: purchaseOrderUuid, is_active: true },
      select: { item_uuid: true, return_quantity: true },
    }).catch(() => [])

    const receivedMap = new Map<string, number>()
    const returnedMap = new Map<string, number>()

    for (const line of receiptLines) {
      if (!line.item_uuid || !activeNotes.has(line.receipt_note_uuid)) continue
      const key = String(line.item_uuid).toLowerCase()
      receivedMap.set(key, (receivedMap.get(key) || 0) + (toNum(line.received_quantity) || 0))
    }
    for (const line of returnLines) {
      if (!line.item_uuid) continue
      const key = String(line.item_uuid).toLowerCase()
      returnedMap.set(key, (returnedMap.get(key) || 0) + (toNum(line.return_quantity) || 0))
    }

    let totalOrdered = 0
    let totalFulfilled = 0
    for (const poItem of poItems) {
      const key = String(poItem.uuid).toLowerCase()
      const ordered = toNum(poItem.po_quantity) || 0
      totalOrdered += ordered
      totalFulfilled += (receivedMap.get(key) || 0) + (returnedMap.get(key) || 0)
    }

    if (totalOrdered > 0 && totalFulfilled >= totalOrdered) {
      await prisma.purchaseOrderForm.update({
        where: { uuid: purchaseOrderUuid },
        data: { status: 'Completed' },
      }).catch((e) => console.error('[StockReceiptNotes] PO completion update failed', e))
    }
  }

  if (receiptType === 'change_order' && changeOrderUuid) {
    const coItems = await prisma.changeOrderItem.findMany({
      where: { change_order_uuid: changeOrderUuid, is_active: true },
      select: { uuid: true, co_quantity: true },
    })
    if (!coItems.length) return

    const receiptLines = await prisma.receiptNoteItem.findMany({
      where: { change_order_uuid: changeOrderUuid, is_active: true },
      select: { item_uuid: true, received_quantity: true, receipt_note_uuid: true },
    })

    const activeNotes = new Set(
      (
        await prisma.stockReceiptNote.findMany({
          where: { change_order_uuid: changeOrderUuid, is_active: true },
          select: { uuid: true },
        })
      ).map((n) => n.uuid),
    )

    const receivedMap = new Map<string, number>()
    for (const line of receiptLines) {
      if (!line.item_uuid || !activeNotes.has(line.receipt_note_uuid)) continue
      const key = String(line.item_uuid).toLowerCase()
      receivedMap.set(key, (receivedMap.get(key) || 0) + (toNum(line.received_quantity) || 0))
    }

    let totalOrdered = 0
    let totalReceived = 0
    for (const coItem of coItems) {
      const key = String(coItem.uuid).toLowerCase()
      totalOrdered += toNum(coItem.co_quantity) || 0
      totalReceived += receivedMap.get(key) || 0
    }

    if (totalOrdered > 0 && totalReceived >= totalOrdered) {
      await prisma.changeOrder.update({
        where: { uuid: changeOrderUuid },
        data: { status: 'Completed' },
      }).catch((e) => console.error('[StockReceiptNotes] CO completion update failed', e))
    }
  }
}

function buildHeaderData(body: Record<string, any>, noteUuid: string, grnNumber: string) {
  const receiptType = normalizeReceiptType(body.receipt_type)
  const { purchaseOrderUuid, changeOrderUuid } = resolveSourceUuids(body, receiptType)
  const receivedBy = normalizeReceivedByFields(body.received_by)

  return {
    uuid: noteUuid,
    corporation_uuid: body.corporation_uuid,
    project_uuid: body.project_uuid ?? null,
    purchase_order_uuid: purchaseOrderUuid,
    change_order_uuid: changeOrderUuid,
    receipt_type: receiptType,
    vendor_uuid: body.vendor_uuid ?? null,
    entry_date: parseDate(body.entry_date),
    received_date: parseDate(body.received_date),
    shipment_date: parseDate(body.shipment_date),
    grn_number: grnNumber,
    reference_number: body.reference_number ?? null,
    received_by: receivedBy.receivedBy,
    nimble_received_by_user_id: body.nimble_received_by_user_id ?? receivedBy.nimbleReceivedByUserId,
    location_uuid: body.location_uuid ?? null,
    notes: body.notes ?? null,
    status: normalizeStatus(body.status),
    total_received_amount: toNum(body.total_received_amount),
    attachments: stringifyJson(sanitizeAttachments(body.attachments ?? [])),
    metadata: stringifyJson(buildReceiptMetadata(body)),
    audit_log: stringifyJson(body.audit_log ?? []),
    is_active: typeof body.is_active === 'boolean' ? body.is_active : true,
  }
}

export async function listStockReceiptNotes(
  corporationUuid: string,
  options: {
    projectUuid?: string
    vendorUuid?: string
    purchaseOrderUuid?: string
    changeOrderUuid?: string
    entryDateFrom?: string
    entryDateTo?: string
  } = {},
) {
  const where: any = { corporation_uuid: corporationUuid, is_active: true }
  if (options.projectUuid) where.project_uuid = options.projectUuid
  if (options.vendorUuid) where.vendor_uuid = options.vendorUuid
  if (options.purchaseOrderUuid) where.purchase_order_uuid = options.purchaseOrderUuid
  if (options.changeOrderUuid) where.change_order_uuid = options.changeOrderUuid
  if (options.entryDateFrom || options.entryDateTo) {
    where.entry_date = {}
    if (options.entryDateFrom) where.entry_date.gte = parseDate(options.entryDateFrom)
    if (options.entryDateTo) where.entry_date.lte = parseDateEndOfDay(options.entryDateTo)
  }

  const rows = await prisma.stockReceiptNote.findMany({ where, orderBy: { entry_date: 'desc' } })
  return rows.map(mapReceiptNoteRow)
}

export async function getStockReceiptNote(uuid: string) {
  const row = await prisma.stockReceiptNote.findFirst({ where: { uuid, is_active: true } })
  if (!row) return null
  return mapReceiptNoteRow(row)
}

export async function createStockReceiptNote(input: Record<string, any>) {
  const noteUuid = input.uuid && typeof input.uuid === 'string' ? input.uuid : randomUUID()
  const grnNumber = await ensureUniqueGrnNumber(input.corporation_uuid, input.grn_number)
  const data = buildHeaderData(input, noteUuid, grnNumber)
  const receiptType = normalizeReceiptType(data.receipt_type)

  const row = await prisma.stockReceiptNote.create({ data })
  const { purchaseOrderUuid, changeOrderUuid } = resolveSourceUuids(input, receiptType)

  await persistReceiptItems(input, noteUuid, receiptType, purchaseOrderUuid, changeOrderUuid)
  await updateSourceOrderStatusOnSave(input, receiptType, purchaseOrderUuid, changeOrderUuid)
  await maybeMarkSourceOrderCompleted(input, receiptType, purchaseOrderUuid, changeOrderUuid)

  return mapReceiptNoteRow(row)
}

export async function updateStockReceiptNote(uuid: string, input: Record<string, any>) {
  const existing = await prisma.stockReceiptNote.findFirst({ where: { uuid, is_active: true } })
  if (!existing) return null

  const receiptType = normalizeReceiptType(
    input.receipt_type ?? existing.receipt_type ?? 'purchase_order',
  )
  let purchaseOrderUuid = existing.purchase_order_uuid
  let changeOrderUuid = existing.change_order_uuid
  if (
    'receipt_type' in input ||
    'purchase_order_uuid' in input ||
    'change_order_uuid' in input
  ) {
    const resolved = resolveSourceUuids(
      {
        purchase_order_uuid: existing.purchase_order_uuid,
        change_order_uuid: existing.change_order_uuid,
        ...input,
        receipt_type: receiptType,
      },
      receiptType,
    )
    purchaseOrderUuid = resolved.purchaseOrderUuid
    changeOrderUuid = resolved.changeOrderUuid
  }
  const receivedBy = normalizeReceivedByFields(
    input.received_by !== undefined ? input.received_by : existing.received_by,
  )

  const grnNumber =
    input.grn_number !== undefined
      ? await ensureUniqueGrnNumber(existing.corporation_uuid, input.grn_number)
      : existing.grn_number

  const updateData: Record<string, unknown> = {
    project_uuid: input.project_uuid !== undefined ? (input.project_uuid ?? null) : undefined,
    purchase_order_uuid: purchaseOrderUuid,
    change_order_uuid: changeOrderUuid,
    receipt_type: receiptType,
    vendor_uuid: input.vendor_uuid !== undefined ? (input.vendor_uuid ?? null) : undefined,
    grn_number: grnNumber,
    reference_number: input.reference_number !== undefined ? (input.reference_number ?? null) : undefined,
    received_by: input.received_by !== undefined ? receivedBy.receivedBy : undefined,
    nimble_received_by_user_id:
      input.nimble_received_by_user_id !== undefined
        ? input.nimble_received_by_user_id
        : input.received_by !== undefined
          ? receivedBy.nimbleReceivedByUserId
          : undefined,
    location_uuid: input.location_uuid !== undefined ? (input.location_uuid ?? null) : undefined,
    notes: input.notes !== undefined ? (input.notes ?? null) : undefined,
    status: input.status !== undefined ? normalizeStatus(input.status) : undefined,
    total_received_amount:
      input.total_received_amount !== undefined ? toNum(input.total_received_amount) : undefined,
  }

  if ('entry_date' in input) updateData.entry_date = parseDate(input.entry_date)
  if ('received_date' in input) updateData.received_date = parseDate(input.received_date)
  if ('shipment_date' in input) updateData.shipment_date = parseDate(input.shipment_date)
  if ('attachments' in input) {
    updateData.attachments = stringifyJson(sanitizeAttachments(input.attachments ?? []))
  }
  if (
    'metadata' in input ||
    'financial_breakdown' in input ||
    'item_total' in input ||
    'grn_total_with_charges_taxes' in input
  ) {
    const merged = {
      ...parseJson(existing.metadata, {}),
      ...buildReceiptMetadata({ ...parseJson(existing.metadata, {}), ...input }),
    }
    updateData.metadata = stringifyJson(merged)
  }
  if ('audit_log' in input) updateData.audit_log = stringifyJson(input.audit_log)

  const cleaned = Object.fromEntries(
    Object.entries(updateData).filter(([, v]) => v !== undefined),
  )

  const row = await prisma.stockReceiptNote.update({ where: { uuid }, data: cleaned })

  await persistReceiptItems(
    { ...input, corporation_uuid: input.corporation_uuid || existing.corporation_uuid },
    uuid,
    receiptType,
    purchaseOrderUuid,
    changeOrderUuid,
  )
  await updateSourceOrderStatusOnSave(input, receiptType, purchaseOrderUuid, changeOrderUuid)
  await maybeMarkSourceOrderCompleted(input, receiptType, purchaseOrderUuid, changeOrderUuid)

  return mapReceiptNoteRow(row)
}

export async function deleteStockReceiptNote(uuid: string) {
  const row = await prisma.stockReceiptNote.findFirst({ where: { uuid, is_active: true } })
  if (!row) return null

  await prisma.receiptNoteItem.updateMany({
    where: { receipt_note_uuid: uuid },
    data: { is_active: false },
  })
  await prisma.stockReceiptNote.update({ where: { uuid }, data: { is_active: false } })
  return mapReceiptNoteRow({ ...row, is_active: false })
}

export async function getReceiptNoteItems(receiptNoteUuid: string) {
  const rows = await prisma.receiptNoteItem.findMany({
    where: { receipt_note_uuid: receiptNoteUuid, is_active: true },
    orderBy: { id: 'asc' },
  })
  return rows.map(mapReceiptNoteItem)
}

export async function replaceReceiptNoteItems(
  receiptNoteUuid: string,
  corporationUuid: string | null,
  projectUuid: string | null,
  items: any[],
) {
  await prisma.receiptNoteItem.deleteMany({ where: { receipt_note_uuid: receiptNoteUuid } })
  if (!items.length) return []

  const rows = items.map((item) => ({
    corporation_uuid: corporationUuid,
    project_uuid: projectUuid,
    receipt_note_uuid: receiptNoteUuid,
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
    received_quantity: toNum(item?.received_quantity),
    received_total: toNum(item?.received_total),
    grn_total: toNum(item?.grn_total),
    grn_total_with_charges_taxes: toNum(item?.grn_total_with_charges_taxes),
    unit_price: toNum(item?.unit_price),
    total: toNum(item?.total ?? item?.grn_total_with_charges_taxes ?? item?.grn_total),
    po_item_uuid: item?.po_item_uuid ?? null,
    metadata: stringifyJson(item?.metadata ?? {}),
    is_active: true,
  }))

  await prisma.receiptNoteItem.createMany({ data: rows })
  return getReceiptNoteItems(receiptNoteUuid)
}
