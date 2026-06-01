/**
 * Persists GRN line data to receipt_note_items and updates receipt_note_uuids on PO/CO lines.
 * Used by stock-receipt-notes API and update-receipt-fields routes (no internal $fetch).
 */
import { createError } from 'h3'
import { getPrisma } from './prisma'

const prisma = getPrisma()

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function parseJsonArray(val: string | null | undefined): string[] {
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function stringifyJsonArray(arr: string[]): string {
  return JSON.stringify(arr)
}

function toNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = parseFloat(String(val))
  return Number.isNaN(n) ? null : n
}

type LineInput = {
  uuid?: string
  id?: string
  cost_code_uuid?: string | null
  received_quantity?: unknown
  unit_price?: unknown
  grn_total?: unknown
  grn_total_with_charges_taxes?: unknown
}

async function persistReceiptLines(
  body: Record<string, any>,
  itemType: 'purchase_order' | 'change_order',
) {
  const receiptNoteUuid = String(body.receipt_note_uuid || '').trim()
  const corporationUuid = String(body.corporation_uuid || '').trim()
  const items = body.items

  if (!receiptNoteUuid) {
    throw createError({ statusCode: 400, statusMessage: 'receipt_note_uuid is required' })
  }
  if (!corporationUuid) {
    throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return { success: true, updated: 0, receipt_note_items_created: 0 }
  }

  const receiptNote = await prisma.stockReceiptNote.findFirst({
    where: { uuid: receiptNoteUuid, is_active: true },
  })
  if (!receiptNote) {
    throw createError({ statusCode: 404, statusMessage: `Receipt note ${receiptNoteUuid} not found` })
  }

  const corpUuid = corporationUuid || receiptNote.corporation_uuid
  const projUuid = body.project_uuid ?? receiptNote.project_uuid ?? null
  const poUuid =
    itemType === 'purchase_order'
      ? (body.purchase_order_uuid ?? receiptNote.purchase_order_uuid ?? null)
      : null
  const coUuid =
    itemType === 'change_order'
      ? (body.change_order_uuid ?? receiptNote.change_order_uuid ?? null)
      : null

  const itemUuids: string[] = []
  let created = 0

  for (const raw of items as LineInput[]) {
    const itemUuid = String(raw.uuid || raw.id || '').trim()
    if (!itemUuid) continue

    const receivedQty = toNum(raw.received_quantity)
    let receivedTotal: number | null = null
    if (receivedQty !== null && raw.unit_price !== undefined) {
      const unitPrice = toNum(raw.unit_price)
      if (unitPrice !== null) {
        receivedTotal = Math.round((unitPrice * receivedQty + Number.EPSILON) * 100) / 100
      }
    }

    const grnTotal = toNum(raw.grn_total)
    const grnTotalWithCharges = toNum(raw.grn_total_with_charges_taxes)

    const existing = await prisma.receiptNoteItem.findFirst({
      where: {
        receipt_note_uuid: receiptNoteUuid,
        item_uuid: itemUuid,
        item_type: itemType,
        is_active: true,
      },
    })

    const lineData = {
      corporation_uuid: corpUuid,
      project_uuid: projUuid,
      receipt_note_uuid: receiptNoteUuid,
      item_type: itemType,
      purchase_order_uuid: poUuid,
      change_order_uuid: coUuid,
      item_uuid: itemUuid,
      cost_code_uuid: raw.cost_code_uuid ?? null,
      received_quantity: receivedQty,
      received_total: receivedTotal,
      grn_total: grnTotal,
      grn_total_with_charges_taxes: grnTotalWithCharges,
      total: grnTotalWithCharges ?? grnTotal ?? receivedTotal,
      is_active: true,
    }

    if (existing) {
      await prisma.receiptNoteItem.update({
        where: { uuid: existing.uuid },
        data: lineData,
      })
    } else {
      await prisma.receiptNoteItem.create({ data: lineData })
      created++
    }

    itemUuids.push(itemUuid)
  }

  if (itemUuids.length === 0) {
    return { success: true, updated: 0, receipt_note_items_created: 0 }
  }

  if (itemType === 'purchase_order') {
    const poItems = await prisma.purchaseOrderItem.findMany({
      where: { uuid: { in: itemUuids } },
      select: { uuid: true, receipt_note_uuids: true },
    })
    for (const row of poItems) {
      const current = parseJsonArray(row.receipt_note_uuids)
      if (!current.includes(receiptNoteUuid)) {
        await prisma.purchaseOrderItem.update({
          where: { uuid: row.uuid },
          data: { receipt_note_uuids: stringifyJsonArray([...current, receiptNoteUuid]) },
        })
      }
    }
  } else {
    const coItems = await prisma.changeOrderItem.findMany({
      where: { uuid: { in: itemUuids } },
      select: { uuid: true, receipt_note_uuids: true },
    })
    for (const row of coItems) {
      const current = parseJsonArray(row.receipt_note_uuids)
      if (!current.includes(receiptNoteUuid)) {
        await prisma.changeOrderItem.update({
          where: { uuid: row.uuid },
          data: { receipt_note_uuids: stringifyJsonArray([...current, receiptNoteUuid]) },
        })
      }
    }
  }

  return {
    success: true,
    updated: itemUuids.length,
    receipt_note_items_created: created,
  }
}

export async function applyPurchaseOrderReceiptFieldsUpdate(body: Record<string, any>) {
  return persistReceiptLines(body, 'purchase_order')
}

export async function applyChangeOrderReceiptFieldsUpdate(body: Record<string, any>) {
  return persistReceiptLines(body, 'change_order')
}
