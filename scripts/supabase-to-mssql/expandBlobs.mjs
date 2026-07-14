import { asBool, asDate, asNum, asStr, parseJson, uuidStr } from './utils.mjs'

export const CHARGE_KEYS = ['freight', 'packing', 'custom_duties', 'other']
export const TAX_KEYS = ['sales_tax_1', 'sales_tax_2']

/**
 * @param {unknown} raw
 */
export function parseBreakdown(raw) {
  const obj = parseJson(raw, null)
  if (obj && typeof obj === 'object') return obj
  return null
}

/**
 * @param {any} breakdown
 * @param {string} corporationUuid
 * @param {string} parentUuid
 * @param {'purchase_order_uuid'|'change_order_uuid'|'vendor_invoice_uuid'|'receipt_note_uuid'|'return_note_uuid'} parentKey
 */
export function chargeRowsFromBreakdown(breakdown, corporationUuid, parentUuid, parentKey) {
  const charges = breakdown?.charges || {}
  return CHARGE_KEYS.map((charge_key) => ({
    corporation_uuid: corporationUuid,
    [parentKey]: parentUuid,
    charge_key,
    percentage: asNum(charges[charge_key]?.percentage),
    amount: asNum(charges[charge_key]?.amount),
    taxable: asBool(charges[charge_key]?.taxable, false),
  }))
}

/**
 * @param {any} breakdown
 * @param {string} corporationUuid
 * @param {string} parentUuid
 * @param {string} parentKey
 */
export function taxRowsFromBreakdown(breakdown, corporationUuid, parentUuid, parentKey) {
  const taxes = breakdown?.sales_taxes || breakdown?.salesTaxes || {}
  return TAX_KEYS.map((tax_key) => ({
    corporation_uuid: corporationUuid,
    [parentKey]: parentUuid,
    tax_key,
    percentage: asNum(taxes[tax_key]?.percentage),
    amount: asNum(taxes[tax_key]?.amount),
  }))
}

/**
 * @param {unknown} attachments
 * @param {string} corporationUuid
 * @param {string} parentUuid
 * @param {string} parentKey
 */
export function attachmentRowsFromJson(attachments, corporationUuid, parentUuid, parentKey) {
  const arr = parseJson(attachments, [])
  if (!Array.isArray(arr)) return []
  return arr.map((raw, index) => {
    const a = raw && typeof raw === 'object' ? raw : {}
    return {
      corporation_uuid: corporationUuid,
      [parentKey]: parentUuid,
      document_name: asStr(a.document_name ?? a.name ?? a.file_name ?? 'attachment', 255) || 'attachment',
      mime_type: asStr(a.mime_type, 100),
      file_size: asNum(a.file_size) != null ? Math.trunc(asNum(a.file_size)) : null,
      file_url: asStr(a.file_url),
      uploaded_at: asDate(a.uploaded_at),
      uploaded_by: asStr(a.uploaded_by, 128),
      sort_order: typeof a.sort_order === 'number' ? a.sort_order : index,
      source_uuid: a.uuid ? asStr(a.uuid, 36) : null,
    }
  })
}

/**
 * @param {unknown} auditLog
 * @param {string} corporationUuid
 * @param {string} parentUuid
 * @param {string} parentKey
 */
export function auditRowsFromJson(auditLog, corporationUuid, parentUuid, parentKey) {
  const arr = parseJson(auditLog, [])
  if (!Array.isArray(arr)) return []
  return arr.map((raw) => {
    const e = raw && typeof raw === 'object' ? raw : {}
    const eventAt = e.timestamp || e.created_at || e.at || e.date
    const d = eventAt ? new Date(eventAt) : new Date()
    return {
      corporation_uuid: corporationUuid,
      [parentKey]: parentUuid,
      event_type: asStr(e.event_type ?? e.type ?? e.action ?? e.status ?? 'event', 100) || 'event',
      payload: JSON.stringify(e),
      created_by: asStr(e.created_by || e.user_id || e.user_uuid || e.user || e.by, 128),
      event_at: Number.isNaN(d.getTime()) ? new Date() : d,
    }
  })
}

/**
 * @param {unknown} removed
 * @param {string} corporationUuid
 * @param {string} parentUuid
 * @param {'purchase_order_uuid'|'change_order_uuid'} parentKey
 */
export function removedItemRowsFromJson(removed, corporationUuid, parentUuid, parentKey) {
  const arr = parseJson(removed, [])
  if (!Array.isArray(arr)) return []
  return arr.map((raw) => {
    const item = raw && typeof raw === 'object' ? raw : {}
    return {
      corporation_uuid: corporationUuid,
      [parentKey]: parentUuid,
      item_uuid: item.item_uuid ? String(item.item_uuid) : null,
      cost_code_uuid: item.cost_code_uuid ? String(item.cost_code_uuid) : null,
      location_uuid: item.location_uuid ? String(item.location_uuid) : null,
      source_item_uuid: item.uuid || item.id ? String(item.uuid || item.id).slice(0, 36) : null,
      item_snapshot: JSON.stringify(item),
      removed_at: asDate(item.removed_at) || new Date(),
    }
  })
}

/**
 * @param {unknown} ids
 * @param {string} corporationUuid
 * @param {string} estimateUuid
 */
export function removedCostCodeRows(ids, corporationUuid, estimateUuid) {
  const arr = parseJson(ids, [])
  if (!Array.isArray(arr)) return []
  const unique = [...new Set(arr.map((id) => String(id).trim()).filter(Boolean))]
  return unique.map((cost_code_uuid) => ({
    corporation_uuid: corporationUuid,
    estimate_uuid: estimateUuid,
    cost_code_uuid,
  }))
}

/**
 * @param {unknown} uuidsJson
 * @param {string} corporationUuid
 * @param {string} itemUuid
 * @param {'purchase_order_item_uuid'|'change_order_item_uuid'|'labor_invoice_item_uuid'} itemKey
 * @param {'po_item_approval_checks'|'co_item_approval_checks'|'labor_invoice_approval_checks'} _table
 */
export function approvalCheckJunctionRows(uuidsJson, corporationUuid, itemUuid, itemKey, lookups = null) {
  const arr = parseJson(uuidsJson, [])
  if (!Array.isArray(arr)) return []
  return [...new Set(arr.map((u) => uuidStr(u)).filter(Boolean))].map((raw) => {
    const approval_check_uuid = lookups?.masterUuidAlias
      ? (lookups.masterUuidAlias.get(raw) || raw)
      : raw
    return {
      corporation_uuid: corporationUuid,
      [itemKey]: itemUuid,
      approval_check_uuid,
    }
  })
}

/**
 * @param {unknown} uuidsJson
 * @param {string} corporationUuid
 * @param {string} itemUuid
 * @param {'purchase_order_item_uuid'|'change_order_item_uuid'} itemKey
 */
export function receiptNoteJunctionRows(uuidsJson, corporationUuid, itemUuid, itemKey) {
  const arr = parseJson(uuidsJson, [])
  if (!Array.isArray(arr)) return []
  return [...new Set(arr.map((u) => uuidStr(u)).filter(Boolean))].map((receipt_note_uuid) => ({
    corporation_uuid: corporationUuid,
    [itemKey]: itemUuid,
    receipt_note_uuid,
  }))
}

/**
 * @param {unknown} tags
 * @param {string} projectDocumentUuid
 */
export function documentTagRows(tags, projectDocumentUuid) {
  const arr = parseJson(tags, [])
  if (!Array.isArray(arr)) return []
  return [...new Set(arr.map((t) => String(t).trim()).filter(Boolean))].map((tag) => ({
    project_document_uuid: projectDocumentUuid,
    tag: tag.slice(0, 100),
  }))
}
