import { randomUUID } from 'node:crypto'
import { getPrisma } from './prisma'
import { sanitizeAttachments } from './financialBreakdown'
import {
  attachmentsJsonFromRows,
  auditLogJsonFromRows,
  resolveFinancialBreakdown,
} from './normalizedChildren'
import {
  replaceReturnAttachments,
  replaceReturnAuditEvents,
  replaceReturnFinancialChildren,
} from './replaceNormalizedChildren'

const prisma = getPrisma()
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** List: keep metadata but skip heavy attachments / audit_log blobs. */
const RETURN_LIST_SELECT = {
  id: true,
  uuid: true,
  corporation_uuid: true,
  project_uuid: true,
  purchase_order_uuid: true,
  change_order_uuid: true,
  return_type: true,
  vendor_uuid: true,
  entry_date: true,
  return_note_number: true,
  reference_number: true,
  returned_by: true,
  nimble_returned_by_user_id: true,
  location_uuid: true,
  notes: true,
  status: true,
  total_return_amount: true,
  metadata: true,
  is_active: true,
  created_at: true,
  updated_at: true,
} as const

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

function normalizeStatus(status?: string | null): 'Waiting' | 'Returned' {
  const s = String(status || '').trim().toLowerCase()
  return s === 'returned' ? 'Returned' : 'Waiting'
}

function normalizeReturnType(val: unknown): 'purchase_order' | 'change_order' {
  return String(val || '').trim() === 'change_order' ? 'change_order' : 'purchase_order'
}

function normalizeReturnedByFields(rawValue: unknown) {
  if (rawValue === null || rawValue === undefined) {
    return { returnedBy: null as string | null, nimbleReturnedByUserId: null as string | null }
  }
  const value = String(rawValue).trim()
  if (!value) return { returnedBy: null, nimbleReturnedByUserId: null }
  if (UUID_REGEX.test(value)) {
    return { returnedBy: value, nimbleReturnedByUserId: null }
  }
  return { returnedBy: null, nimbleReturnedByUserId: value }
}

function buildReturnMetadata(input: Record<string, any>): Record<string, unknown> {
  const base =
    input.metadata && typeof input.metadata === 'object' && !Array.isArray(input.metadata)
      ? { ...input.metadata }
      : {}
  if (input.financial_breakdown !== undefined) {
    base.financial_breakdown = input.financial_breakdown
  }
  return base
}

function mapReturnNoteRow(row: any, extras?: {
  financialBreakdown?: any
  attachments?: any[]
  audit_log?: any[]
}): any {
  const metadata = parseJson<Record<string, unknown>>(row.metadata, {})
  const financialBreakdown =
    extras?.financialBreakdown !== undefined
      ? extras.financialBreakdown
      : metadata.financial_breakdown
  const returnNoteNumber = row.return_note_number
  const record: Record<string, unknown> = {
    id: String(row.id),
    uuid: row.uuid,
    corporation_uuid: row.corporation_uuid,
    project_uuid: row.project_uuid ?? null,
    purchase_order_uuid: row.purchase_order_uuid ?? null,
    change_order_uuid: row.change_order_uuid ?? null,
    return_type: row.return_type ?? null,
    vendor_uuid: row.vendor_uuid ?? null,
    entry_date: toLocalDate(row.entry_date),
    return_note_number: returnNoteNumber,
    return_number: returnNoteNumber,
    reference_number: row.reference_number ?? null,
    returned_by: row.returned_by ?? null,
    nimble_returned_by_user_id: row.nimble_returned_by_user_id ?? null,
    location_uuid: row.location_uuid ?? null,
    notes: row.notes ?? null,
    status: row.status,
    total_return_amount: toNum(row.total_return_amount),
    attachments: extras?.attachments ?? parseJson(row.attachments, []),
    metadata: {
      ...metadata,
      ...(financialBreakdown !== undefined ? { financial_breakdown: financialBreakdown } : {}),
    },
    audit_log: extras?.audit_log ?? parseJson(row.audit_log, []),
    is_active: row.is_active,
    created_at: row.created_at?.toISOString?.() ?? row.created_at ?? null,
    updated_at: row.updated_at?.toISOString?.() ?? row.updated_at ?? null,
  }
  if (financialBreakdown !== undefined) {
    record.financial_breakdown = financialBreakdown
  }
  return record
}

async function loadReturnNormalizedExtras(uuid: string, row: any) {
  const [chargeRows, taxRows, attachmentRows, auditRows] = await Promise.all([
    prisma.returnFinancialCharge.findMany({ where: { return_note_uuid: uuid } }),
    prisma.returnFinancialTax.findMany({ where: { return_note_uuid: uuid } }),
    prisma.returnAttachment.findMany({
      where: { return_note_uuid: uuid },
      orderBy: { sort_order: 'asc' },
    }),
    prisma.returnAuditEvent.findMany({
      where: { return_note_uuid: uuid },
      orderBy: { event_at: 'asc' },
    }),
  ])

  const metadata = parseJson<Record<string, unknown>>(row.metadata, {})
  const financialBreakdown = resolveFinancialBreakdown({
    chargeRows,
    taxRows,
    legacyJson: metadata.financial_breakdown ?? null,
    headerTotals: {
      item_total: (metadata.financial_breakdown as any)?.totals?.item_total,
      charges_total: (metadata.financial_breakdown as any)?.totals?.charges_total,
      tax_total: (metadata.financial_breakdown as any)?.totals?.tax_total,
    },
  })

  const attachments = attachmentRows.length
    ? attachmentsJsonFromRows(attachmentRows)
    : parseJson(row.attachments, [])

  const audit_log = auditRows.length
    ? auditLogJsonFromRows(auditRows)
    : parseJson(row.audit_log, [])

  return { financialBreakdown, attachments, audit_log }
}

function financialInputFromReturnBody(body: Record<string, any>, metadata?: Record<string, unknown>) {
  const meta = metadata ?? buildReturnMetadata(body)
  return {
    ...body,
    ...meta,
    financial_breakdown: body.financial_breakdown ?? meta.financial_breakdown,
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
    return_total: toNum(row.total),
    unit_price: toNum(row.unit_price),
    total: toNum(row.total),
    po_item_uuid: row.po_item_uuid ?? null,
    receipt_note_uuid: row.receipt_note_uuid ?? null,
    metadata: parseJson(row.metadata, {}),
    is_active: row.is_active,
  }
}

export async function generateNextReturnNumber(corporationUuid: string): Promise<string> {
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

async function ensureUniqueReturnNumber(
  corporationUuid: string,
  requested?: string | null,
): Promise<string> {
  const trimmed = String(requested || '').trim()
  if (trimmed) {
    const exists = await prisma.stockReturnNote.findFirst({
      where: { corporation_uuid: corporationUuid, return_note_number: trimmed, is_active: true },
    })
    if (!exists) return trimmed
  }
  return generateNextReturnNumber(corporationUuid)
}

function resolveSourceUuids(body: Record<string, any>, returnType: 'purchase_order' | 'change_order') {
  const purchaseOrderUuid =
    returnType === 'purchase_order' ? (body.purchase_order_uuid || null) : null
  const changeOrderUuid =
    returnType === 'change_order'
      ? (body.change_order_uuid || body.purchase_order_uuid || null)
      : null
  return { purchaseOrderUuid, changeOrderUuid }
}

function filterReturnItems(items: unknown): any[] {
  if (!Array.isArray(items)) return []
  return items.filter((item: any) => {
    const hasUuid = !!(item?.item_uuid || item?.base_item_uuid || item?.uuid)
    const hasReturnQuantity =
      item?.return_quantity !== null &&
      item?.return_quantity !== undefined &&
      String(item.return_quantity).trim() !== ''
    return hasUuid && hasReturnQuantity
  })
}

async function maybeMarkSourceOrderCompleted(
  returnType: 'purchase_order' | 'change_order',
  purchaseOrderUuid: string | null,
  changeOrderUuid: string | null,
) {
  if (returnType === 'purchase_order' && purchaseOrderUuid) {
    const poItems = await prisma.purchaseOrderItem.findMany({
      where: { purchase_order_uuid: purchaseOrderUuid, is_active: true },
      select: { uuid: true, po_quantity: true },
    })
    if (!poItems.length) return

    const receiptLines = await prisma.receiptNoteItem.findMany({
      where: { purchase_order_uuid: purchaseOrderUuid, is_active: true },
      select: { item_uuid: true, received_quantity: true, receipt_note_uuid: true },
    })
    const activeReceiptNotes = new Set(
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
    })

    const receivedMap = new Map<string, number>()
    const returnedMap = new Map<string, number>()

    for (const line of receiptLines) {
      if (!line.item_uuid || !activeReceiptNotes.has(line.receipt_note_uuid)) continue
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
      totalOrdered += toNum(poItem.po_quantity) || 0
      totalFulfilled += (receivedMap.get(key) || 0) + (returnedMap.get(key) || 0)
    }

    if (totalOrdered > 0 && totalFulfilled >= totalOrdered) {
      await prisma.purchaseOrderForm.update({
        where: { uuid: purchaseOrderUuid },
        data: { status: 'Completed' },
      }).catch((e) => console.error('[StockReturnNotes] PO completion update failed', e))
    }
  }

  if (returnType === 'change_order' && changeOrderUuid) {
    const coItems = await prisma.changeOrderItem.findMany({
      where: { change_order_uuid: changeOrderUuid, is_active: true, is_removed: false },
      select: { uuid: true, co_quantity: true },
    })
    if (!coItems.length) return

    const receiptLines = await prisma.receiptNoteItem.findMany({
      where: { change_order_uuid: changeOrderUuid, is_active: true },
      select: { item_uuid: true, received_quantity: true, receipt_note_uuid: true },
    })
    const activeReceiptNotes = new Set(
      (
        await prisma.stockReceiptNote.findMany({
          where: { change_order_uuid: changeOrderUuid, is_active: true },
          select: { uuid: true },
        })
      ).map((n) => n.uuid),
    )

    const returnLines = await prisma.returnNoteItem.findMany({
      where: { change_order_uuid: changeOrderUuid, is_active: true },
      select: { item_uuid: true, return_quantity: true },
    })

    const receivedMap = new Map<string, number>()
    const returnedMap = new Map<string, number>()

    for (const line of receiptLines) {
      if (!line.item_uuid || !activeReceiptNotes.has(line.receipt_note_uuid)) continue
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
    for (const coItem of coItems) {
      const key = String(coItem.uuid).toLowerCase()
      totalOrdered += toNum(coItem.co_quantity) || 0
      totalFulfilled += (receivedMap.get(key) || 0) + (returnedMap.get(key) || 0)
    }

    if (totalOrdered > 0 && totalFulfilled >= totalOrdered) {
      await prisma.changeOrder.update({
        where: { uuid: changeOrderUuid },
        data: { status: 'Completed' },
      }).catch((e) => console.error('[StockReturnNotes] CO completion update failed', e))
    }
  }
}

function buildHeaderData(body: Record<string, any>, noteUuid: string, returnNumber: string) {
  const returnType = normalizeReturnType(body.return_type)
  const { purchaseOrderUuid, changeOrderUuid } = resolveSourceUuids(body, returnType)
  const returnedBy = normalizeReturnedByFields(body.returned_by)

  return {
    uuid: noteUuid,
    corporation_uuid: body.corporation_uuid,
    project_uuid: body.project_uuid ?? null,
    purchase_order_uuid: purchaseOrderUuid,
    change_order_uuid: changeOrderUuid,
    return_type: returnType,
    vendor_uuid: body.vendor_uuid ?? null,
    entry_date: parseDate(body.entry_date),
    return_note_number: returnNumber,
    reference_number: body.reference_number ?? null,
    returned_by: returnedBy.returnedBy,
    nimble_returned_by_user_id:
      body.nimble_returned_by_user_id ?? returnedBy.nimbleReturnedByUserId,
    location_uuid: body.location_uuid ?? null,
    notes: body.notes ?? null,
    status: normalizeStatus(body.status),
    total_return_amount: toNum(body.total_return_amount),
    attachments: stringifyJson(sanitizeAttachments(body.attachments ?? [])),
    metadata: stringifyJson(buildReturnMetadata(body)),
    audit_log: stringifyJson(body.audit_log ?? []),
    is_active: typeof body.is_active === 'boolean' ? body.is_active : true,
  }
}

export async function listStockReturnNotes(
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

  const rows = await prisma.stockReturnNote.findMany({
    where,
    select: RETURN_LIST_SELECT,
    orderBy: { entry_date: 'desc' },
  })
  return rows.map((r) => mapReturnNoteRow(r, { attachments: [], audit_log: [] }))
}

export async function getStockReturnNote(uuid: string) {
  const row = await prisma.stockReturnNote.findFirst({ where: { uuid, is_active: true } })
  if (!row) return null
  const extras = await loadReturnNormalizedExtras(uuid, row)
  return mapReturnNoteRow(row, extras)
}

export async function createStockReturnNote(input: Record<string, any>) {
  const noteUuid = input.uuid && typeof input.uuid === 'string' ? input.uuid : randomUUID()
  const requestedNumber = input.return_number ?? input.return_note_number
  const returnNumber = await ensureUniqueReturnNumber(input.corporation_uuid, requestedNumber)
  const data = buildHeaderData(input, noteUuid, returnNumber)
  const returnType = normalizeReturnType(data.return_type)

  const row = await prisma.stockReturnNote.create({ data })
  const { purchaseOrderUuid, changeOrderUuid } = resolveSourceUuids(input, returnType)

  const financialInput = financialInputFromReturnBody(input)
  await Promise.all([
    replaceReturnFinancialChildren(prisma, noteUuid, row.corporation_uuid, financialInput),
    replaceReturnAttachments(
      prisma,
      noteUuid,
      row.corporation_uuid,
      sanitizeAttachments(input.attachments ?? []),
    ),
    replaceReturnAuditEvents(prisma, noteUuid, row.corporation_uuid, input.audit_log ?? []),
  ])

  const items = filterReturnItems(input.return_items)
  if (items.length > 0) {
    await replaceReturnNoteItems(
      noteUuid,
      input.corporation_uuid,
      input.project_uuid ?? null,
      items.map((item: any) => ({
        ...item,
        purchase_order_uuid: returnType === 'purchase_order' ? purchaseOrderUuid : null,
        change_order_uuid: returnType === 'change_order' ? changeOrderUuid : null,
        item_type: returnType,
      })),
    )
  }

  await maybeMarkSourceOrderCompleted(returnType, purchaseOrderUuid, changeOrderUuid)
  return getStockReturnNote(noteUuid)
}

export async function updateStockReturnNote(uuid: string, input: Record<string, any>) {
  const existing = await prisma.stockReturnNote.findFirst({ where: { uuid, is_active: true } })
  if (!existing) return null

  const returnType = normalizeReturnType(
    input.return_type ?? existing.return_type ?? 'purchase_order',
  )
  let purchaseOrderUuid = existing.purchase_order_uuid
  let changeOrderUuid = existing.change_order_uuid
  if (
    'return_type' in input ||
    'purchase_order_uuid' in input ||
    'change_order_uuid' in input
  ) {
    const resolved = resolveSourceUuids(
      {
        purchase_order_uuid: existing.purchase_order_uuid,
        change_order_uuid: existing.change_order_uuid,
        ...input,
        return_type: returnType,
      },
      returnType,
    )
    purchaseOrderUuid = resolved.purchaseOrderUuid
    changeOrderUuid = resolved.changeOrderUuid
  }

  const returnedBy = normalizeReturnedByFields(
    input.returned_by !== undefined ? input.returned_by : existing.returned_by,
  )

  const returnNumber =
    input.return_number !== undefined || input.return_note_number !== undefined
      ? await ensureUniqueReturnNumber(
          existing.corporation_uuid,
          input.return_number ?? input.return_note_number,
        )
      : existing.return_note_number

  const updateData: Record<string, unknown> = {
    project_uuid: input.project_uuid !== undefined ? (input.project_uuid ?? null) : undefined,
    purchase_order_uuid: purchaseOrderUuid,
    change_order_uuid: changeOrderUuid,
    return_type: returnType,
    vendor_uuid: input.vendor_uuid !== undefined ? (input.vendor_uuid ?? null) : undefined,
    return_note_number: returnNumber,
    reference_number: input.reference_number !== undefined ? (input.reference_number ?? null) : undefined,
    returned_by: input.returned_by !== undefined ? returnedBy.returnedBy : undefined,
    nimble_returned_by_user_id:
      input.nimble_returned_by_user_id !== undefined
        ? input.nimble_returned_by_user_id
        : input.returned_by !== undefined
          ? returnedBy.nimbleReturnedByUserId
          : undefined,
    location_uuid: input.location_uuid !== undefined ? (input.location_uuid ?? null) : undefined,
    notes: input.notes !== undefined ? (input.notes ?? null) : undefined,
    status: input.status !== undefined ? normalizeStatus(input.status) : undefined,
    total_return_amount:
      input.total_return_amount !== undefined ? toNum(input.total_return_amount) : undefined,
  }

  if ('entry_date' in input) updateData.entry_date = parseDate(input.entry_date)
  if ('attachments' in input) {
    updateData.attachments = stringifyJson(sanitizeAttachments(input.attachments ?? []))
  }
  let mergedMetadata: Record<string, unknown> | null = null
  if ('metadata' in input || 'financial_breakdown' in input) {
    mergedMetadata = {
      ...parseJson(existing.metadata, {}),
      ...buildReturnMetadata({ ...parseJson(existing.metadata, {}), ...input }),
    }
    updateData.metadata = stringifyJson(mergedMetadata)
  }
  if ('audit_log' in input) updateData.audit_log = stringifyJson(input.audit_log)

  const cleaned = Object.fromEntries(
    Object.entries(updateData).filter(([, v]) => v !== undefined),
  )

  await prisma.stockReturnNote.update({ where: { uuid }, data: cleaned })

  const dualWrites: Promise<unknown>[] = []
  if (mergedMetadata || 'financial_breakdown' in input) {
    dualWrites.push(
      replaceReturnFinancialChildren(
        prisma,
        uuid,
        existing.corporation_uuid,
        financialInputFromReturnBody(input, mergedMetadata ?? parseJson(existing.metadata, {})),
      ),
    )
  }
  if ('attachments' in input) {
    dualWrites.push(
      replaceReturnAttachments(
        prisma,
        uuid,
        existing.corporation_uuid,
        sanitizeAttachments(input.attachments ?? []),
      ),
    )
  }
  if ('audit_log' in input) {
    dualWrites.push(
      replaceReturnAuditEvents(prisma, uuid, existing.corporation_uuid, input.audit_log ?? []),
    )
  }
  if (dualWrites.length) await Promise.all(dualWrites)

  if ('return_items' in input) {
    const items = filterReturnItems(input.return_items)
    await replaceReturnNoteItems(
      uuid,
      input.corporation_uuid || existing.corporation_uuid,
      input.project_uuid ?? existing.project_uuid ?? null,
      items.map((item: any) => ({
        ...item,
        purchase_order_uuid: returnType === 'purchase_order' ? purchaseOrderUuid : null,
        change_order_uuid: returnType === 'change_order' ? changeOrderUuid : null,
        item_type: returnType,
      })),
    )
  }

  await maybeMarkSourceOrderCompleted(returnType, purchaseOrderUuid, changeOrderUuid)
  return getStockReturnNote(uuid)
}

export async function deleteStockReturnNote(uuid: string) {
  const row = await prisma.stockReturnNote.findFirst({ where: { uuid, is_active: true } })
  if (!row) return null

  await prisma.returnNoteItem.updateMany({
    where: { return_note_uuid: uuid },
    data: { is_active: false },
  })
  await prisma.stockReturnNote.update({ where: { uuid }, data: { is_active: false } })
  return mapReturnNoteRow({ ...row, is_active: false })
}

export async function getReturnNoteItems(returnNoteUuid: string) {
  const rows = await prisma.returnNoteItem.findMany({
    where: { return_note_uuid: returnNoteUuid, is_active: true },
    orderBy: { id: 'asc' },
  })
  return rows.map(mapReturnNoteItem)
}

export async function listReturnNoteItems(filters: {
  corporationUuid?: string
  projectUuid?: string
  itemType?: string
  purchaseOrderUuid?: string
  changeOrderUuid?: string
}) {
  const where: Record<string, unknown> = { is_active: true }
  if (filters.corporationUuid) where.corporation_uuid = filters.corporationUuid
  if (filters.projectUuid) where.project_uuid = filters.projectUuid
  if (filters.itemType) where.item_type = filters.itemType
  if (filters.purchaseOrderUuid) where.purchase_order_uuid = filters.purchaseOrderUuid
  if (filters.changeOrderUuid) where.change_order_uuid = filters.changeOrderUuid

  const rows = await prisma.returnNoteItem.findMany({
    where,
    orderBy: { id: 'asc' },
  })
  return rows.map(mapReturnNoteItem)
}

export async function replaceReturnNoteItems(
  returnNoteUuid: string,
  corporationUuid: string | null,
  projectUuid: string | null,
  items: any[],
) {
  await prisma.returnNoteItem.deleteMany({ where: { return_note_uuid: returnNoteUuid } })
  if (!items.length) return []

  const rows = items.map((item) => {
    const itemUuid = item?.item_uuid || item?.base_item_uuid || item?.uuid || null
    const lineTotal =
      toNum(item?.return_total) ??
      toNum(item?.total) ??
      (() => {
        const qty = toNum(item?.return_quantity) || 0
        const price = toNum(item?.unit_price) || 0
        return qty * price
      })()

    return {
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
      item_uuid: itemUuid,
      item_name: item?.item_name ?? item?.name ?? '',
      description: item?.description ?? '',
      model_number: item?.model_number ?? '',
      location_uuid: item?.location_uuid ?? null,
      unit_uuid: item?.unit_uuid ?? null,
      unit_label: item?.unit_label ?? null,
      category: item?.category ?? null,
      po_quantity: toNum(item?.po_quantity ?? item?.ordered_quantity),
      return_quantity: toNum(item?.return_quantity),
      unit_price: toNum(item?.unit_price),
      total: lineTotal,
      po_item_uuid: item?.po_item_uuid ?? itemUuid,
      receipt_note_uuid: item?.receipt_note_uuid ?? null,
      metadata: stringifyJson(item?.metadata ?? {}),
      is_active: true,
    }
  })

  await prisma.returnNoteItem.createMany({ data: rows })
  return getReturnNoteItems(returnNoteUuid)
}
