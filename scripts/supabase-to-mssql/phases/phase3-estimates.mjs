import { pgQuery } from '../db.mjs'
import {
  attachmentRowsFromJson,
  auditRowsFromJson,
  removedCostCodeRows,
} from '../expandBlobs.mjs'
import { remapCorp, remapUom, remapVendor } from '../lookups.mjs'
import { replaceChildren, upsertByUuid } from '../upsert.mjs'
import { asBool, asDate, asNum, asStr, log, stringifyJson, uuidStr } from '../utils.mjs'

function corpWhere(ctx, col) {
  const ids = ctx.corpFilter?.localUuids
  if (!ids?.length) return ''
  const list = ids.map((u) => `'${u.replace(/'/g, "''")}'`).join(',')
  return `where ${col}::text in (${list})`
}

/** @param {any} ctx */
export async function runPhase3Estimates(ctx) {
  const { pg, mssql, lookups, dryRun } = ctx
  log('=== Phase 3: estimates ===')

  const estimates = await pgQuery(pg, `
    select uuid::text as uuid, corporation_uuid::text as corporation_uuid,
           project_uuid::text as project_uuid, estimate_number, estimate_date, valid_until,
           status, total_amount, tax_amount, discount_amount, final_amount, notes,
           attachments, audit_log, removed_cost_code_uuids,
           created_by, approved_by, approved_at, last_handled_approval_type,
           is_active, created_at, updated_at
    from public.estimates
    ${corpWhere(ctx, 'corporation_uuid')}`)

  await upsertByUuid(mssql, {
    table: 'estimates',
    columns: ['uuid', 'corporation_uuid', 'project_uuid', 'estimate_number', 'estimate_date', 'valid_until', 'status', 'total_amount', 'tax_amount', 'discount_amount', 'final_amount', 'notes', 'created_by', 'approved_by', 'approved_at', 'last_handled_approval_type', 'is_active', 'created_at', 'updated_at'],
    dryRun,
    rows: estimates.map((r) => ({
      uuid: uuidStr(r.uuid),
      corporation_uuid: remapCorp(lookups, r.corporation_uuid),
      project_uuid: uuidStr(r.project_uuid),
      estimate_number: asStr(r.estimate_number, 100) || '',
      estimate_date: asDate(r.estimate_date),
      valid_until: asDate(r.valid_until),
      status: asStr(r.status, 50) || 'Draft',
      total_amount: asNum(r.total_amount) ?? 0,
      tax_amount: asNum(r.tax_amount) ?? 0,
      discount_amount: asNum(r.discount_amount) ?? 0,
      final_amount: asNum(r.final_amount) ?? 0,
      notes: asStr(r.notes),
      created_by: asStr(r.created_by, 128),
      approved_by: asStr(r.approved_by, 128),
      approved_at: asDate(r.approved_at),
      last_handled_approval_type: asNum(r.last_handled_approval_type) != null ? Math.trunc(asNum(r.last_handled_approval_type)) : null,
      is_active: asBool(r.is_active, true),
      created_at: asDate(r.created_at),
      updated_at: asDate(r.updated_at) || new Date(),
    })),
  })

  const parentUuids = []
  const att = []
  const aud = []
  const rem = []
  for (const r of estimates) {
    const uuid = uuidStr(r.uuid)
    const corp = remapCorp(lookups, r.corporation_uuid)
    if (!uuid || !corp) continue
    parentUuids.push(uuid)
    att.push(...attachmentRowsFromJson(r.attachments, corp, uuid, 'estimate_uuid'))
    aud.push(...auditRowsFromJson(r.audit_log, corp, uuid, 'estimate_uuid'))
    rem.push(...removedCostCodeRows(r.removed_cost_code_uuids, corp, uuid))
  }
  await replaceChildren(mssql, { table: 'estimate_attachments', parentCol: 'estimate_uuid', parentUuids, columns: ['corporation_uuid', 'estimate_uuid', 'document_name', 'mime_type', 'file_size', 'file_url', 'uploaded_at', 'uploaded_by', 'sort_order', 'source_uuid'], rows: att, dryRun })
  await replaceChildren(mssql, { table: 'estimate_audit_events', parentCol: 'estimate_uuid', parentUuids, columns: ['corporation_uuid', 'estimate_uuid', 'event_type', 'payload', 'created_by', 'event_at'], rows: aud, dryRun })
  await replaceChildren(mssql, { table: 'estimate_removed_cost_codes', parentCol: 'estimate_uuid', parentUuids, columns: ['corporation_uuid', 'estimate_uuid', 'cost_code_uuid'], rows: rem, dryRun })

  const estList = parentUuids.length ? `where estimate_uuid::text in (${parentUuids.map((u) => `'${u}'`).join(',')})` : (ctx.corpFilter ? 'where false' : '')

  {
    const rows = await pgQuery(pg, `
      select uuid::text as uuid, corporation_uuid::text as corporation_uuid,
             project_uuid::text as project_uuid, estimate_uuid::text as estimate_uuid,
             cost_code_uuid::text as cost_code_uuid, cost_code_number, cost_code_name, division_name,
             description, is_sub_cost_code, labor_estimation_type, labor_amount,
             labor_amount_per_room, labor_rooms_count, labor_amount_per_sqft, labor_sq_ft_count,
             labor_number_of_hours, labor_hourly_wage, material_amount, contingency_amount,
             total_amount, metadata, created_at, updated_at
      from public.estimate_line_items ${estList}`)
    await upsertByUuid(mssql, {
      table: 'estimate_line_items',
      columns: ['uuid', 'corporation_uuid', 'project_uuid', 'estimate_uuid', 'cost_code_uuid', 'cost_code_number', 'cost_code_name', 'division_name', 'description', 'is_sub_cost_code', 'labor_estimation_type', 'labor_amount', 'labor_amount_per_room', 'labor_rooms_count', 'labor_amount_per_sqft', 'labor_sq_ft_count', 'labor_number_of_hours', 'labor_hourly_wage', 'material_amount', 'contingency_amount', 'total_amount', 'metadata', 'created_at', 'updated_at'],
      dryRun,
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        corporation_uuid: remapCorp(lookups, r.corporation_uuid),
        project_uuid: uuidStr(r.project_uuid),
        estimate_uuid: uuidStr(r.estimate_uuid),
        cost_code_uuid: uuidStr(r.cost_code_uuid),
        cost_code_number: asStr(r.cost_code_number, 100),
        cost_code_name: asStr(r.cost_code_name, 255),
        division_name: asStr(r.division_name, 255),
        description: asStr(r.description),
        is_sub_cost_code: asBool(r.is_sub_cost_code, false),
        labor_estimation_type: asStr(r.labor_estimation_type, 50),
        labor_amount: asNum(r.labor_amount) ?? 0,
        labor_amount_per_room: asNum(r.labor_amount_per_room) ?? 0,
        labor_rooms_count: asNum(r.labor_rooms_count) != null ? Math.trunc(asNum(r.labor_rooms_count)) : 0,
        labor_amount_per_sqft: asNum(r.labor_amount_per_sqft) ?? 0,
        labor_sq_ft_count: asNum(r.labor_sq_ft_count) != null ? Math.trunc(asNum(r.labor_sq_ft_count)) : 0,
        labor_number_of_hours: asNum(r.labor_number_of_hours) ?? 0,
        labor_hourly_wage: asNum(r.labor_hourly_wage) ?? 0,
        material_amount: asNum(r.material_amount) ?? 0,
        contingency_amount: asNum(r.contingency_amount) ?? 0,
        total_amount: asNum(r.total_amount) ?? 0,
        metadata: stringifyJson(r.metadata),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
      })),
    })
  }

  {
    const rows = await pgQuery(pg, `
      select uuid::text as uuid, corporation_uuid::text as corporation_uuid,
             project_uuid::text as project_uuid, estimate_uuid::text as estimate_uuid,
             cost_code_uuid::text as cost_code_uuid,
             estimate_line_item_uuid::text as estimate_line_item_uuid,
             item_type_uuid::text as item_type_uuid, item_uuid::text as item_uuid,
             preferred_vendor_uuid::text as preferred_vendor_uuid,
             item_division_uuid::text as item_division_uuid, location_uuid::text as location_uuid,
             category, name, description, model_number, unit_price, quantity,
             uom_uuid::text as uom_uuid, total_amount, sequence, metadata, is_active, created_at, updated_at
      from public.estimate_material_items ${estList}`)
    await upsertByUuid(mssql, {
      table: 'estimate_material_items',
      columns: ['uuid', 'corporation_uuid', 'project_uuid', 'estimate_uuid', 'cost_code_uuid', 'estimate_line_item_uuid', 'item_type_uuid', 'item_uuid', 'preferred_vendor_uuid', 'item_division_uuid', 'location_uuid', 'category', 'name', 'description', 'model_number', 'unit_price', 'quantity', 'uom_uuid', 'total_amount', 'sequence', 'metadata', 'is_active', 'created_at', 'updated_at'],
      dryRun,
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        corporation_uuid: remapCorp(lookups, r.corporation_uuid),
        project_uuid: uuidStr(r.project_uuid),
        estimate_uuid: uuidStr(r.estimate_uuid),
        cost_code_uuid: uuidStr(r.cost_code_uuid),
        estimate_line_item_uuid: uuidStr(r.estimate_line_item_uuid),
        item_type_uuid: uuidStr(r.item_type_uuid),
        item_uuid: uuidStr(r.item_uuid),
        preferred_vendor_uuid: remapVendor(lookups, r.preferred_vendor_uuid),
        item_division_uuid: uuidStr(r.item_division_uuid),
        location_uuid: uuidStr(r.location_uuid),
        category: asStr(r.category, 100),
        name: asStr(r.name, 500) || '',
        description: asStr(r.description),
        model_number: asStr(r.model_number, 200),
        unit_price: asNum(r.unit_price) ?? 0,
        quantity: asNum(r.quantity) ?? 0,
        uom_uuid: remapUom(lookups, r.uom_uuid),
        total_amount: asNum(r.total_amount) ?? 0,
        sequence: asNum(r.sequence) != null ? Math.trunc(asNum(r.sequence)) : 1,
        metadata: stringifyJson(r.metadata),
        is_active: asBool(r.is_active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
      })),
    })
  }

  for (const [src, dest, extra] of [
    ['estimate_location_wise_labor', 'estimate_location_wise_labor', 'area_sq_ft, no_of_rooms, num_hours, amount_per_sqft, amount_per_room, hourly_wage, amount, sequence'],
    ['estimate_location_wise_material', 'estimate_location_wise_material', 'amount, sequence'],
  ]) {
    try {
      const rows = await pgQuery(pg, `
        select uuid::text as uuid, corporation_uuid::text as corporation_uuid,
               project_uuid::text as project_uuid, estimate_uuid::text as estimate_uuid,
               estimate_line_item_uuid::text as estimate_line_item_uuid,
               location_uuid::text as location_uuid, ${extra}, created_at, updated_at
        from public.${src} ${estList}`)
      const cols = Object.keys(rows[0] || { uuid: 1, corporation_uuid: 1, project_uuid: 1, estimate_uuid: 1, estimate_line_item_uuid: 1, location_uuid: 1, created_at: 1, updated_at: 1 }).filter((k) => k !== 'id')
      await upsertByUuid(mssql, {
        table: dest,
        columns: [...new Set(['uuid', 'corporation_uuid', 'project_uuid', 'estimate_uuid', 'estimate_line_item_uuid', 'location_uuid', ...extra.split(',').map((s) => s.trim()), 'created_at', 'updated_at'])],
        dryRun,
        rows: rows.map((r) => {
          const out = {
            uuid: uuidStr(r.uuid),
            corporation_uuid: remapCorp(lookups, r.corporation_uuid),
            project_uuid: uuidStr(r.project_uuid),
            estimate_uuid: uuidStr(r.estimate_uuid),
            estimate_line_item_uuid: uuidStr(r.estimate_line_item_uuid),
            location_uuid: uuidStr(r.location_uuid),
            created_at: asDate(r.created_at),
            updated_at: asDate(r.updated_at) || new Date(),
          }
          for (const c of extra.split(',').map((s) => s.trim())) {
            out[c] = typeof r[c] === 'number' || r[c] == null ? asNum(r[c]) : asNum(r[c])
            if (c === 'sequence' || c === 'no_of_rooms') out[c] = asNum(r[c]) != null ? Math.trunc(asNum(r[c])) : (c === 'sequence' ? 1 : null)
          }
          void cols
          return out
        }),
      })
    }
    catch (e) {
      log(`${src} skipped: ${e.message}`)
    }
  }
}
