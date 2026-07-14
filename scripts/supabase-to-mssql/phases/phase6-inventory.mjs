import { pgQuery } from '../db.mjs'
import {
  attachmentRowsFromJson,
  auditRowsFromJson,
  chargeRowsFromBreakdown,
  parseBreakdown,
  taxRowsFromBreakdown,
} from '../expandBlobs.mjs'
import { remapCorp, remapUom, remapVendor, remapMasterUuid } from '../lookups.mjs'
import { replaceChildren, upsertByUuid } from '../upsert.mjs'
import { asBool, asDate, asNum, asStr, log, parseJson, stringifyJson, uuidStr } from '../utils.mjs'

function corpWhere(ctx, col) {
  const ids = ctx.corpFilter?.localUuids
  if (!ids?.length) return ''
  const list = ids.map((u) => `'${u.replace(/'/g, "''")}'`).join(',')
  return `where ${col}::text in (${list})`
}

/** @param {any} ctx */
export async function runPhase6Inventory(ctx) {
  const { pg, mssql, lookups, dryRun } = ctx
  log('=== Phase 6: GRN + returns ===')

  const grns = await pgQuery(pg, `select * from public.stock_receipt_notes ${corpWhere(ctx, 'corporation_uuid')}`)
  await upsertByUuid(mssql, {
    table: 'stock_receipt_notes',
    columns: ['uuid', 'corporation_uuid', 'project_uuid', 'purchase_order_uuid', 'change_order_uuid', 'receipt_type', 'vendor_uuid', 'entry_date', 'received_date', 'shipment_date', 'grn_number', 'reference_number', 'received_by', 'location_uuid', 'notes', 'status', 'total_received_amount', 'metadata', 'is_active', 'created_at', 'updated_at'],
    dryRun,
    rows: grns.map((r) => ({
      uuid: uuidStr(r.uuid),
      corporation_uuid: remapCorp(lookups, r.corporation_uuid),
      project_uuid: uuidStr(r.project_uuid),
      purchase_order_uuid: uuidStr(r.purchase_order_uuid),
      change_order_uuid: uuidStr(r.change_order_uuid),
      receipt_type: asStr(r.receipt_type, 50),
      vendor_uuid: remapVendor(lookups, r.vendor_uuid),
      entry_date: asDate(r.entry_date),
      received_date: asDate(r.received_date),
      shipment_date: asDate(r.shipment_date),
      grn_number: asStr(r.grn_number, 100),
      reference_number: asStr(r.reference_number, 100),
      received_by: asStr(r.received_by, 255),
      location_uuid: remapMasterUuid(lookups, r.location_uuid),
      notes: asStr(r.notes),
      status: asStr(r.status, 50) || 'Shipment',
      total_received_amount: asNum(r.total_received_amount),
      metadata: scrubMeta(r.metadata),
      is_active: asBool(r.is_active, true),
      created_at: asDate(r.created_at),
      updated_at: asDate(r.updated_at) || new Date(),
    })),
  })

  await expandHeaderBlobs(mssql, lookups, dryRun, grns, {
    parentKey: 'receipt_note_uuid',
    chargeTable: 'grn_financial_charges',
    taxTable: 'grn_financial_taxes',
    attTable: 'grn_attachments',
    auditTable: 'grn_audit_events',
  })

  const grnIds = grns.map((r) => uuidStr(r.uuid)).filter(Boolean)
  const inGrn = grnIds.length ? `where receipt_note_uuid::text in (${grnIds.map((u) => `'${u}'`).join(',')})` : (ctx.corpFilter ? 'where false' : '')
  {
    const rows = await pgQuery(pg, `select * from public.receipt_note_items ${inGrn}`)
    await upsertByUuid(mssql, {
      table: 'receipt_note_items',
      columns: ['uuid', 'corporation_uuid', 'project_uuid', 'receipt_note_uuid', 'item_type', 'purchase_order_uuid', 'change_order_uuid', 'cost_code_uuid', 'cost_code_label', 'cost_code_number', 'cost_code_name', 'division_name', 'item_uuid', 'item_name', 'description', 'model_number', 'location_uuid', 'unit_uuid', 'unit_label', 'category', 'po_quantity', 'received_quantity', 'received_total', 'grn_total', 'grn_total_with_charges_taxes', 'unit_price', 'total', 'po_item_uuid', 'metadata', 'is_active', 'created_at', 'updated_at'],
      dryRun,
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        corporation_uuid: remapCorp(lookups, r.corporation_uuid),
        project_uuid: uuidStr(r.project_uuid),
        receipt_note_uuid: uuidStr(r.receipt_note_uuid),
        item_type: asStr(r.item_type, 50),
        purchase_order_uuid: uuidStr(r.purchase_order_uuid),
        change_order_uuid: uuidStr(r.change_order_uuid),
        cost_code_uuid: remapMasterUuid(lookups, r.cost_code_uuid),
        cost_code_label: asStr(r.cost_code_label, 255),
        cost_code_number: asStr(r.cost_code_number, 100),
        cost_code_name: asStr(r.cost_code_name, 255),
        division_name: asStr(r.division_name, 255),
        item_uuid: uuidStr(r.item_uuid),
        item_name: asStr(r.item_name, 500),
        description: asStr(r.description),
        model_number: asStr(r.model_number, 255),
        location_uuid: remapMasterUuid(lookups, r.location_uuid),
        unit_uuid: remapUom(lookups, r.unit_uuid || r.uom_uuid),
        unit_label: asStr(r.unit_label, 100),
        category: asStr(r.category, 100),
        po_quantity: asNum(r.po_quantity ?? r.ordered_quantity),
        received_quantity: asNum(r.received_quantity),
        received_total: asNum(r.received_total),
        grn_total: asNum(r.grn_total),
        grn_total_with_charges_taxes: asNum(r.grn_total_with_charges_taxes),
        unit_price: asNum(r.unit_price),
        total: asNum(r.total),
        po_item_uuid: uuidStr(r.po_item_uuid),
        metadata: stringifyJson(r.metadata),
        is_active: asBool(r.is_active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
      })),
    })
  }

  const returns = await pgQuery(pg, `select * from public.stock_return_notes ${corpWhere(ctx, 'corporation_uuid')}`)
  await upsertByUuid(mssql, {
    table: 'stock_return_notes',
    columns: ['uuid', 'corporation_uuid', 'project_uuid', 'purchase_order_uuid', 'change_order_uuid', 'return_type', 'vendor_uuid', 'entry_date', 'return_note_number', 'reference_number', 'returned_by', 'nimble_returned_by_user_id', 'location_uuid', 'notes', 'status', 'total_return_amount', 'metadata', 'is_active', 'created_at', 'updated_at'],
    dryRun,
    rows: returns.map((r) => ({
      uuid: uuidStr(r.uuid),
      corporation_uuid: remapCorp(lookups, r.corporation_uuid),
      project_uuid: uuidStr(r.project_uuid),
      purchase_order_uuid: uuidStr(r.purchase_order_uuid),
      change_order_uuid: uuidStr(r.change_order_uuid),
      return_type: asStr(r.return_type, 50),
      vendor_uuid: remapVendor(lookups, r.vendor_uuid),
      entry_date: asDate(r.entry_date),
      return_note_number: asStr(r.return_note_number, 100),
      reference_number: asStr(r.reference_number, 100),
      returned_by: asStr(r.returned_by, 255),
      nimble_returned_by_user_id: asStr(r.nimble_returned_by_user_id, 255),
      location_uuid: remapMasterUuid(lookups, r.location_uuid),
      notes: asStr(r.notes),
      status: asStr(r.status, 50) || 'Returned',
      total_return_amount: asNum(r.total_return_amount),
      metadata: scrubMeta(r.metadata),
      is_active: asBool(r.is_active, true),
      created_at: asDate(r.created_at),
      updated_at: asDate(r.updated_at) || new Date(),
    })),
  })

  await expandHeaderBlobs(mssql, lookups, dryRun, returns, {
    parentKey: 'return_note_uuid',
    chargeTable: 'return_financial_charges',
    taxTable: 'return_financial_taxes',
    attTable: 'return_attachments',
    auditTable: 'return_audit_events',
    financialFrom: 'financial_breakdown',
  })

  const rtnIds = returns.map((r) => uuidStr(r.uuid)).filter(Boolean)
  const inRtn = rtnIds.length ? `where return_note_uuid::text in (${rtnIds.map((u) => `'${u}'`).join(',')})` : (ctx.corpFilter ? 'where false' : '')
  {
    const rows = await pgQuery(pg, `select * from public.return_note_items ${inRtn}`)
    await upsertByUuid(mssql, {
      table: 'return_note_items',
      columns: ['uuid', 'corporation_uuid', 'project_uuid', 'return_note_uuid', 'item_type', 'purchase_order_uuid', 'change_order_uuid', 'cost_code_uuid', 'cost_code_label', 'cost_code_number', 'cost_code_name', 'division_name', 'item_uuid', 'item_name', 'description', 'model_number', 'location_uuid', 'unit_uuid', 'unit_label', 'category', 'po_quantity', 'return_quantity', 'unit_price', 'total', 'po_item_uuid', 'receipt_note_uuid', 'metadata', 'is_active', 'created_at', 'updated_at'],
      dryRun,
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        corporation_uuid: remapCorp(lookups, r.corporation_uuid),
        project_uuid: uuidStr(r.project_uuid),
        return_note_uuid: uuidStr(r.return_note_uuid),
        item_type: asStr(r.item_type, 50),
        purchase_order_uuid: uuidStr(r.purchase_order_uuid),
        change_order_uuid: uuidStr(r.change_order_uuid),
        cost_code_uuid: remapMasterUuid(lookups, r.cost_code_uuid),
        cost_code_label: asStr(r.cost_code_label, 255),
        cost_code_number: asStr(r.cost_code_number, 100),
        cost_code_name: asStr(r.cost_code_name, 255),
        division_name: asStr(r.division_name, 255),
        item_uuid: uuidStr(r.item_uuid),
        item_name: asStr(r.item_name, 500),
        description: asStr(r.description),
        model_number: asStr(r.model_number, 255),
        location_uuid: remapMasterUuid(lookups, r.location_uuid),
        unit_uuid: remapUom(lookups, r.unit_uuid || r.uom_uuid),
        unit_label: asStr(r.unit_label, 100),
        category: asStr(r.category, 100),
        po_quantity: asNum(r.po_quantity),
        return_quantity: asNum(r.return_quantity),
        unit_price: asNum(r.unit_price),
        total: asNum(r.total),
        po_item_uuid: uuidStr(r.po_item_uuid),
        receipt_note_uuid: uuidStr(r.receipt_note_uuid),
        metadata: stringifyJson(r.metadata),
        is_active: asBool(r.is_active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
      })),
    })
  }
}

function scrubMeta(raw) {
  const meta = parseJson(raw, {}) || {}
  if (typeof meta !== 'object') return '{}'
  const copy = { ...meta }
  delete copy.financial_breakdown
  return JSON.stringify(copy)
}

async function expandHeaderBlobs(mssql, lookups, dryRun, headers, cfg) {
  const parentUuids = []
  const charges = []
  const taxes = []
  const attachments = []
  const audits = []
  for (const r of headers) {
    const uuid = uuidStr(r.uuid)
    const corp = remapCorp(lookups, r.corporation_uuid)
    if (!uuid || !corp) continue
    parentUuids.push(uuid)
    const meta = parseJson(r.metadata, {}) || {}
    const fb = parseBreakdown(r[cfg.financialFrom || 'financial_breakdown'] || meta.financial_breakdown)
    if (fb) {
      charges.push(...chargeRowsFromBreakdown(fb, corp, uuid, cfg.parentKey))
      taxes.push(...taxRowsFromBreakdown(fb, corp, uuid, cfg.parentKey))
    }
    attachments.push(...attachmentRowsFromJson(r.attachments, corp, uuid, cfg.parentKey))
    audits.push(...auditRowsFromJson(r.audit_log, corp, uuid, cfg.parentKey))
  }
  await replaceChildren(mssql, { table: cfg.chargeTable, parentCol: cfg.parentKey, parentUuids, columns: ['corporation_uuid', cfg.parentKey, 'charge_key', 'percentage', 'amount', 'taxable'], rows: charges, dryRun })
  await replaceChildren(mssql, { table: cfg.taxTable, parentCol: cfg.parentKey, parentUuids, columns: ['corporation_uuid', cfg.parentKey, 'tax_key', 'percentage', 'amount'], rows: taxes, dryRun })
  await replaceChildren(mssql, { table: cfg.attTable, parentCol: cfg.parentKey, parentUuids, columns: ['corporation_uuid', cfg.parentKey, 'document_name', 'mime_type', 'file_size', 'file_url', 'uploaded_at', 'uploaded_by', 'sort_order', 'source_uuid'], rows: attachments, dryRun })
  await replaceChildren(mssql, { table: cfg.auditTable, parentCol: cfg.parentKey, parentUuids, columns: ['corporation_uuid', cfg.parentKey, 'event_type', 'payload', 'created_by', 'event_at'], rows: audits, dryRun })
}
