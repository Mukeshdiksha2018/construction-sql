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
import { asBool, asDate, asNum, asStr, log, parseJson, stringifyJson, uuidStr } from '../utils.mjs'

function corpWhere(ctx, col) {
  const ids = ctx.corpFilter?.localUuids
  if (!ids?.length) return ''
  const list = ids.map((u) => `'${u.replace(/'/g, "''")}'`).join(',')
  return `where ${col}::text in (${list})`
}

/** @param {any} ctx */
export async function runPhase4PurchaseOrders(ctx) {
  const { pg, mssql, lookups, dryRun } = ctx
  log('=== Phase 4: purchase orders ===')

  const headers = await pgQuery(pg, `
    select * from public.purchase_order_forms
    ${corpWhere(ctx, 'corporation_uuid')}`)

  await upsertByUuid(mssql, {
    table: 'purchase_order_forms',
    columns: ['uuid', 'corporation_uuid', 'project_uuid', 'po_number', 'entry_date', 'po_type', 'credit_days', 'credit_days_id', 'ship_via', 'freight', 'shipping_instructions', 'estimated_delivery_date', 'include_items', 'quote_reference', 'terms_and_conditions', 'item_total', 'charges_total', 'tax_total', 'total_po_amount', 'vendor_uuid', 'billing_address_uuid', 'shipping_address_uuid', 'status', 'prepared_by', 'approved_by', 'approved_at', 'print_include_approved_by_vendor', 'print_use_entity_name', 'special_instruction_uuid', 'currency_conversion_enabled', 'currency_from', 'currency_to', 'conversion_rate', 'last_handled_approval_type', 'is_active', 'created_at', 'updated_at'],
    dryRun,
    rows: headers.map((r) => mapPoHeader(r, lookups)),
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
      charges.push(...chargeRowsFromBreakdown(fb, corp, uuid, 'purchase_order_uuid'))
      taxes.push(...taxRowsFromBreakdown(fb, corp, uuid, 'purchase_order_uuid'))
    }
    attachments.push(...attachmentRowsFromJson(r.attachments, corp, uuid, 'purchase_order_uuid'))
    audits.push(...auditRowsFromJson(r.audit_log, corp, uuid, 'purchase_order_uuid'))
    removed.push(...removedItemRowsFromJson(r.removed_po_items, corp, uuid, 'purchase_order_uuid'))
  }
  await replaceChildren(mssql, { table: 'po_financial_charges', parentCol: 'purchase_order_uuid', parentUuids, columns: ['corporation_uuid', 'purchase_order_uuid', 'charge_key', 'percentage', 'amount', 'taxable'], rows: charges, dryRun })
  await replaceChildren(mssql, { table: 'po_financial_taxes', parentCol: 'purchase_order_uuid', parentUuids, columns: ['corporation_uuid', 'purchase_order_uuid', 'tax_key', 'percentage', 'amount'], rows: taxes, dryRun })
  await replaceChildren(mssql, { table: 'po_attachments', parentCol: 'purchase_order_uuid', parentUuids, columns: ['corporation_uuid', 'purchase_order_uuid', 'document_name', 'mime_type', 'file_size', 'file_url', 'uploaded_at', 'uploaded_by', 'sort_order', 'source_uuid'], rows: attachments, dryRun })
  await replaceChildren(mssql, { table: 'po_audit_events', parentCol: 'purchase_order_uuid', parentUuids, columns: ['corporation_uuid', 'purchase_order_uuid', 'event_type', 'payload', 'created_by', 'event_at'], rows: audits, dryRun })
  await replaceChildren(mssql, { table: 'po_removed_items', parentCol: 'purchase_order_uuid', parentUuids, columns: ['corporation_uuid', 'purchase_order_uuid', 'item_uuid', 'cost_code_uuid', 'location_uuid', 'source_item_uuid', 'item_snapshot', 'removed_at'], rows: removed, dryRun })

  const inPo = parentUuids.length ? `where purchase_order_uuid::text in (${parentUuids.map((u) => `'${u}'`).join(',')})` : (ctx.corpFilter ? 'where false' : '')

  const headerCorpByUuid = new Map(
    headers.map((h) => [uuidStr(h.uuid), remapCorp(lookups, h.corporation_uuid)]).filter(([u, c]) => u && c),
  )
  const items = await pgQuery(pg, `select * from public.purchase_order_items_list ${inPo}`)
  await upsertByUuid(mssql, {
    table: 'purchase_order_items_list',
    columns: ['uuid', 'corporation_uuid', 'project_uuid', 'purchase_order_uuid', 'order_index', 'source', 'cost_code_uuid', 'cost_code_label', 'cost_code_number', 'cost_code_name', 'division_name', 'category', 'item_division_uuid', 'item_type_uuid', 'item_type_label', 'item_uuid', 'item_name', 'description', 'model_number', 'location_uuid', 'location_label', 'unit_uuid', 'unit_label', 'quantity', 'unit_price', 'po_quantity', 'po_unit_price', 'po_total', 'total', 'approval_checks_uuids', 'receipt_note_uuids', 'configuration_name', 'metadata', 'is_removed', 'removed_at', 'is_active', 'created_at', 'updated_at'],
    dryRun,
    rows: items.map((r) => mapPoItem(r, lookups, headerCorpByUuid.get(uuidStr(r.purchase_order_uuid)) || null)),
  })

  const appr = []
  const rcpt = []
  const itemParents = []
  for (const r of items) {
    const uuid = uuidStr(r.uuid)
    if (!uuid) continue
    itemParents.push(uuid)
    appr.push(...approvalCheckJunctionRows(r.approval_checks_uuids, '', uuid, 'purchase_order_item_uuid', lookups))
    rcpt.push(...receiptNoteJunctionRows(r.receipt_note_uuids, '', uuid, 'purchase_order_item_uuid'))
  }
  await replaceChildren(mssql, { table: 'po_item_approval_checks', parentCol: 'purchase_order_item_uuid', parentUuids: itemParents, columns: ['purchase_order_item_uuid', 'approval_check_uuid'], rows: appr, dryRun })
  await replaceChildren(mssql, { table: 'po_item_receipt_notes', parentCol: 'purchase_order_item_uuid', parentUuids: itemParents, columns: ['purchase_order_item_uuid', 'receipt_note_uuid'], rows: rcpt, dryRun })

  try {
    const labor = await pgQuery(pg, `select * from public.labor_purchase_order_items_list ${inPo}`)
    await upsertByUuid(mssql, {
      table: 'labor_purchase_order_items_list',
      columns: ['uuid', 'corporation_uuid', 'project_uuid', 'purchase_order_uuid', 'order_index', 'cost_code_uuid', 'cost_code_label', 'cost_code_number', 'cost_code_name', 'division_name', 'location_uuid', 'location_label', 'labor_budgeted_amount', 'po_amount', 'prior_committed_po_amount', 'description', 'metadata', 'is_removed', 'removed_at', 'is_active', 'created_at', 'updated_at'],
      dryRun,
      rows: labor.map((r) => mapLaborPo(r, lookups, headerCorpByUuid.get(uuidStr(r.purchase_order_uuid)) || null)),
    })
  }
  catch (e) { log(`labor PO items: ${e.message}`) }

  try {
    const lwm = await pgQuery(pg, `select * from public.po_location_wise_material ${inPo}`)
    await upsertByUuid(mssql, {
      table: 'po_location_wise_material',
      columns: ['uuid', 'corporation_uuid', 'project_uuid', 'purchase_order_uuid', 'order_index', 'cost_code_uuid', 'cost_code_label', 'cost_code_number', 'cost_code_name', 'division_name', 'location_uuid', 'location_label', 'material_budgeted_amount', 'po_amount', 'description', 'metadata', 'is_removed', 'removed_at', 'is_active', 'created_at', 'updated_at'],
      dryRun,
      rows: lwm.map((r) => ({
        uuid: uuidStr(r.uuid),
        corporation_uuid: remapCorp(lookups, r.corporation_uuid),
        project_uuid: uuidStr(r.project_uuid),
        purchase_order_uuid: uuidStr(r.purchase_order_uuid),
        order_index: asNum(r.order_index) != null ? Math.trunc(asNum(r.order_index)) : 0,
        cost_code_uuid: remapMasterUuid(lookups, r.cost_code_uuid),
        cost_code_label: asStr(r.cost_code_label, 255),
        cost_code_number: asStr(r.cost_code_number, 100),
        cost_code_name: asStr(r.cost_code_name, 255),
        division_name: asStr(r.division_name, 255),
        location_uuid: remapMasterUuid(lookups, r.location_uuid),
        location_label: asStr(r.location_label, 255),
        material_budgeted_amount: asNum(r.material_budgeted_amount),
        po_amount: asNum(r.po_amount ?? r.total) ?? 0,
        description: asStr(r.description),
        metadata: stringifyJson(r.metadata),
        is_removed: asBool(r.is_removed, false),
        removed_at: asDate(r.removed_at),
        is_active: asBool(r.is_active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
      })),
    })
  }
  catch (e) { log(`po LWM: ${e.message}`) }
}

function mapPoHeader(r, lookups) {
  return {
    uuid: uuidStr(r.uuid),
    corporation_uuid: remapCorp(lookups, r.corporation_uuid),
    project_uuid: uuidStr(r.project_uuid),
    po_number: asStr(r.po_number, 100),
    entry_date: asDate(r.entry_date),
    po_type: asStr(r.po_type, 20),
    credit_days: asStr(r.credit_days, 100),
    credit_days_id: asStr(r.credit_days_id, 100),
    ship_via: remapShipVia(lookups, r.ship_via_uuid || r.ship_via),
    freight: remapMasterUuid(lookups, r.freight_uuid || r.freight) || asStr(r.freight, 255),
    shipping_instructions: asStr(r.shipping_instructions),
    estimated_delivery_date: asDate(r.estimated_delivery_date),
    include_items: asStr(r.include_items),
    quote_reference: asStr(r.quote_reference, 255),
    terms_and_conditions: asStr(r.terms_and_conditions),
    item_total: asNum(r.item_total),
    charges_total: asNum(r.charges_total),
    tax_total: asNum(r.tax_total),
    total_po_amount: asNum(r.total_po_amount),
    vendor_uuid: remapVendor(lookups, r.vendor_uuid),
    billing_address_uuid: uuidStr(r.billing_address_uuid),
    shipping_address_uuid: uuidStr(r.shipping_address_uuid),
    status: asStr(r.status, 50) || 'Draft',
    prepared_by: asStr(r.prepared_by, 255),
    approved_by: asStr(r.approved_by, 255),
    approved_at: asDate(r.approved_at),
    print_include_approved_by_vendor: r.print_include_approved_by_vendor == null ? null : asBool(r.print_include_approved_by_vendor),
    print_use_entity_name: r.print_use_entity_name == null ? null : asBool(r.print_use_entity_name),
    special_instruction_uuid: uuidStr(r.special_instruction_uuid),
    currency_conversion_enabled: asBool(r.currency_conversion_enabled, false),
    currency_from: asStr(r.currency_from, 10),
    currency_to: asStr(r.currency_to, 10),
    conversion_rate: asNum(r.conversion_rate),
    last_handled_approval_type: asNum(r.last_handled_approval_type) != null ? Math.trunc(asNum(r.last_handled_approval_type)) : null,
    is_active: asBool(r.is_active, true),
    created_at: asDate(r.created_at),
    updated_at: asDate(r.updated_at) || new Date(),
  }
}

function mapPoItem(r, lookups, headerCorp = null) {
  return {
    uuid: uuidStr(r.uuid),
    corporation_uuid: remapCorp(lookups, r.corporation_uuid) || headerCorp,
    project_uuid: uuidStr(r.project_uuid),
    purchase_order_uuid: uuidStr(r.purchase_order_uuid),
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
    po_quantity: asNum(r.po_quantity),
    po_unit_price: asNum(r.po_unit_price),
    po_total: asNum(r.po_total),
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
  }
}

function mapLaborPo(r, lookups, headerCorp = null) {
  const meta = parseJson(r.metadata, {}) || {}
  return {
    uuid: uuidStr(r.uuid),
    corporation_uuid: remapCorp(lookups, r.corporation_uuid) || headerCorp,
    project_uuid: uuidStr(r.project_uuid),
    purchase_order_uuid: uuidStr(r.purchase_order_uuid),
    order_index: asNum(r.order_index) != null ? Math.trunc(asNum(r.order_index)) : 0,
    cost_code_uuid: remapMasterUuid(lookups, r.cost_code_uuid),
    cost_code_label: asStr(r.cost_code_label, 255),
    cost_code_number: asStr(r.cost_code_number, 100),
    cost_code_name: asStr(r.cost_code_name, 255),
    division_name: asStr(r.division_name, 255),
    location_uuid: remapMasterUuid(lookups, r.location_uuid),
    location_label: asStr(r.location_label, 255),
    labor_budgeted_amount: asNum(r.labor_budgeted_amount),
    po_amount: asNum(r.po_amount ?? r.labor_amount) ?? 0,
    prior_committed_po_amount: asNum(r.prior_committed_po_amount ?? meta.prior_committed_po_amount),
    description: asStr(r.description),
    metadata: stringifyJson(r.metadata),
    is_removed: asBool(r.is_removed, false),
    removed_at: asDate(r.removed_at),
    is_active: asBool(r.is_active, true),
    created_at: asDate(r.created_at),
    updated_at: asDate(r.updated_at) || new Date(),
  }
}
