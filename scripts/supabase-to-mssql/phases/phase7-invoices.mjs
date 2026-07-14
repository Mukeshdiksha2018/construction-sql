import { pgQuery } from '../db.mjs'
import {
  approvalCheckJunctionRows,
  attachmentRowsFromJson,
  chargeRowsFromBreakdown,
  parseBreakdown,
  taxRowsFromBreakdown,
} from '../expandBlobs.mjs'
import { remapCoa, remapCorp, remapUom, remapVendor, remapMasterUuid } from '../lookups.mjs'
import { replaceChildren, upsertByUuid } from '../upsert.mjs'
import { asBool, asDate, asNum, asStr, log, stringifyJson, uuidStr } from '../utils.mjs'

function corpWhere(ctx, col) {
  const ids = ctx.corpFilter?.localUuids
  if (!ids?.length) return ''
  const list = ids.map((u) => `'${u.replace(/'/g, "''")}'`).join(',')
  return `where ${col}::text in (${list})`
}

/** @param {any} ctx */
export async function runPhase7VendorInvoices(ctx) {
  const { pg, mssql, lookups, dryRun } = ctx
  log('=== Phase 7: vendor invoices ===')

  const headers = await pgQuery(pg, `select * from public.vendor_invoices ${corpWhere(ctx, 'corporation_uuid')}`)
  await upsertByUuid(mssql, {
    table: 'vendor_invoices',
    columns: ['uuid', 'corporation_uuid', 'project_uuid', 'vendor_uuid', 'purchase_order_uuid', 'change_order_uuid', 'invoice_type', 'number', 'bill_date', 'due_date', 'credit_days', 'credit_days_id', 'amount', 'holdback', 'status', 'is_active', 'adjusted_against_vendor_invoice_uuid', 'adjusted_advance_payment_uuid', 'holdback_fully_paid', 'nimble_jeid', 'last_handled_approval_type', 'created_at', 'updated_at'],
    dryRun,
    rows: headers.map((r) => ({
      uuid: uuidStr(r.uuid),
      corporation_uuid: remapCorp(lookups, r.corporation_uuid),
      project_uuid: uuidStr(r.project_uuid),
      vendor_uuid: remapVendor(lookups, r.vendor_uuid),
      purchase_order_uuid: uuidStr(r.purchase_order_uuid),
      change_order_uuid: uuidStr(r.change_order_uuid),
      invoice_type: asStr(r.invoice_type, 50) || 'purchase_order',
      number: asStr(r.number, 100),
      bill_date: asDate(r.bill_date) || new Date(),
      due_date: asDate(r.due_date),
      credit_days: asStr(r.credit_days, 50),
      credit_days_id: asStr(r.credit_days_id, 100),
      amount: asNum(r.amount) ?? 0,
      holdback: asNum(r.holdback),
      status: asStr(r.status, 50) || 'Draft',
      is_active: asBool(r.is_active, true),
      adjusted_against_vendor_invoice_uuid: uuidStr(r.adjusted_against_vendor_invoice_uuid),
      adjusted_advance_payment_uuid: uuidStr(r.adjusted_advance_payment_uuid),
      holdback_fully_paid: r.holdback_fully_paid == null ? null : asBool(r.holdback_fully_paid),
      nimble_jeid: asStr(r.nimble_jeid, 100),
      last_handled_approval_type: asNum(r.last_handled_approval_type) != null ? Math.trunc(asNum(r.last_handled_approval_type)) : null,
      created_at: asDate(r.created_at),
      updated_at: asDate(r.updated_at) || new Date(),
    })),
  })

  const parentUuids = []
  const charges = []
  const taxes = []
  const attachments = []
  for (const r of headers) {
    const uuid = uuidStr(r.uuid)
    const corp = remapCorp(lookups, r.corporation_uuid)
    if (!uuid || !corp) continue
    parentUuids.push(uuid)
    const fb = parseBreakdown(r.financial_breakdown)
    if (fb) {
      charges.push(...chargeRowsFromBreakdown(fb, corp, uuid, 'vendor_invoice_uuid'))
      taxes.push(...taxRowsFromBreakdown(fb, corp, uuid, 'vendor_invoice_uuid'))
    }
    attachments.push(...attachmentRowsFromJson(r.attachments, corp, uuid, 'vendor_invoice_uuid'))
  }
  await replaceChildren(mssql, { table: 'vi_financial_charges', parentCol: 'vendor_invoice_uuid', parentUuids, columns: ['corporation_uuid', 'vendor_invoice_uuid', 'charge_key', 'percentage', 'amount', 'taxable'], rows: charges, dryRun })
  await replaceChildren(mssql, { table: 'vi_financial_taxes', parentCol: 'vendor_invoice_uuid', parentUuids, columns: ['corporation_uuid', 'vendor_invoice_uuid', 'tax_key', 'percentage', 'amount'], rows: taxes, dryRun })
  await replaceChildren(mssql, { table: 'vi_attachments', parentCol: 'vendor_invoice_uuid', parentUuids, columns: ['corporation_uuid', 'vendor_invoice_uuid', 'document_name', 'mime_type', 'file_size', 'file_url', 'uploaded_at', 'uploaded_by', 'sort_order', 'source_uuid'], rows: attachments, dryRun })

  const inVi = parentUuids.length ? `where vendor_invoice_uuid::text in (${parentUuids.map((u) => `'${u}'`).join(',')})` : (ctx.corpFilter ? 'where false' : '')

  await syncChildTable(pg, mssql, lookups, dryRun, 'direct_vendor_invoice_line_items', inVi, (r) => ({
    uuid: uuidStr(r.uuid),
    corporation_uuid: remapCorp(lookups, r.corporation_uuid),
    project_uuid: uuidStr(r.project_uuid),
    vendor_invoice_uuid: uuidStr(r.vendor_invoice_uuid),
    order_index: asNum(r.order_index) != null ? Math.trunc(asNum(r.order_index)) : 0,
    cost_code_uuid: remapMasterUuid(lookups, r.cost_code_uuid),
    cost_code_label: asStr(r.cost_code_label, 255),
    cost_code_number: asStr(r.cost_code_number, 100),
    cost_code_name: asStr(r.cost_code_name, 255),
    division_name: asStr(r.division_name, 255),
    sequence_uuid: uuidStr(r.sequence_uuid),
    item_uuid: uuidStr(r.item_uuid),
    item_name: asStr(r.item_name, 500),
    description: asStr(r.description),
    unit_price: asNum(r.unit_price),
    quantity: asNum(r.quantity),
    total: asNum(r.total),
    uom: asStr(r.uom, 100),
    unit_label: asStr(r.unit_label, 100),
    unit_uuid: remapUom(lookups, r.unit_uuid),
    gl_account_uuid: remapCoa(lookups, r.gl_account_uuid),
    metadata: stringifyJson(r.metadata),
    is_active: asBool(r.is_active, true),
    created_at: asDate(r.created_at),
    updated_at: asDate(r.updated_at) || new Date(),
  }), ['uuid', 'corporation_uuid', 'project_uuid', 'vendor_invoice_uuid', 'order_index', 'cost_code_uuid', 'cost_code_label', 'cost_code_number', 'cost_code_name', 'division_name', 'sequence_uuid', 'item_uuid', 'item_name', 'description', 'unit_price', 'quantity', 'total', 'uom', 'unit_label', 'unit_uuid', 'gl_account_uuid', 'metadata', 'is_active', 'created_at', 'updated_at'])

  await syncChildTable(pg, mssql, lookups, dryRun, 'purchase_order_invoice_items_list', inVi, (r) => ({
    uuid: uuidStr(r.uuid),
    corporation_uuid: remapCorp(lookups, r.corporation_uuid),
    project_uuid: uuidStr(r.project_uuid),
    purchase_order_uuid: uuidStr(r.purchase_order_uuid),
    vendor_invoice_uuid: uuidStr(r.vendor_invoice_uuid),
    order_index: asNum(r.order_index) != null ? Math.trunc(asNum(r.order_index)) : 0,
    po_item_uuid: uuidStr(r.po_item_uuid || r.source_item_uuid),
    cost_code_uuid: remapMasterUuid(lookups, r.cost_code_uuid),
    cost_code_label: asStr(r.cost_code_label, 255),
    cost_code_number: asStr(r.cost_code_number, 100),
    cost_code_name: asStr(r.cost_code_name, 255),
    division_name: asStr(r.division_name, 255),
    item_type_uuid: uuidStr(r.item_type_uuid),
    item_type_label: asStr(r.item_type_label, 255),
    item_uuid: uuidStr(r.item_uuid),
    item_name: asStr(r.item_name, 500),
    description: asStr(r.description),
    model_number: asStr(r.model_number, 255),
    location_uuid: remapMasterUuid(lookups, r.location_uuid),
    location_label: asStr(r.location_label, 255),
    unit_uuid: remapUom(lookups, r.unit_uuid),
    unit_label: asStr(r.unit_label, 100),
    invoice_quantity: asNum(r.invoice_quantity ?? r.quantity),
    invoice_unit_price: asNum(r.invoice_unit_price ?? r.unit_price),
    invoice_total: asNum(r.invoice_total ?? r.total),
    gl_account_uuid: remapCoa(lookups, r.gl_account_uuid),
    metadata: stringifyJson(r.metadata),
    is_active: asBool(r.is_active, true),
    created_at: asDate(r.created_at),
    updated_at: asDate(r.updated_at) || new Date(),
  }), ['uuid', 'corporation_uuid', 'project_uuid', 'purchase_order_uuid', 'vendor_invoice_uuid', 'order_index', 'po_item_uuid', 'cost_code_uuid', 'cost_code_label', 'cost_code_number', 'cost_code_name', 'division_name', 'item_type_uuid', 'item_type_label', 'item_uuid', 'item_name', 'description', 'model_number', 'location_uuid', 'location_label', 'unit_uuid', 'unit_label', 'invoice_quantity', 'invoice_unit_price', 'invoice_total', 'gl_account_uuid', 'metadata', 'is_active', 'created_at', 'updated_at'])

  await syncChildTable(pg, mssql, lookups, dryRun, 'change_order_invoice_items_list', inVi, (r) => ({
    uuid: uuidStr(r.uuid),
    corporation_uuid: remapCorp(lookups, r.corporation_uuid),
    project_uuid: uuidStr(r.project_uuid),
    change_order_uuid: uuidStr(r.change_order_uuid),
    vendor_invoice_uuid: uuidStr(r.vendor_invoice_uuid),
    order_index: asNum(r.order_index) != null ? Math.trunc(asNum(r.order_index)) : 0,
    co_item_uuid: uuidStr(r.co_item_uuid || r.source_item_uuid),
    cost_code_uuid: remapMasterUuid(lookups, r.cost_code_uuid),
    cost_code_label: asStr(r.cost_code_label, 255),
    cost_code_number: asStr(r.cost_code_number, 100),
    cost_code_name: asStr(r.cost_code_name, 255),
    division_name: asStr(r.division_name, 255),
    item_type_uuid: uuidStr(r.item_type_uuid),
    item_type_label: asStr(r.item_type_label, 255),
    item_uuid: uuidStr(r.item_uuid),
    item_name: asStr(r.item_name, 500),
    description: asStr(r.description),
    model_number: asStr(r.model_number, 255),
    location_uuid: remapMasterUuid(lookups, r.location_uuid),
    location_label: asStr(r.location_label, 255),
    unit_uuid: remapUom(lookups, r.unit_uuid),
    unit_label: asStr(r.unit_label, 100),
    invoice_quantity: asNum(r.invoice_quantity ?? r.quantity),
    invoice_unit_price: asNum(r.invoice_unit_price ?? r.unit_price),
    invoice_total: asNum(r.invoice_total ?? r.total),
    gl_account_uuid: remapCoa(lookups, r.gl_account_uuid),
    metadata: stringifyJson(r.metadata),
    is_active: asBool(r.is_active, true),
    created_at: asDate(r.created_at),
    updated_at: asDate(r.updated_at) || new Date(),
  }), ['uuid', 'corporation_uuid', 'project_uuid', 'change_order_uuid', 'vendor_invoice_uuid', 'order_index', 'co_item_uuid', 'cost_code_uuid', 'cost_code_label', 'cost_code_number', 'cost_code_name', 'division_name', 'item_type_uuid', 'item_type_label', 'item_uuid', 'item_name', 'description', 'model_number', 'location_uuid', 'location_label', 'unit_uuid', 'unit_label', 'invoice_quantity', 'invoice_unit_price', 'invoice_total', 'gl_account_uuid', 'metadata', 'is_active', 'created_at', 'updated_at'])

  await syncChildTable(pg, mssql, lookups, dryRun, 'po_lwm_invoice_items', inVi, (r) => ({
    uuid: uuidStr(r.uuid),
    corporation_uuid: remapCorp(lookups, r.corporation_uuid),
    project_uuid: uuidStr(r.project_uuid),
    purchase_order_uuid: uuidStr(r.purchase_order_uuid),
    vendor_invoice_uuid: uuidStr(r.vendor_invoice_uuid),
    order_index: asNum(r.order_index) != null ? Math.trunc(asNum(r.order_index)) : 0,
    po_lwm_uuid: uuidStr(r.po_lwm_uuid || r.source_item_uuid),
    cost_code_uuid: remapMasterUuid(lookups, r.cost_code_uuid),
    cost_code_number: asStr(r.cost_code_number, 100),
    cost_code_name: asStr(r.cost_code_name, 255),
    cost_code_label: asStr(r.cost_code_label, 255),
    division_name: asStr(r.division_name, 255),
    location_uuid: remapMasterUuid(lookups, r.location_uuid),
    location_label: asStr(r.location_label, 255),
    material_budgeted_amount: asNum(r.material_budgeted_amount),
    po_amount: asNum(r.po_amount),
    invoice_amount: asNum(r.invoice_amount ?? r.total ?? r.amount),
    description: asStr(r.description),
    metadata: stringifyJson(r.metadata),
    is_active: asBool(r.is_active, true),
    created_at: asDate(r.created_at),
    updated_at: asDate(r.updated_at) || new Date(),
  }), ['uuid', 'corporation_uuid', 'project_uuid', 'purchase_order_uuid', 'vendor_invoice_uuid', 'order_index', 'po_lwm_uuid', 'cost_code_uuid', 'cost_code_number', 'cost_code_name', 'cost_code_label', 'division_name', 'location_uuid', 'location_label', 'material_budgeted_amount', 'po_amount', 'invoice_amount', 'description', 'metadata', 'is_active', 'created_at', 'updated_at'])

  await syncChildTable(pg, mssql, lookups, dryRun, 'co_lwm_invoice_items', inVi, (r) => ({
    uuid: uuidStr(r.uuid),
    corporation_uuid: remapCorp(lookups, r.corporation_uuid),
    project_uuid: uuidStr(r.project_uuid),
    change_order_uuid: uuidStr(r.change_order_uuid),
    purchase_order_uuid: uuidStr(r.purchase_order_uuid),
    vendor_invoice_uuid: uuidStr(r.vendor_invoice_uuid),
    order_index: asNum(r.order_index) != null ? Math.trunc(asNum(r.order_index)) : 0,
    co_lwm_uuid: uuidStr(r.co_lwm_uuid || r.source_item_uuid),
    cost_code_uuid: remapMasterUuid(lookups, r.cost_code_uuid),
    cost_code_number: asStr(r.cost_code_number, 100),
    cost_code_name: asStr(r.cost_code_name, 255),
    cost_code_label: asStr(r.cost_code_label, 255),
    division_name: asStr(r.division_name, 255),
    location_uuid: remapMasterUuid(lookups, r.location_uuid),
    location_label: asStr(r.location_label, 255),
    material_budgeted_amount: asNum(r.material_budgeted_amount),
    co_amount: asNum(r.co_amount),
    invoice_amount: asNum(r.invoice_amount ?? r.total ?? r.amount),
    description: asStr(r.description),
    metadata: stringifyJson(r.metadata),
    is_active: asBool(r.is_active, true),
    created_at: asDate(r.created_at),
    updated_at: asDate(r.updated_at) || new Date(),
  }), ['uuid', 'corporation_uuid', 'project_uuid', 'change_order_uuid', 'purchase_order_uuid', 'vendor_invoice_uuid', 'order_index', 'co_lwm_uuid', 'cost_code_uuid', 'cost_code_number', 'cost_code_name', 'cost_code_label', 'division_name', 'location_uuid', 'location_label', 'material_budgeted_amount', 'co_amount', 'invoice_amount', 'description', 'metadata', 'is_active', 'created_at', 'updated_at'])

  try {
    const labor = await pgQuery(pg, `select * from public.labor_invoice_items_list ${inVi}`)
    await upsertByUuid(mssql, {
      table: 'labor_invoice_items_list',
      columns: ['uuid', 'corporation_uuid', 'project_uuid', 'vendor_invoice_uuid', 'purchase_order_uuid', 'change_order_uuid', 'order_index', 'labor_po_item_uuid', 'labor_co_item_uuid', 'cost_code_uuid', 'cost_code_label', 'cost_code_number', 'cost_code_name', 'division_name', 'invoice_amount', 'gl_account_uuid', 'approval_checks', 'metadata', 'is_active', 'created_at', 'updated_at'],
      dryRun,
      rows: labor.map((r) => ({
        uuid: uuidStr(r.uuid),
        corporation_uuid: remapCorp(lookups, r.corporation_uuid),
        project_uuid: uuidStr(r.project_uuid),
        vendor_invoice_uuid: uuidStr(r.vendor_invoice_uuid),
        purchase_order_uuid: uuidStr(r.purchase_order_uuid),
        change_order_uuid: uuidStr(r.change_order_uuid),
        order_index: asNum(r.order_index) != null ? Math.trunc(asNum(r.order_index)) : 0,
        labor_po_item_uuid: uuidStr(r.labor_po_item_uuid),
        labor_co_item_uuid: uuidStr(r.labor_co_item_uuid),
        cost_code_uuid: remapMasterUuid(lookups, r.cost_code_uuid),
        cost_code_label: asStr(r.cost_code_label, 255),
        cost_code_number: asStr(r.cost_code_number, 100),
        cost_code_name: asStr(r.cost_code_name, 255),
        division_name: asStr(r.division_name, 255),
        invoice_amount: asNum(r.invoice_amount ?? r.labor_amount),
        gl_account_uuid: remapCoa(lookups, r.gl_account_uuid),
        approval_checks: stringifyJson(r.approval_checks || r.approval_checks_uuids),
        metadata: stringifyJson(r.metadata),
        is_active: asBool(r.is_active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
      })),
    })
    const appr = []
    const parents = []
    for (const r of labor) {
      const uuid = uuidStr(r.uuid)
      const corp = remapCorp(lookups, r.corporation_uuid) || ''
      if (!uuid) continue
      parents.push(uuid)
      appr.push(...approvalCheckJunctionRows(r.approval_checks || r.approval_checks_uuids, corp, uuid, 'labor_invoice_item_uuid', lookups))
    }
    await replaceChildren(mssql, {
      table: 'labor_invoice_approval_checks',
      parentCol: 'labor_invoice_item_uuid',
      parentUuids: parents,
      columns: ['labor_invoice_item_uuid', 'approval_check_uuid'],
      rows: appr,
      dryRun,
    })
  }
  catch (e) { log(`labor invoice items: ${e.message}`) }

  await syncChildTable(pg, mssql, lookups, dryRun, 'advance_payment_cost_codes', inVi, (r) => ({
    uuid: uuidStr(r.uuid),
    vendor_invoice_uuid: uuidStr(r.vendor_invoice_uuid),
    corporation_uuid: remapCorp(lookups, r.corporation_uuid),
    project_uuid: uuidStr(r.project_uuid),
    vendor_uuid: remapVendor(lookups, r.vendor_uuid),
    purchase_order_uuid: uuidStr(r.purchase_order_uuid),
    change_order_uuid: uuidStr(r.change_order_uuid),
    cost_code_uuid: remapMasterUuid(lookups, r.cost_code_uuid),
    gl_account_uuid: remapCoa(lookups, r.gl_account_uuid),
    cost_code_label: asStr(r.cost_code_label, 255),
    cost_code_number: asStr(r.cost_code_number, 100),
    cost_code_name: asStr(r.cost_code_name, 255),
    total_amount: asNum(r.total_amount ?? r.amount),
    advance_amount: asNum(r.advance_amount ?? r.amount) ?? 0,
    metadata: stringifyJson(r.metadata),
    is_removed: asBool(r.is_removed, false),
    removed_at: asDate(r.removed_at),
    is_active: asBool(r.is_active, true),
    created_at: asDate(r.created_at),
    updated_at: asDate(r.updated_at) || new Date(),
  }), ['uuid', 'vendor_invoice_uuid', 'corporation_uuid', 'project_uuid', 'vendor_uuid', 'purchase_order_uuid', 'change_order_uuid', 'cost_code_uuid', 'gl_account_uuid', 'cost_code_label', 'cost_code_number', 'cost_code_name', 'total_amount', 'advance_amount', 'metadata', 'is_removed', 'removed_at', 'is_active', 'created_at', 'updated_at'])

  await syncChildTable(pg, mssql, lookups, dryRun, 'holdback_cost_codes', inVi, (r) => ({
    uuid: uuidStr(r.uuid),
    vendor_invoice_uuid: uuidStr(r.vendor_invoice_uuid),
    corporation_uuid: remapCorp(lookups, r.corporation_uuid),
    project_uuid: uuidStr(r.project_uuid),
    vendor_uuid: remapVendor(lookups, r.vendor_uuid),
    purchase_order_uuid: uuidStr(r.purchase_order_uuid),
    change_order_uuid: uuidStr(r.change_order_uuid),
    holdback_invoice_uuid: uuidStr(r.holdback_invoice_uuid),
    cost_code_uuid: remapMasterUuid(lookups, r.cost_code_uuid),
    gl_account_uuid: remapCoa(lookups, r.gl_account_uuid),
    cost_code_label: asStr(r.cost_code_label, 255),
    cost_code_number: asStr(r.cost_code_number, 100),
    cost_code_name: asStr(r.cost_code_name, 255),
    total_amount: asNum(r.total_amount ?? r.amount),
    retainage_amount: asNum(r.retainage_amount),
    release_amount: asNum(r.release_amount),
    metadata: stringifyJson(r.metadata),
    is_active: asBool(r.is_active, true),
    created_at: asDate(r.created_at),
    updated_at: asDate(r.updated_at) || new Date(),
  }), ['uuid', 'vendor_invoice_uuid', 'corporation_uuid', 'project_uuid', 'vendor_uuid', 'purchase_order_uuid', 'change_order_uuid', 'holdback_invoice_uuid', 'cost_code_uuid', 'gl_account_uuid', 'cost_code_label', 'cost_code_number', 'cost_code_name', 'total_amount', 'retainage_amount', 'release_amount', 'metadata', 'is_active', 'created_at', 'updated_at'])

  await syncChildTable(pg, mssql, lookups, dryRun, 'adjusted_advance_payment_cost_codes', inVi, (r) => ({
    uuid: uuidStr(r.uuid),
    vendor_invoice_uuid: uuidStr(r.vendor_invoice_uuid),
    advance_payment_uuid: uuidStr(r.advance_payment_uuid) || '',
    corporation_uuid: remapCorp(lookups, r.corporation_uuid),
    project_uuid: uuidStr(r.project_uuid),
    purchase_order_uuid: uuidStr(r.purchase_order_uuid),
    change_order_uuid: uuidStr(r.change_order_uuid),
    cost_code_uuid: remapMasterUuid(lookups, r.cost_code_uuid),
    cost_code_label: asStr(r.cost_code_label, 255),
    cost_code_number: asStr(r.cost_code_number, 100),
    cost_code_name: asStr(r.cost_code_name, 255),
    adjusted_amount: asNum(r.adjusted_amount ?? r.amount) ?? 0,
    metadata: stringifyJson(r.metadata),
    is_active: asBool(r.is_active, true),
    created_at: asDate(r.created_at),
    updated_at: asDate(r.updated_at) || new Date(),
  }), ['uuid', 'vendor_invoice_uuid', 'advance_payment_uuid', 'corporation_uuid', 'project_uuid', 'purchase_order_uuid', 'change_order_uuid', 'cost_code_uuid', 'cost_code_label', 'cost_code_number', 'cost_code_name', 'adjusted_amount', 'metadata', 'is_active', 'created_at', 'updated_at'])

  await syncChildTable(pg, mssql, lookups, dryRun, 'vendor_invoice_holdback_coa_breakdown', inVi, (r) => ({
    uuid: uuidStr(r.uuid),
    corporation_uuid: remapCorp(lookups, r.corporation_uuid),
    project_uuid: uuidStr(r.project_uuid),
    vendor_uuid: remapVendor(lookups, r.vendor_uuid),
    vendor_invoice_uuid: uuidStr(r.vendor_invoice_uuid),
    purchase_order_uuid: uuidStr(r.purchase_order_uuid),
    change_order_uuid: uuidStr(r.change_order_uuid),
    cost_code_uuid: remapMasterUuid(lookups, r.cost_code_uuid),
    cost_code_label: asStr(r.cost_code_label, 255),
    cost_code_number: asStr(r.cost_code_number, 100),
    cost_code_name: asStr(r.cost_code_name, 255),
    gl_account_uuid: remapCoa(lookups, r.gl_account_uuid),
    holdback_amount: asNum(r.holdback_amount ?? r.amount),
    sort_order: asNum(r.sort_order) != null ? Math.trunc(asNum(r.sort_order)) : 0,
    metadata: stringifyJson(r.metadata),
    created_at: asDate(r.created_at),
    updated_at: asDate(r.updated_at) || new Date(),
  }), ['uuid', 'corporation_uuid', 'project_uuid', 'vendor_uuid', 'vendor_invoice_uuid', 'purchase_order_uuid', 'change_order_uuid', 'cost_code_uuid', 'cost_code_label', 'cost_code_number', 'cost_code_name', 'gl_account_uuid', 'holdback_amount', 'sort_order', 'metadata', 'created_at', 'updated_at'])

  await syncChildTable(pg, mssql, lookups, dryRun, 'vendor_invoice_coa_assignments', inVi, (r) => ({
    uuid: uuidStr(r.uuid),
    corporation_uuid: remapCorp(lookups, r.corporation_uuid),
    vendor_invoice_uuid: uuidStr(r.vendor_invoice_uuid),
    gl_account_uuid: remapCoa(lookups, r.gl_account_uuid),
    segment: asStr(r.segment, 255) || 'default',
    created_at: asDate(r.created_at),
    updated_at: asDate(r.updated_at) || new Date(),
  }), ['uuid', 'corporation_uuid', 'vendor_invoice_uuid', 'gl_account_uuid', 'segment', 'created_at', 'updated_at'])
}

async function syncChildTable(pg, mssql, lookups, dryRun, table, where, mapRow, columns) {
  try {
    const rows = await pgQuery(pg, `select * from public.${table} ${where}`)
    await upsertByUuid(mssql, { table, columns, dryRun, rows: rows.map(mapRow) })
  }
  catch (e) {
    log(`${table}: ${e.message}`)
  }
}
