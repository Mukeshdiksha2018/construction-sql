import { pgQuery } from '../db.mjs'
import { remapCoa, remapCorp, remapMasterUuid, remapUom, remapUomByName, remapVendor, registerMasterAlias } from '../lookups.mjs'
import { upsertByUuid } from '../upsert.mjs'
import { asBool, asDate, asNum, asStr, log, uuidStr } from '../utils.mjs'

function aliasCb(lookups) {
  return (from, to) => registerMasterAlias(lookups, from, to)
}

/** @param {any} ctx */
export async function runPhase1Masters(ctx) {
  const { pg, mssql, lookups, dryRun } = ctx
  log('=== Phase 1: local masters ===')

  {
    const rows = await pgQuery(pg, `select * from public.freight`)
    await upsertByUuid(mssql, {
      table: 'freight',
      columns: ['uuid', 'ship_via', 'description', 'active', 'created_at', 'updated_at', 'created_by', 'updated_by'],
      dryRun,
      matchBy: 'ship_via',
      onAlias: aliasCb(lookups),
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        ship_via: asStr(r.ship_via, 255) || 'freight',
        description: asStr(r.description),
        active: asBool(r.active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
        created_by: asStr(r.created_by, 128),
        updated_by: asStr(r.updated_by, 128),
      })),
    })
  }

  {
    const rows = await pgQuery(pg, `select * from public.approval_checks`)
    await upsertByUuid(mssql, {
      table: 'approval_checks',
      columns: ['uuid', 'approval_check', 'description', 'active', 'created_at', 'updated_at', 'created_by', 'updated_by'],
      dryRun,
      matchBy: 'approval_check',
      onAlias: aliasCb(lookups),
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        approval_check: asStr(r.approval_check, 255) || 'check',
        description: asStr(r.description),
        active: asBool(r.active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
        created_by: asStr(r.created_by, 128),
        updated_by: asStr(r.updated_by, 128),
      })),
    })
  }

  {
    const rows = await pgQuery(pg, `select * from public.location`)
    await upsertByUuid(mssql, {
      table: 'location',
      columns: ['uuid', 'location_name', 'location_code', 'description', 'active', 'created_at', 'updated_at', 'created_by', 'updated_by'],
      dryRun,
      matchBy: 'location_name',
      onAlias: aliasCb(lookups),
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        location_name: asStr(r.location_name, 255) || 'location',
        location_code: asStr(r.location_code, 64),
        description: asStr(r.description),
        active: asBool(r.active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
        created_by: asStr(r.created_by, 128),
        updated_by: asStr(r.updated_by, 128),
      })),
    })
  }

  {
    const rows = await pgQuery(pg, `select * from public.po_instructions ${corpWhere(ctx, 'corporation_uuid')}`)
    await upsertByUuid(mssql, {
      table: 'po_instructions',
      columns: ['uuid', 'corporation_uuid', 'po_instruction_name', 'instruction', 'status', 'created_at', 'updated_at', 'created_by', 'updated_by'],
      dryRun,
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        corporation_uuid: remapCorp(lookups, r.corporation_uuid),
        po_instruction_name: asStr(r.po_instruction_name, 255) || 'instruction',
        instruction: asStr(r.instruction) || '',
        status: asStr(r.status, 20) || 'ACTIVE',
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
        created_by: asStr(r.created_by, 128),
        updated_by: asStr(r.updated_by, 128),
      })),
    })
  }

  {
    const rows = await pgQuery(pg, `select * from public.reasons`)
    await upsertByUuid(mssql, {
      table: 'reasons',
      columns: ['uuid', 'reason', 'active', 'created_at', 'updated_at', 'created_by', 'updated_by'],
      dryRun,
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        reason: asStr(r.reason) || '',
        active: asBool(r.active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
        created_by: asStr(r.created_by, 128),
        updated_by: asStr(r.updated_by, 128),
      })),
    })
  }

  {
    const rows = await pgQuery(pg, `select * from public.project_types`)
    await upsertByUuid(mssql, {
      table: 'project_types',
      columns: ['uuid', 'name', 'description', 'color', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'],
      dryRun,
      matchBy: 'name',
      onAlias: aliasCb(lookups),
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        name: asStr(r.name, 255) || 'type',
        description: asStr(r.description),
        color: asStr(r.color, 7) || '#3B82F6',
        is_active: asBool(r.is_active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
        created_by: asStr(r.created_by, 128),
        updated_by: asStr(r.updated_by, 128),
      })),
    })
  }

  {
    const rows = await pgQuery(pg, `select * from public.service_types`)
    await upsertByUuid(mssql, {
      table: 'service_types',
      columns: ['uuid', 'name', 'description', 'color', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'],
      dryRun,
      matchBy: 'name',
      onAlias: aliasCb(lookups),
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        name: asStr(r.name, 255) || 'type',
        description: asStr(r.description),
        color: asStr(r.color, 7) || '#3D5C7C',
        is_active: asBool(r.is_active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
        created_by: asStr(r.created_by, 128),
        updated_by: asStr(r.updated_by, 128),
      })),
    })
  }

  {
    const rows = await pgQuery(pg, `select * from public.terms_and_conditions`)
    await upsertByUuid(mssql, {
      table: 'terms_and_conditions',
      columns: ['uuid', 'name', 'content', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'],
      dryRun,
      matchBy: 'name',
      onAlias: aliasCb(lookups),
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        name: asStr(r.name, 255) || 'terms',
        content: asStr(r.content) || '',
        is_active: asBool(r.is_active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
        created_by: asStr(r.created_by, 128),
        updated_by: asStr(r.updated_by, 128),
      })),
    })
  }

  {
    const rows = await pgQuery(pg, `select * from public.cost_code_divisions ${corpWhere(ctx, 'corporation_uuid')}`)
    await upsertByUuid(mssql, {
      table: 'cost_code_divisions',
      columns: ['uuid', 'corporation_uuid', 'division_number', 'division_name', 'division_order', 'description', 'is_active', 'exclude_in_estimates_and_reports', 'created_at', 'updated_at'],
      dryRun,
      matchBy: ['corporation_uuid', 'division_number'],
      onAlias: aliasCb(lookups),
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        corporation_uuid: remapCorp(lookups, r.corporation_uuid),
        division_number: asStr(r.division_number, 50) || '',
        division_name: asStr(r.division_name, 255) || '',
        division_order: asNum(r.division_order) ?? 1,
        description: asStr(r.description),
        is_active: asBool(r.is_active, true),
        exclude_in_estimates_and_reports: asBool(r.exclude_in_estimates_and_reports, false),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
      })),
    })
  }

  {
    const rows = await pgQuery(pg, `select * from public.cost_code_configurations ${corpWhere(ctx, 'corporation_uuid')}`)
    await upsertByUuid(mssql, {
      table: 'cost_code_configurations',
      columns: ['uuid', 'corporation_uuid', 'division_uuid', 'cost_code_number', 'cost_code_name', 'parent_cost_code_uuid', 'order_number', 'gl_account_uuid', 'effective_from', 'description', 'update_previous_transactions', 'is_active', 'created_at', 'updated_at'],
      dryRun,
      matchBy: ['corporation_uuid', 'cost_code_number'],
      onAlias: aliasCb(lookups),
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        corporation_uuid: remapCorp(lookups, r.corporation_uuid),
        division_uuid: remapMasterUuid(lookups, r.division_uuid),
        cost_code_number: asStr(r.cost_code_number, 50) || '',
        cost_code_name: asStr(r.cost_code_name, 255) || '',
        parent_cost_code_uuid: remapMasterUuid(lookups, r.parent_cost_code_uuid),
        order_number: asNum(r.order_number) != null ? Math.trunc(asNum(r.order_number)) : null,
        gl_account_uuid: remapCoa(lookups, r.gl_account_uuid),
        effective_from: asDate(r.effective_from),
        description: asStr(r.description),
        update_previous_transactions: asBool(r.update_previous_transactions, false),
        is_active: asBool(r.is_active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
      })),
    })
  }

  {
    const rows = await pgQuery(pg, `select * from public.item_types ${corpWhereNullable(ctx, 'corporation_uuid')}`)
    await upsertByUuid(mssql, {
      table: 'item_types',
      columns: ['uuid', 'corporation_uuid', 'category', 'spec_type', 'item_division_uuid', 'item_type', 'description', 'is_active', 'created_at', 'updated_at'],
      dryRun,
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        corporation_uuid: r.corporation_uuid ? remapCorp(lookups, r.corporation_uuid) : null,
        category: asStr(r.category, 50) || 'procurement',
        spec_type: asStr(r.spec_type, 255) || '',
        item_division_uuid: uuidStr(r.item_division_uuid),
        item_type: asStr(r.item_type, 255) || '',
        description: asStr(r.description),
        is_active: asBool(r.is_active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
      })),
    })
  }

  {
    const rows = await pgQuery(pg, `select * from public.cost_code_preferred_items ${corpWhere(ctx, 'corporation_uuid')}`)
    await upsertByUuid(mssql, {
      table: 'cost_code_preferred_items',
      columns: ['uuid', 'corporation_uuid', 'project_uuid', 'cost_code_configuration_uuid', 'item_type_uuid', 'category', 'item_name', 'item_sequence', 'model_number', 'unit_price', 'uom_uuid', 'location_uuid', 'preferred_vendor_uuid', 'initial_quantity', 'as_of_date', 'reorder_point', 'maximum_limit', 'description', 'status', 'is_active', 'created_at', 'updated_at'],
      dryRun,
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        corporation_uuid: remapCorp(lookups, r.corporation_uuid),
        project_uuid: uuidStr(r.project_uuid),
        cost_code_configuration_uuid: remapMasterUuid(lookups, r.cost_code_configuration_uuid),
        item_type_uuid: uuidStr(r.item_type_uuid),
        category: asStr(r.category, 50),
        item_name: asStr(r.item_name, 255) || '',
        item_sequence: asStr(r.item_sequence, 100),
        model_number: asStr(r.model_number, 100),
        unit_price: asNum(r.unit_price),
        // Source has no uom FK — `unit` is a free-text name matched against public.uom(uom_name/short_name)
        uom_uuid: remapUomByName(lookups, r.unit) || remapUom(lookups, r.uom_uuid),
        location_uuid: remapMasterUuid(lookups, r.location_uuid),
        preferred_vendor_uuid: remapVendor(lookups, r.preferred_vendor_uuid),
        initial_quantity: asNum(r.initial_quantity),
        as_of_date: asDate(r.as_of_date),
        reorder_point: asNum(r.reorder_point),
        maximum_limit: asNum(r.maximum_limit),
        description: asStr(r.description),
        status: asStr(r.status, 50) || 'Active',
        is_active: asBool(r.is_active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
      })),
    })
  }

  {
    const rows = await pgQuery(pg, `select * from public.customers ${corpWhere(ctx, 'corporation_uuid')}`)
    await upsertByUuid(mssql, {
      table: 'customers',
      columns: ['uuid', 'corporation_uuid', 'project_uuid', 'customer_address', 'customer_city', 'customer_state', 'customer_country', 'customer_zip', 'customer_phone', 'customer_email', 'company_name', 'salutation', 'first_name', 'middle_name', 'last_name', 'profile_image_url', 'is_active', 'nimble_customer_id', 'created_at', 'updated_at', 'created_by', 'updated_by'],
      dryRun,
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        corporation_uuid: remapCorp(lookups, r.corporation_uuid),
        project_uuid: uuidStr(r.project_uuid),
        customer_address: asStr(r.customer_address) || '',
        customer_city: asStr(r.customer_city, 100) || '',
        customer_state: asStr(r.customer_state, 50) || '',
        customer_country: asStr(r.customer_country, 2) || '',
        customer_zip: asStr(r.customer_zip, 20) || '',
        customer_phone: asStr(r.customer_phone, 50) || '',
        customer_email: asStr(r.customer_email, 255) || '',
        company_name: asStr(r.company_name, 255) || '',
        salutation: asStr(r.salutation, 20) || 'Mr.',
        first_name: asStr(r.first_name, 100) || '',
        middle_name: asStr(r.middle_name, 100) || '',
        last_name: asStr(r.last_name, 100) || '',
        profile_image_url: asStr(r.profile_image_url) || '',
        is_active: asBool(r.is_active, true),
        nimble_customer_id: asStr(r.nimble_customer_id, 255),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
        created_by: asStr(r.created_by, 128),
        updated_by: asStr(r.updated_by, 128),
      })),
    })
  }
}

function corpWhere(ctx, col) {
  const ids = ctx.corpFilter?.localUuids
  if (!ids?.length) return ''
  const list = ids.map((u) => `'${u.replace(/'/g, "''")}'`).join(',')
  return `where ${col}::text in (${list})`
}

function corpWhereNullable(ctx, col) {
  const ids = ctx.corpFilter?.localUuids
  if (!ids?.length) return ''
  const list = ids.map((u) => `'${u.replace(/'/g, "''")}'`).join(',')
  return `where ${col} is null or ${col}::text in (${list})`
}
