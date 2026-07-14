import { pgQuery } from '../db.mjs'
import { documentTagRows } from '../expandBlobs.mjs'
import { remapCorp } from '../lookups.mjs'
import { replaceChildren, upsertByUuid } from '../upsert.mjs'
import { asBool, asDate, asNum, asStr, log, stringifyJson, uuidStr } from '../utils.mjs'

function corpWhere(ctx, col) {
  const ids = ctx.corpFilter?.localUuids
  if (!ids?.length) return ''
  const list = ids.map((u) => `'${u.replace(/'/g, "''")}'`).join(',')
  return `where ${col}::text in (${list})`
}

/**
 * @param {any} ctx
 */
export async function runPhase2Projects(ctx) {
  const { pg, mssql, lookups, dryRun } = ctx
  log('=== Phase 2: projects tree ===')

  const projects = await pgQuery(pg, `
    select uuid::text as uuid, corporation_uuid::text as corporation_uuid,
           project_name, project_id, project_type_uuid::text as project_type_uuid,
           service_type_uuid::text as service_type_uuid, project_description,
           estimated_amount, area_sq_ft, no_of_rooms, contingency_percentage,
           customer_name, customer_uuid::text as customer_uuid, project_status,
           project_start_date, project_estimated_completion_date,
           only_total, enable_labor, enable_material, attachments,
           enable_location_wise, location_basis_area, location_basis_no_of_rooms,
           is_active, created_at, updated_at, created_by, updated_by
    from public.projects
    ${corpWhere(ctx, 'corporation_uuid')}`)

  await upsertByUuid(mssql, {
    table: 'projects',
    columns: ['uuid', 'corporation_uuid', 'project_name', 'project_id', 'project_type_uuid', 'service_type_uuid', 'project_description', 'estimated_amount', 'area_sq_ft', 'no_of_rooms', 'contingency_percentage', 'customer_name', 'customer_uuid', 'project_status', 'project_start_date', 'project_estimated_completion_date', 'only_total', 'enable_labor', 'enable_material', 'attachments', 'enable_location_wise', 'location_basis_area', 'location_basis_no_of_rooms', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'],
    dryRun,
    rows: projects.map((r) => ({
      uuid: uuidStr(r.uuid),
      corporation_uuid: remapCorp(lookups, r.corporation_uuid),
      project_name: asStr(r.project_name, 255) || '',
      project_id: asStr(r.project_id, 100) || '',
      project_type_uuid: uuidStr(r.project_type_uuid),
      service_type_uuid: uuidStr(r.service_type_uuid),
      project_description: asStr(r.project_description),
      estimated_amount: asNum(r.estimated_amount),
      area_sq_ft: asNum(r.area_sq_ft),
      no_of_rooms: asNum(r.no_of_rooms) != null ? Math.trunc(asNum(r.no_of_rooms)) : null,
      contingency_percentage: asNum(r.contingency_percentage),
      customer_name: asStr(r.customer_name, 255),
      customer_uuid: uuidStr(r.customer_uuid),
      project_status: asStr(r.project_status, 50) || 'Pending',
      project_start_date: asDate(r.project_start_date),
      project_estimated_completion_date: asDate(r.project_estimated_completion_date),
      only_total: asBool(r.only_total, false),
      enable_labor: asBool(r.enable_labor, false),
      enable_material: asBool(r.enable_material, false),
      attachments: stringifyJson(r.attachments) || '[]',
      enable_location_wise: asBool(r.enable_location_wise, false),
      location_basis_area: asBool(r.location_basis_area, false),
      location_basis_no_of_rooms: asBool(r.location_basis_no_of_rooms, false),
      is_active: asBool(r.is_active, true),
      created_at: asDate(r.created_at),
      updated_at: asDate(r.updated_at) || new Date(),
      created_by: asStr(r.created_by, 128),
      updated_by: asStr(r.updated_by, 128),
    })),
  })

  const projectUuids = projects.map((r) => uuidStr(r.uuid)).filter(Boolean)
  const inProjects = projectUuids.length
    ? `where project_uuid::text in (${projectUuids.map((u) => `'${u}'`).join(',')})`
    : (ctx.corpFilter ? 'where false' : '')

  {
    const rows = await pgQuery(pg, `
      select uuid::text as uuid, project_uuid::text as project_uuid, address_type,
             contact_person, email, phone, address_line_1, address_line_2, city, state,
             zip_code, country, is_primary, is_active,
             copied_from_billing_address_uuid::text as copied_from_billing_address_uuid,
             created_at, updated_at
      from public.project_addresses
      ${inProjects}`)
    await upsertByUuid(mssql, {
      table: 'project_addresses',
      columns: ['uuid', 'project_uuid', 'address_type', 'contact_person', 'email', 'phone', 'address_line_1', 'address_line_2', 'city', 'state', 'zip_code', 'country', 'is_primary', 'is_active', 'copied_from_billing_address_uuid', 'created_at', 'updated_at'],
      dryRun,
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        project_uuid: uuidStr(r.project_uuid),
        address_type: asStr(r.address_type, 50) || 'billing',
        contact_person: asStr(r.contact_person, 255),
        email: asStr(r.email, 255),
        phone: asStr(r.phone, 50),
        address_line_1: asStr(r.address_line_1, 500) || '',
        address_line_2: asStr(r.address_line_2, 500),
        city: asStr(r.city, 100),
        state: asStr(r.state, 100),
        zip_code: asStr(r.zip_code, 20),
        country: asStr(r.country, 10),
        is_primary: asBool(r.is_primary, false),
        is_active: asBool(r.is_active, true),
        copied_from_billing_address_uuid: uuidStr(r.copied_from_billing_address_uuid),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
      })),
    })
  }

  {
    const rows = await pgQuery(pg, `
      select uuid::text as uuid, project_uuid::text as project_uuid,
             location_uuid::text as location_uuid, location_name, area_sq_ft, no_of_rooms,
             is_active, created_at, updated_at
      from public.project_location_breakdowns
      ${inProjects}`)
    await upsertByUuid(mssql, {
      table: 'project_location_breakdowns',
      columns: ['uuid', 'project_uuid', 'location_uuid', 'location_name', 'area_sq_ft', 'no_of_rooms', 'is_active', 'created_at', 'updated_at'],
      dryRun,
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        project_uuid: uuidStr(r.project_uuid),
        location_uuid: uuidStr(r.location_uuid),
        location_name: asStr(r.location_name, 255),
        area_sq_ft: asNum(r.area_sq_ft),
        no_of_rooms: asNum(r.no_of_rooms) != null ? Math.trunc(asNum(r.no_of_rooms)) : null,
        is_active: asBool(r.is_active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
      })),
    })
  }

  {
    let docs = []
    try {
      docs = await pgQuery(pg, `
        select uuid::text as uuid, project_uuid::text as project_uuid,
               document_name, document_type, file_url, file_path, mime_type, file_size,
               description, tags, is_primary, is_active, uploaded_by, created_at, updated_at
        from public.project_documents
        ${inProjects}`)
    }
    catch {
      docs = await pgQuery(pg, `
        select uuid::text as uuid, project_uuid::text as project_uuid,
               document_name, document_type, file_url, mime_type, file_size,
               description, tags, is_primary, is_active, created_at, updated_at
        from public.project_documents
        ${inProjects}`)
    }

    await upsertByUuid(mssql, {
      table: 'project_documents',
      columns: ['uuid', 'project_uuid', 'document_name', 'document_type', 'file_size', 'mime_type', 'file_url', 'file_path', 'description', 'tags', 'is_primary', 'is_active', 'uploaded_by', 'created_at', 'updated_at'],
      dryRun,
      rows: docs.map((r) => ({
        uuid: uuidStr(r.uuid),
        project_uuid: uuidStr(r.project_uuid),
        document_name: asStr(r.document_name, 255) || 'document',
        document_type: asStr(r.document_type, 50) || 'file',
        file_size: asNum(r.file_size) != null ? Math.trunc(asNum(r.file_size)) : 0,
        mime_type: asStr(r.mime_type, 100) || 'application/octet-stream',
        file_url: asStr(r.file_url) || '',
        file_path: asStr(r.file_path) || asStr(r.file_url) || '',
        description: asStr(r.description),
        tags: stringifyJson(r.tags) || '[]',
        is_primary: asBool(r.is_primary, false),
        is_active: asBool(r.is_active, true),
        uploaded_by: asStr(r.uploaded_by, 128),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
      })),
    })

    const tagRows = []
    const parentUuids = []
    for (const d of docs) {
      const id = uuidStr(d.uuid)
      if (!id) continue
      parentUuids.push(id)
      tagRows.push(...documentTagRows(d.tags, id))
    }
    await replaceChildren(mssql, {
      table: 'project_document_tags',
      parentCol: 'project_document_uuid',
      parentUuids,
      columns: ['project_document_uuid', 'tag'],
      rows: tagRows,
      dryRun,
    })
  }

  // special_instructions (depends on projects)
  {
    const rows = await pgQuery(pg, `
      select uuid::text as uuid, corporation_uuid::text as corporation_uuid,
             project_uuid::text as project_uuid, name, content, is_active,
             created_at, updated_at, created_by, updated_by
      from public.special_instructions
      ${corpWhere(ctx, 'corporation_uuid')}`)
    await upsertByUuid(mssql, {
      table: 'special_instructions',
      columns: ['uuid', 'corporation_uuid', 'project_uuid', 'name', 'content', 'is_active', 'created_at', 'updated_at', 'created_by', 'updated_by'],
      dryRun,
      rows: rows.map((r) => ({
        uuid: uuidStr(r.uuid),
        corporation_uuid: remapCorp(lookups, r.corporation_uuid),
        project_uuid: uuidStr(r.project_uuid),
        name: asStr(r.name, 255) || '',
        content: asStr(r.content) || '',
        is_active: asBool(r.is_active, true),
        created_at: asDate(r.created_at),
        updated_at: asDate(r.updated_at) || new Date(),
        created_by: asStr(r.created_by, 128),
        updated_by: asStr(r.updated_by, 128),
      })),
    })
  }
}
