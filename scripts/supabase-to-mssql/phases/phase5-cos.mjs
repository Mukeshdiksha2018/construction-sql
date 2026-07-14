import { pgQuery } from '../db.mjs'
import {
  approvalCheckJunctionRows,
  attachmentRowsFromJson,
  auditRowsFromJson,
  chargeRowsFromBreakdown,
  parseBreakdown,
  receiptNoteJunctionRows,
  removedItemRowsFromJson,
  taxRowsFromBreakdown,
} from '../expandBlobs.mjs'
import { remapCorp, remapShipVia, remapUom, remapVendor, remapMasterUuid } from '../lookups.mjs'
import { replaceChildren, upsertByUuid } from '../upsert.mjs'
import { asBool, asDate, asNum, asStr, log, stringifyJson, uuidStr } from '../utils.mjs'

function corpWhere(ctx, col) {
  const ids = ctx.corpFilter?.localUuids
  if (!ids?.length) return ''
  const list = ids.map((u) => `'${u.replace(/'/g, "''")}'`).join(',')
  return `where ${col}::text in (${list})`
}

/** @param {any} ctx */
export async function runPhase5ChangeOrders(ctx) {
  const { pg, mssql, lookups, dryRun } = ctx
  log('=== Phase 5: change orders ===')

  const headers = await pgQuery(pg, `select * from public.change_orders ${corpWhere(ctx, 'corporation_uuid')}`)

  await upsertByUuid(mssql, {
    table: 'change_orders',
    columns: ['uuid', 'corporation_uuid', 'project_uuid', 'vendor_uuid', 'original_purchase_order_uuid', 'co_number', 'created_date', 'credit_days', 'credit_days_id', 'estimated_delivery_date', 'requested_by', 'nimble_requested_by_user_id', 'co_type', 'ship_via_uuid', 'freight_uuid', 'shipping_instructions', 'quote_reference', 'reason', 'reason_uuid', 'shipping_address_uuid', 'terms_and_conditions_uuid', 'special_instruction_uuid', 'prepared_by', 'status', 'print_include_approved_by_vendor', 'print_use_entity_name', 'is_revised', 'revision_number', 'revision_notes', 'revision_date', 'currency_conversion_enabled', 'currency_from', 'currency_to', 'conversion_rate', 'last_handled_approval_type', 'is_active', 'created_at', 'updated_at'],
    dryRun,
    rows: headers.map((r) => ({
      uuid: uuidStr(r.uuid),
      corporation_uuid: remapCorp(lookups, r.corporation_uuid),
      project_uuid: uuidStr(r.project_uuid),
      vendor_uuid: remapVendor(lookups, r.vendor_uuid),
      original_purchase_order_uuid: uuidStr(r.original_purchase_order_uuid),
      co_number: asStr(r.co_number, 100),
      created_date: asDate(r.created_date || r.entry_date),
      credit_days: asStr(r.credit_days, 100),
      credit_days_id: asStr(r.credit_days_id, 100),
      estimated_delivery_date: asDate(r.estimated_delivery_date),
      requested_by: asStr(r.requested_by, 36),
      nimble_requested_by_user_id: asStr(r.nimble_requested_by_user_id, 128),
      co_type: asStr(r.co_type, 20),
      ship_via_uuid: remapShipVia(lookups, r.ship_via_uuid || r.ship_via),
      freight_uuid: remapMasterUuid(lookups, r.freight_uuid || r.freight),
      shipping_instructions: asStr(r.shipping_instructions),
      quote_reference: asStr(r.quote_reference, 255),
      reason: asStr(r.reason),
      reason_uuid: uuidStr(r.reason_uuid),
      shipping_address_uuid: uuidStr(r.shipping_address_uuid),
      terms_and_conditions_uuid: remapMasterUuid(lookups, r.terms_and_conditions_uuid),
      special_instruction_uuid: uuidStr(r.special_instruction_uuid),
      prepared_by: asStr(r.prepared_by, 255),
      status: asStr(r.status, 50) || 'Draft',
      print_include_approved_by_vendor: r.print_include_approved_by_vendor == null ? null : asBool(r.print_include_approved_by_vendor),
      print_use_entity_name: r.print_use_entity_name == null ? null : asBool(r.print_use_entity_name),
      is_revised: asBool(r.is_revised, false),
      revision_number: asStr(r.revision_number, 50),
      revision_notes: asStr(r.revision_notes),
      revision_date: asDate(r.revision_date),
      currency_conversion_enabled: asBool(r.currency_conversion_enabled, false),
      currency_from: asStr(r.currency_from, 10),
      currency_to: asStr(r.currency_to, 10),
      conversion_rate: asNum(r.conversion_rate),
      last_handled_approval_type: asNum(r.last_handled_approval_type) != null ? Math.trunc(asNum(r.last_handled_approval_type)) : null,
      is_active: asBool(r.is_active, true),
      created_at: asDate(r.created_at),
      updated_at: asDate(r.updated_at) || new Date(),
    })),
  })

  const parentUuids = []
  const charges = []
  const taxes = []
  const attachments = []
  const audits = []
  const removed = []
  for (const r of headers) {
    const uuid = uuidStr(r.uuid)
    const corp = remapCorp(lookups, r.corporation_uuid)
    if (!uuid || !corp) continue
    parentUuids.push(uuid)
    const fb = parseBreakdown(r.financial_breakdown)
    if (fb) {
      charges.push(...chargeRowsFromBreakdown(fb, corp, uuid, 'change_order_uuid'))
      taxes.push(...taxRowsFromBreakdown(fb, corp, uuid, 'change_order_uuid'))
    }
    attachments.push(...attachmentRowsFromJson(r.attachments, corp, uuid, 'change_order_uuid'))
    audits.push(...auditRowsFromJson(r.audit_log, corp, uuid, 'change_order_uuid'))
    removed.push(...removedItemRowsFromJson(r.removed_co_items, corp, uuid, 'change_order_uuid'))
  }
  await replaceChildren(mssql, { table: 'co_financial_charges', parentCol: 'change_order_uuid', parentUuids, columns: ['corporation_uuid', 'change_order_uuid', 'charge_key', 'percentage', 'amount', 'taxable'], rows: charges, dryRun })
  await replaceChildren(mssql, { table: 'co_financial_taxes', parentCol: 'change_order_uuid', parentUuids, columns: ['corporation_uuid', 'change_order_uuid', 'tax_key', 'percentage', 'amount'], rows: taxes, dryRun })
  await replaceChildren(mssql, { table: 'co_attachments', parentCol: 'change_order_uuid', parentUuids, columns: ['corporation_uuid', 'change_order_uuid', 'document_name', 'mime_type', 'file_size', 'file_url', 'uploaded_at', 'uploaded_by', 'sort_order', 'source_uuid'], rows: attachments, dryRun })
  await replaceChildren(mssql, { table: 'co_audit_events', parentCol: 'change_order_uuid', parentUuids, columns: ['corporation_uuid', 'change_order_uuid', 'event_type', 'payload', 'created_by', 'event_at'], rows: audits, dryRun })
  await replaceChildren(mssql, { table: 'co_removed_items', parentCol: 'change_order_uuid', parentUuids, columns: ['corporation_uuid', 'change_order_uuid', 'item_uuid', 'cost_code_uuid', 'location_uuid', 'source_item_uuid', 'item_snapshot', 'removed_at'], rows: removed, dryRun })

  const inCo = parentUuids.length ? `where change_order_uuid::text in (${parentUuids.map((u) => `'${u}'`).join(',')})` : (ctx.corpFilter ? 'where false' : '')

  const headerCorpByUuid = new Map(
    headers.map((h) => [uuidStr(h.uuid), remapCorp(lookups, h.corporation_uuid)]).filter(([u, c]) => u && c),
  )
  const items = await pgQuery(pg, `select * from public.change_order_items_list ${inCo}`)
  await upsertByUuid(mssql, {
    table: 'change_order_items_list',
    columns: ['uuid', 'corporation_uuid', 'project_uuid', 'change_order_uuid', 'order_index', 'source', 'cost_code_uuid', 'cost_code_label', 'cost_code_number', 'cost_code_name', 'division_name', 'category', 'item_division_uuid', 'item_type_uuid', 'item_type_label', 'item_uuid', 'item_name', 'description', 'model_number', 'location_uuid', 'location_label', 'unit_uuid', 'unit_label', 'quantity', 'unit_price', 'co_quantity', 'co_unit_price', 'co_total', 'total', 'approval_checks_uuids', 'receipt_note_uuids', 'configuration_name', 'metadata', 'is_removed', 'removed_at', 'is_active', 'created_at', 'updated_at'],
    dryRun,
    rows: items.map((r) => ({
      uuid: uuidStr(r.uuid),
      corporation_uuid: remapCorp(lookups, r.corporation_uuid) || headerCorpByUuid.get(uuidStr(r.change_order_uuid)) || null,
      project_uuid: uuidStr(r.project_uuid),
      change_order_uuid: uuidStr(r.change_order_uuid),
      order_index: asNum(r.order_index) != null ? Math.trunc(asNum(r.order_index)) : 0,
      source: asStr(r.source, 100),
      cost_code_uuid: remapMasterUuid(lookups, r.cost_code_uuid),
      cost_code_label: asStr(r.cost_code_label, 255),
      cost_code_number: asStr(r.cost_code_number, 100),
      cost_code_name: asStr(r.cost_code_name, 255),
      division_name: asStr(r.division_name, 255),
      category: asStr(r.category, 100),
      item_division_uuid: uuidStr(r.item_division_uuid),
      item_type_uuid: uuidStr(r.item_type_uuid),
      item_type_label: asStr(r.item_type_label, 255),
      item_uuid: uuidStr(r.item_uuid),
      item_name: asStr(r.item_name, 500),
      description: asStr(r.description),
      model_number: asStr(r.model_number, 255),
      location_uuid: remapMasterUuid(lookups, r.location_uuid),
      location_label: asStr(r.location_label, 255),
      unit_uuid: remapUom(lookups, r.unit_uuid || r.uom_uuid),
      unit_label: asStr(r.unit_label, 100),
      quantity: asNum(r.quantity),
      unit_price: asNum(r.unit_price),
      co_quantity: asNum(r.co_quantity),
      co_unit_price: asNum(r.co_unit_price),
      co_total: asNum(r.co_total),
      total: asNum(r.total),
      approval_checks_uuids: stringifyJson(r.approval_checks_uuids),
      receipt_note_uuids: stringifyJson(r.receipt_note_uuids),
      configuration_name: asStr(r.configuration_name, 255),
      metadata: stringifyJson(r.metadata),
      is_removed: asBool(r.is_removed, false),
      removed_at: asDate(r.removed_at),
      is_active: asBool(r.is_active, true),
      created_at: asDate(r.created_at),
      updated_at: asDate(r.updated_at) || new Date(),
    })),
  })

  const appr = []
  const rcpt = []
  const itemParents = []
  for (const r of items) {
    const uuid = uuidStr(r.uuid)
    if (!uuid) continue
    itemParents.push(uuid)
    appr.push(...approvalCheckJunctionRows(r.approval_checks_uuids, '', uuid, 'change_order_item_uuid', lookups))
    rcpt.push(...receiptNoteJunctionRows(r.receipt_note_uuids, '', uuid, 'change_order_item_uuid'))
  }
  await replaceChildren(mssql, { table: 'co_item_approval_checks', parentCol: 'change_order_item_uuid', parentUuids: itemParents, columns: ['change_order_item_uuid', 'approval_check_uuid'], rows: appr, dryRun })
  await replaceChildren(mssql, { table: 'co_item_receipt_notes', parentCol: 'change_order_item_uuid', parentUuids: itemParents, columns: ['change_order_item_uuid', 'receipt_note_uuid'], rows: rcpt, dryRun })

  try {
    const labor = await pgQuery(pg, `select * from public.labor_change_order_items_list ${inCo}`)
    await upsertByUuid(mssql, {
      table: 'labor_change_order_items_list',
      columns: ['uuid', 'corporation_uuid', 'project_uuid', 'purchase_order_uuid', 'change_order_uuid', 'order_index', 'cost_code_uuid', 'cost_code_number', 'cost_code_name', 'cost_code_label', 'division_name', 'location_uuid', 'location_label', 'po_amount', 'co_amount', 'description', 'metadata', 'is_active', 'created_at', 'updated_at'],
      dryRun,
      rows: labor.map((r) => ({
        uuid: uuidStr(r.uuid),
        corporation_uuid: remapCorp(lookups, r.corporation_uuid),
        project_uuid: uuidStr(r.project_uuid),
        purchase_order_uuid: uuidStr(r.purchase_order_uuid) || uuidStr(headers.find((h) => uuidStr(h.uuid) === uuidStr(r.change_order_uuid))?.original_purchase_order_uuid) || '',
        change_order_uuid: uuidStr(r.change_order_uuid),
        order_index: asNum(r.order_index) != null ? Math.trunc(asNum(r.order_index)) : 0,
        cost_code_uuid: remapMasterUuid(lookups, r.cost_code_uuid),
        cost_code_number: asStr(r.cost_code_number, 100),
        cost_code_name: asStr(r.cost_code_name, 255),
        cost_code_label: asStr(r.cost_code_label, 255),
        division_name: asStr(r.division_name, 255),
        location_uuid: remapMasterUuid(lookups, r.location_uuid),
        location_label: asStr(r.location_label, 255),
        po_amount: asNum(r.po_amount ?? r.labor_amount) ?? 0,
        co_amount: asNum(r.co_amount ?? r.labor_amount),
        description: asStr(r.description),
        metadata: stringifyJson(r.metadata),
        is_active: asBool(r.is_active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
      })),
    })
  }
  catch (e) { log(`labor CO: ${e.message}`) }

  try {
    const lwm = await pgQuery(pg, `select * from public.co_location_wise_material ${inCo}`)
    await upsertByUuid(mssql, {
      table: 'co_location_wise_material',
      columns: ['uuid', 'corporation_uuid', 'project_uuid', 'change_order_uuid', 'purchase_order_uuid', 'order_index', 'cost_code_uuid', 'cost_code_number', 'cost_code_name', 'cost_code_label', 'division_name', 'location_uuid', 'location_label', 'material_budgeted_amount', 'po_amount', 'co_amount', 'description', 'metadata', 'is_active', 'created_at', 'updated_at'],
      dryRun,
      rows: lwm.map((r) => ({
        uuid: uuidStr(r.uuid),
        corporation_uuid: remapCorp(lookups, r.corporation_uuid),
        project_uuid: uuidStr(r.project_uuid),
        change_order_uuid: uuidStr(r.change_order_uuid),
        purchase_order_uuid: uuidStr(r.purchase_order_uuid),
        order_index: asNum(r.order_index) != null ? Math.trunc(asNum(r.order_index)) : 0,
        cost_code_uuid: remapMasterUuid(lookups, r.cost_code_uuid),
        cost_code_number: asStr(r.cost_code_number, 100),
        cost_code_name: asStr(r.cost_code_name, 255),
        cost_code_label: asStr(r.cost_code_label, 255),
        division_name: asStr(r.division_name, 255),
        location_uuid: remapMasterUuid(lookups, r.location_uuid),
        location_label: asStr(r.location_label, 255),
        material_budgeted_amount: asNum(r.material_budgeted_amount),
        po_amount: asNum(r.po_amount ?? r.total) ?? 0,
        co_amount: asNum(r.co_amount ?? r.total),
        description: asStr(r.description),
        metadata: stringifyJson(r.metadata),
        is_active: asBool(r.is_active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
      })),
    })
  }
  catch (e) { log(`co LWM: ${e.message}`) }
}
