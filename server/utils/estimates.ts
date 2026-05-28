import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── JSON helpers ─────────────────────────────────────────────────────────────
function parseJson<T = unknown>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback
  try { return JSON.parse(val) as T } catch { return fallback }
}
function stringifyJson(val: unknown): string | null {
  if (val === null || val === undefined) return null
  return JSON.stringify(val)
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function toLocalDate(d: Date | null | undefined): string | null {
  if (!d) return null
  return d.toISOString().split('T')[0]
}
function parseDate(val: string | null | undefined): Date | null {
  if (!val) return null
  return new Date(val)
}

// ─── Number helpers ───────────────────────────────────────────────────────────
function toNum(val: unknown): number {
  const n = parseFloat(String(val ?? 0))
  return isNaN(n) ? 0 : n
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
export interface EstimateLineItemInput {
  cost_code_uuid: string
  cost_code_number?: string
  cost_code_name?: string
  division_name?: string
  description?: string
  is_sub_cost_code?: boolean
  estimation_type?: string
  labor_amount?: number
  labor_amount_per_room?: number
  labor_rooms_count?: number
  labor_amount_per_sqft?: number
  labor_sq_ft_count?: number
  labor_number_of_hours?: number
  labor_hourly_wage?: number
  material_amount?: number
  contingency_amount?: number
  contingency_enabled?: boolean
  contingency_percentage?: number
  total_amount?: number
  metadata?: Record<string, unknown>
  material_items?: EstimateMaterialItemInput[]
  location_wise_labor?: EstimateLocationWiseLaborInput[]
  location_wise_material?: EstimateLocationWiseMaterialInput[]
}

export interface EstimateMaterialItemInput {
  item_type_uuid?: string | null
  item_uuid?: string | null
  preferred_vendor_uuid?: string | null
  item_division_uuid?: string | null
  location_uuid?: string | null
  category?: string | null
  name: string
  description?: string | null
  model_number?: string | null
  unit_price?: number
  quantity?: number
  uom_uuid?: string | null
  total_amount?: number
  sequence?: number
  metadata?: Record<string, unknown>
}

export interface EstimateLocationWiseLaborInput {
  location_uuid: string
  area_sq_ft?: number
  no_of_rooms?: number
  num_hours?: number
  amount_per_sqft?: number
  amount_per_room?: number
  hourly_wage?: number
  amount?: number
  sequence?: number
}

export interface EstimateLocationWiseMaterialInput {
  location_uuid: string
  amount?: number
  sequence?: number
}

export interface CreateEstimateInput {
  corporation_uuid: string
  project_uuid: string
  estimate_number?: string
  estimate_date?: string
  valid_until?: string
  status?: string
  total_amount: number
  tax_amount?: number
  discount_amount?: number
  final_amount: number
  notes?: string
  attachments?: unknown[]
  removed_cost_code_uuids?: string[]
  line_items?: EstimateLineItemInput[]
  user_id?: string
  user_name?: string
  user_email?: string
  user_image_url?: string | null
}

export interface UpdateEstimateInput {
  uuid: string
  estimate_number?: string
  estimate_date?: string
  valid_until?: string
  status?: string
  total_amount?: number
  tax_amount?: number
  discount_amount?: number
  final_amount?: number
  notes?: string
  attachments?: unknown[]
  removed_cost_code_uuids?: string[]
  line_items?: EstimateLineItemInput[]
  user_id?: string
  user_name?: string
  user_email?: string
  user_image_url?: string | null
}

// ─── Row mappers ──────────────────────────────────────────────────────────────
function mapEstimateRow(row: any, project?: any) {
  return {
    id: String(row.id),
    uuid: row.uuid,
    corporation_uuid: row.corporation_uuid,
    project_uuid: row.project_uuid,
    estimate_number: row.estimate_number,
    estimate_date: toLocalDate(row.estimate_date),
    valid_until: toLocalDate(row.valid_until),
    status: row.status,
    total_amount: toNum(row.total_amount),
    tax_amount: toNum(row.tax_amount),
    discount_amount: toNum(row.discount_amount),
    final_amount: toNum(row.final_amount),
    notes: row.notes ?? null,
    attachments: parseJson(row.attachments, []),
    removed_cost_code_uuids: parseJson(row.removed_cost_code_uuids, []),
    audit_log: parseJson(row.audit_log, []),
    created_by: row.created_by ?? null,
    approved_by: row.approved_by ?? null,
    approved_at: row.approved_at ? row.approved_at.toISOString() : null,
    is_active: row.is_active,
    created_at: row.created_at?.toISOString() ?? null,
    updated_at: row.updated_at?.toISOString() ?? null,
    project: project ?? null,
    line_items: [],
  }
}

function mapLineItemRow(row: any, materialItemsByLi: Record<string, any[]>, lwLaborByLi: Record<string, any[]>, lwMaterialByLi: Record<string, any[]>) {
  const meta = parseJson<Record<string, unknown>>(row.metadata, {})
  return {
    cost_code_uuid: row.cost_code_uuid,
    cost_code_number: row.cost_code_number ?? '',
    cost_code_name: row.cost_code_name ?? '',
    division_name: row.division_name ?? '',
    description: row.description ?? '',
    is_sub_cost_code: row.is_sub_cost_code ?? false,
    estimation_type: row.labor_estimation_type ?? null,
    labor_amount: toNum(row.labor_amount),
    labor_amount_per_room: toNum(row.labor_amount_per_room),
    labor_rooms_count: row.labor_rooms_count ?? 0,
    labor_amount_per_sqft: toNum(row.labor_amount_per_sqft),
    labor_sq_ft_count: row.labor_sq_ft_count ?? 0,
    labor_number_of_hours: toNum(row.labor_number_of_hours),
    labor_hourly_wage: toNum(row.labor_hourly_wage),
    material_amount: toNum(row.material_amount),
    contingency_amount: toNum(row.contingency_amount),
    total_amount: toNum(row.total_amount),
    metadata: meta,
    contingency_enabled: typeof meta.contingency_enabled !== 'undefined' ? !!meta.contingency_enabled : undefined,
    contingency_percentage: typeof meta.contingency_percentage !== 'undefined' ? toNum(meta.contingency_percentage) : undefined,
    material_items: materialItemsByLi[row.uuid] ?? [],
    location_wise_labor: lwLaborByLi[row.uuid] ?? [],
    location_wise_material: lwMaterialByLi[row.uuid] ?? [],
  }
}

function mapMaterialItemRow(row: any, preferredItem?: any) {
  return {
    uuid: row.uuid,
    estimate_line_item_uuid: row.estimate_line_item_uuid,
    item_type_uuid: row.item_type_uuid ?? null,
    item_uuid: row.item_uuid ?? null,
    preferred_vendor_uuid: row.preferred_vendor_uuid ?? null,
    item_division_uuid: row.item_division_uuid ?? null,
    location_uuid: row.location_uuid ?? null,
    category: row.category ?? null,
    name: preferredItem?.item_name || row.name,
    item_sequence: preferredItem?.item_sequence ?? null,
    description: row.description || preferredItem?.description || null,
    model_number: preferredItem?.model_number || row.model_number || null,
    unit_price: toNum(row.unit_price),
    quantity: toNum(row.quantity),
    uom_uuid: row.uom_uuid ?? null,
    total_amount: toNum(row.total_amount),
    sequence: row.sequence ?? 1,
    metadata: parseJson(row.metadata, {}),
    preferred_item: preferredItem ? {
      uuid: preferredItem.uuid,
      item_name: preferredItem.item_name,
      item_sequence: preferredItem.item_sequence,
      model_number: preferredItem.model_number,
      unit_price: toNum(preferredItem.unit_price),
      uom_uuid: preferredItem.uom_uuid,
      description: preferredItem.description,
    } : null,
  }
}

// ─── Auto-generate estimate number ────────────────────────────────────────────
async function generateEstimateNumber(corporationUuid: string): Promise<string> {
  const recent = await prisma.estimate.findMany({
    where: { corporation_uuid: corporationUuid, is_active: true },
    select: { estimate_number: true },
    orderBy: { created_at: 'desc' },
    take: 200,
  })
  let maxSeq = 0
  for (const r of recent) {
    const m = String(r.estimate_number).match(/^(ES|EST)-?(\d+)$/i)
    if (m) maxSeq = Math.max(maxSeq, parseInt(m[2]))
  }
  return `ES-${maxSeq + 1}`
}

// ─── Load line items with related data ────────────────────────────────────────
async function loadLineItemsForEstimate(estimateUuid: string) {
  const lineItems = await prisma.estimateLineItem.findMany({
    where: { estimate_uuid: estimateUuid },
    orderBy: { id: 'asc' },
  })

  const lineItemUuids = lineItems.map(li => li.uuid)
  if (lineItemUuids.length === 0) {
    return { lineItems, materialItemsByLi: {}, lwLaborByLi: {}, lwMaterialByLi: {} }
  }

  const [materialItems, lwLabor, lwMaterial] = await Promise.all([
    prisma.estimateMaterialItem.findMany({
      where: { estimate_line_item_uuid: { in: lineItemUuids }, is_active: true },
      orderBy: { sequence: 'asc' },
    }),
    prisma.estimateLocationWiseLabor.findMany({
      where: { estimate_line_item_uuid: { in: lineItemUuids } },
      orderBy: [{ estimate_line_item_uuid: 'asc' }, { sequence: 'asc' }],
    }),
    prisma.estimateLocationWiseMaterial.findMany({
      where: { estimate_line_item_uuid: { in: lineItemUuids } },
      orderBy: [{ estimate_line_item_uuid: 'asc' }, { sequence: 'asc' }],
    }),
  ])

  // Load preferred items for material items that have item_uuid
  const itemUuids = [...new Set(materialItems.map(m => m.item_uuid).filter(Boolean) as string[])]
  const preferredItemsMap: Record<string, any> = {}
  if (itemUuids.length > 0) {
    const preferredItems = await prisma.costCodePreferredItem.findMany({
      where: { uuid: { in: itemUuids } },
      select: { uuid: true, item_name: true, item_sequence: true, model_number: true, unit_price: true, uom_uuid: true, description: true },
    })
    for (const pi of preferredItems) preferredItemsMap[pi.uuid] = pi
  }

  const materialItemsByLi: Record<string, any[]> = {}
  for (const m of materialItems) {
    const li = m.estimate_line_item_uuid
    if (!materialItemsByLi[li]) materialItemsByLi[li] = []
    const pi = m.item_uuid ? preferredItemsMap[m.item_uuid] : undefined
    materialItemsByLi[li].push(mapMaterialItemRow(m, pi))
  }

  const lwLaborByLi: Record<string, any[]> = {}
  for (const r of lwLabor) {
    const li = r.estimate_line_item_uuid
    if (!lwLaborByLi[li]) lwLaborByLi[li] = []
    lwLaborByLi[li].push({
      breakdown_uuid: r.uuid,
      location_uuid: r.location_uuid,
      area_sq_ft: toNum(r.area_sq_ft),
      no_of_rooms: toNum(r.no_of_rooms),
      num_hours: toNum(r.num_hours),
      amount_per_sqft: toNum(r.amount_per_sqft),
      amount_per_room: toNum(r.amount_per_room),
      hourly_wage: toNum(r.hourly_wage),
      amount: toNum(r.amount),
    })
  }

  const lwMaterialByLi: Record<string, any[]> = {}
  for (const r of lwMaterial) {
    const li = r.estimate_line_item_uuid
    if (!lwMaterialByLi[li]) lwMaterialByLi[li] = []
    lwMaterialByLi[li].push({
      breakdown_uuid: r.uuid,
      location_uuid: r.location_uuid,
      amount: toNum(r.amount),
    })
  }

  return { lineItems, materialItemsByLi, lwLaborByLi, lwMaterialByLi }
}

// ─── Insert line items (used by create and update) ────────────────────────────
async function insertLineItems(
  lineItemsInput: EstimateLineItemInput[],
  estimateUuid: string,
  corporationUuid: string,
  projectUuid: string,
) {
  const validLaborTypes = new Set(['manual', 'per-room', 'per-sqft', 'hourly-wage', 'location-wise'])

  const lineItemRows = lineItemsInput
    .filter(item => !!item.cost_code_uuid)
    .map(item => ({
      corporation_uuid: corporationUuid,
      project_uuid: projectUuid,
      estimate_uuid: estimateUuid,
      cost_code_uuid: item.cost_code_uuid,
      cost_code_number: item.cost_code_number ?? null,
      cost_code_name: item.cost_code_name ?? null,
      division_name: item.division_name ?? null,
      description: item.description ?? null,
      is_sub_cost_code: !!item.is_sub_cost_code,
      labor_estimation_type: validLaborTypes.has(item.estimation_type ?? '') ? item.estimation_type! : null,
      labor_amount: toNum(item.labor_amount),
      labor_amount_per_room: toNum(item.labor_amount_per_room),
      labor_rooms_count: item.labor_rooms_count ?? 0,
      labor_amount_per_sqft: toNum(item.labor_amount_per_sqft),
      labor_sq_ft_count: item.labor_sq_ft_count ?? 0,
      labor_number_of_hours: toNum(item.labor_number_of_hours),
      labor_hourly_wage: toNum(item.labor_hourly_wage),
      material_amount: toNum(item.material_amount),
      contingency_amount: toNum(item.contingency_amount),
      total_amount: toNum(item.total_amount),
      metadata: stringifyJson({
        ...(item.metadata ?? {}),
        contingency_enabled: item.contingency_enabled,
        contingency_percentage: item.contingency_percentage,
      }),
    }))

  // Insert in batches of 50
  const insertedMap: Record<string, string> = {} // cost_code_uuid → line_item uuid
  for (let i = 0; i < lineItemRows.length; i += 50) {
    const batch = lineItemRows.slice(i, i + 50)
    await prisma.estimateLineItem.createMany({ data: batch })
  }

  // Retrieve back to get UUIDs
  const created = await prisma.estimateLineItem.findMany({
    where: { estimate_uuid: estimateUuid },
    select: { uuid: true, cost_code_uuid: true },
    orderBy: { id: 'asc' },
  })
  for (const c of created) insertedMap[c.cost_code_uuid] = c.uuid

  // Insert material items, location-wise labor/material
  for (const item of lineItemsInput) {
    const lineItemUuid = insertedMap[item.cost_code_uuid]
    if (!lineItemUuid) continue

    if (Array.isArray(item.material_items) && item.material_items.length > 0) {
      const matRows = item.material_items.map((m, idx) => {
        const up = toNum(m.unit_price)
        const qty = toNum(m.quantity)
        return {
          corporation_uuid: corporationUuid,
          project_uuid: projectUuid,
          estimate_uuid: estimateUuid,
          cost_code_uuid: item.cost_code_uuid,
          estimate_line_item_uuid: lineItemUuid,
          item_type_uuid: m.item_type_uuid ?? null,
          item_uuid: m.item_uuid ?? null,
          preferred_vendor_uuid: m.preferred_vendor_uuid ?? null,
          item_division_uuid: m.item_division_uuid ?? null,
          location_uuid: m.location_uuid ?? null,
          category: m.category ?? null,
          name: m.name,
          description: m.description ?? null,
          model_number: m.model_number ?? null,
          unit_price: up,
          quantity: qty,
          uom_uuid: m.uom_uuid ?? null,
          total_amount: up * qty,
          sequence: m.sequence ?? idx + 1,
          metadata: stringifyJson(m.metadata ?? {}),
          is_active: true,
        }
      })
      if (matRows.length > 0) await prisma.estimateMaterialItem.createMany({ data: matRows })
    }

    if (Array.isArray(item.location_wise_labor) && item.location_wise_labor.length > 0) {
      const lwRows = item.location_wise_labor.map((r, idx) => ({
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        estimate_uuid: estimateUuid,
        cost_code_uuid: item.cost_code_uuid,
        estimate_line_item_uuid: lineItemUuid,
        location_uuid: r.location_uuid,
        area_sq_ft: toNum(r.area_sq_ft),
        no_of_rooms: toNum(r.no_of_rooms),
        num_hours: toNum(r.num_hours),
        amount_per_sqft: toNum(r.amount_per_sqft),
        amount_per_room: toNum(r.amount_per_room),
        hourly_wage: toNum(r.hourly_wage),
        amount: toNum(r.amount),
        sequence: r.sequence ?? idx + 1,
      }))
      await prisma.estimateLocationWiseLabor.createMany({ data: lwRows })
    }

    if (Array.isArray(item.location_wise_material) && item.location_wise_material.length > 0) {
      const lwmRows = item.location_wise_material.map((r, idx) => ({
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        estimate_uuid: estimateUuid,
        cost_code_uuid: item.cost_code_uuid,
        estimate_line_item_uuid: lineItemUuid,
        location_uuid: r.location_uuid,
        amount: toNum(r.amount),
        sequence: r.sequence ?? idx + 1,
      }))
      await prisma.estimateLocationWiseMaterial.createMany({ data: lwmRows })
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function listEstimates(
  corporationUuid: string,
  projectUuid?: string,
  page = 1,
  pageSize = 100,
) {
  const where: any = { corporation_uuid: corporationUuid, is_active: true }
  if (projectUuid) where.project_uuid = projectUuid

  const [total, rows] = await Promise.all([
    prisma.estimate.count({ where }),
    prisma.estimate.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  // Load project names in batch
  const projectUuids = [...new Set(rows.map(r => r.project_uuid))]
  const projects = await prisma.project.findMany({
    where: { uuid: { in: projectUuids } },
    select: { uuid: true, project_name: true, project_id: true },
  })
  const projectMap: Record<string, any> = {}
  for (const p of projects) projectMap[p.uuid] = p

  const totalPages = Math.ceil(total / pageSize)
  return {
    data: rows.map(r => mapEstimateRow(r, projectMap[r.project_uuid] ?? null)),
    pagination: { page, pageSize, totalRecords: total, totalPages, hasMore: page < totalPages },
  }
}

export async function getEstimate(uuid: string) {
  const row = await prisma.estimate.findFirst({ where: { uuid, is_active: true } })
  if (!row) return null

  const project = await prisma.project.findFirst({
    where: { uuid: row.project_uuid },
    select: { uuid: true, project_name: true, project_id: true },
  })

  const { lineItems, materialItemsByLi, lwLaborByLi, lwMaterialByLi } = await loadLineItemsForEstimate(uuid)

  const mapped = mapEstimateRow(row, project)
  mapped.line_items = lineItems.map(li => mapLineItemRow(li, materialItemsByLi, lwLaborByLi, lwMaterialByLi))
  return mapped
}

export async function createEstimate(input: CreateEstimateInput) {
  // Auto-generate estimate number if not provided or conflicts
  let estimateNumber = input.estimate_number
  if (!estimateNumber) {
    estimateNumber = await generateEstimateNumber(input.corporation_uuid)
  } else {
    const conflict = await prisma.estimate.findFirst({
      where: { corporation_uuid: input.corporation_uuid, estimate_number: estimateNumber, is_active: true },
    })
    if (conflict) estimateNumber = await generateEstimateNumber(input.corporation_uuid)
  }

  // Build initial audit log entry
  const auditEntry = input.user_id ? [{
    timestamp: new Date().toISOString(),
    user_uuid: input.user_id,
    user_name: input.user_name ?? 'Unknown User',
    user_email: input.user_email ?? '',
    user_image_url: input.user_image_url ?? null,
    action: 'created',
    description: `Estimate ${estimateNumber} created`,
  }] : []

  const estimate = await prisma.estimate.create({
    data: {
      corporation_uuid: input.corporation_uuid,
      project_uuid: input.project_uuid,
      estimate_number: estimateNumber,
      estimate_date: parseDate(input.estimate_date),
      valid_until: parseDate(input.valid_until),
      status: input.status ?? 'Draft',
      total_amount: toNum(input.total_amount),
      tax_amount: toNum(input.tax_amount),
      discount_amount: toNum(input.discount_amount),
      final_amount: toNum(input.final_amount),
      notes: input.notes ?? null,
      attachments: stringifyJson(input.attachments ?? []),
      removed_cost_code_uuids: stringifyJson(input.removed_cost_code_uuids ?? []),
      audit_log: stringifyJson(auditEntry),
      is_active: true,
    },
  })

  if (Array.isArray(input.line_items) && input.line_items.length > 0) {
    await insertLineItems(input.line_items, estimate.uuid, input.corporation_uuid, input.project_uuid)
  }

  return getEstimate(estimate.uuid)
}

export async function updateEstimate(input: UpdateEstimateInput) {
  const existing = await prisma.estimate.findFirst({
    where: { uuid: input.uuid, is_active: true },
    select: { uuid: true, corporation_uuid: true, project_uuid: true, estimate_number: true, status: true, audit_log: true },
  })
  if (!existing) return null

  // Duplicate estimate number check
  if (input.estimate_number && input.estimate_number !== existing.estimate_number) {
    const dup = await prisma.estimate.findFirst({
      where: { corporation_uuid: existing.corporation_uuid, estimate_number: input.estimate_number, is_active: true, NOT: { uuid: input.uuid } },
    })
    if (dup) throw createError({ statusCode: 409, statusMessage: 'Estimate number already exists for this corporation' })
  }

  // Build audit log entry
  const existingLog = parseJson<any[]>(existing.audit_log as string, [])
  const oldStatus = existing.status
  const newStatus = input.status ?? oldStatus
  let auditEntry: any = null
  if (input.user_id) {
    const base = { timestamp: new Date().toISOString(), user_uuid: input.user_id, user_name: input.user_name ?? 'Unknown', user_email: input.user_email ?? '', user_image_url: input.user_image_url ?? null }
    if (oldStatus !== newStatus) {
      if (newStatus === 'Ready') auditEntry = { ...base, action: 'marked_ready', description: 'Estimate marked as ready' }
      else if (newStatus === 'Approved') auditEntry = { ...base, action: 'approved', description: 'Estimate approved' }
      else if (oldStatus === 'Approved') auditEntry = { ...base, action: 'unapproved', description: 'Estimate unapproved' }
    } else {
      const hasChanges = Object.keys(input).some(k => !['status', 'uuid', 'user_id', 'user_name', 'user_email', 'user_image_url'].includes(k))
      if (hasChanges) auditEntry = { ...base, action: 'updated', description: 'Estimate updated' }
    }
  }
  const mergedLog = auditEntry ? [...existingLog, auditEntry] : existingLog

  const updateData: any = {}
  if (input.estimate_number !== undefined) updateData.estimate_number = input.estimate_number
  if (input.estimate_date !== undefined) updateData.estimate_date = parseDate(input.estimate_date)
  if (input.valid_until !== undefined) updateData.valid_until = parseDate(input.valid_until)
  if (input.status !== undefined) updateData.status = input.status
  if (input.total_amount !== undefined) updateData.total_amount = toNum(input.total_amount)
  if (input.tax_amount !== undefined) updateData.tax_amount = toNum(input.tax_amount)
  if (input.discount_amount !== undefined) updateData.discount_amount = toNum(input.discount_amount)
  if (input.final_amount !== undefined) updateData.final_amount = toNum(input.final_amount)
  if (input.notes !== undefined) updateData.notes = input.notes ?? null
  if (input.attachments !== undefined) updateData.attachments = stringifyJson(input.attachments)
  if (input.removed_cost_code_uuids !== undefined) updateData.removed_cost_code_uuids = stringifyJson(input.removed_cost_code_uuids)
  if (auditEntry) updateData.audit_log = stringifyJson(mergedLog)

  await prisma.estimate.update({ where: { uuid: input.uuid }, data: updateData })

  // Replace line items if provided
  if (Array.isArray(input.line_items)) {
    // Delete all related data (CASCADE handles children of line items)
    await prisma.estimateLineItem.deleteMany({ where: { estimate_uuid: input.uuid } })
    if (input.line_items.length > 0) {
      await insertLineItems(input.line_items, input.uuid, existing.corporation_uuid, existing.project_uuid)
    }
  }

  return getEstimate(input.uuid)
}

export async function deleteEstimate(uuid: string) {
  const row = await prisma.estimate.findFirst({ where: { uuid, is_active: true } })
  if (!row) return null
  await prisma.estimate.update({ where: { uuid }, data: { is_active: false } })
  return row
}

export async function getEstimateLineItems(
  estimateUuid: string,
  projectUuid: string,
  corporationUuid: string,
) {
  const lineItems = await prisma.estimateLineItem.findMany({
    where: { estimate_uuid: estimateUuid, project_uuid: projectUuid, corporation_uuid: corporationUuid },
    orderBy: { id: 'asc' },
  })
  const lineItemUuids = lineItems.map(li => li.uuid)
  if (lineItemUuids.length === 0) return []

  const [materialItems, lwLabor, lwMaterial] = await Promise.all([
    prisma.estimateMaterialItem.findMany({
      where: { estimate_line_item_uuid: { in: lineItemUuids }, is_active: true },
      orderBy: { sequence: 'asc' },
    }),
    prisma.estimateLocationWiseLabor.findMany({
      where: { estimate_line_item_uuid: { in: lineItemUuids } },
      orderBy: [{ estimate_line_item_uuid: 'asc' }, { sequence: 'asc' }],
    }),
    prisma.estimateLocationWiseMaterial.findMany({
      where: { estimate_line_item_uuid: { in: lineItemUuids } },
      orderBy: [{ estimate_line_item_uuid: 'asc' }, { sequence: 'asc' }],
    }),
  ])

  const itemUuids = [...new Set(materialItems.map(m => m.item_uuid).filter(Boolean) as string[])]
  const preferredItemsMap: Record<string, any> = {}
  if (itemUuids.length > 0) {
    const pis = await prisma.costCodePreferredItem.findMany({
      where: { uuid: { in: itemUuids } },
      select: { uuid: true, item_name: true, item_sequence: true, model_number: true, unit_price: true, uom_uuid: true, description: true },
    })
    for (const pi of pis) preferredItemsMap[pi.uuid] = pi
  }

  const materialItemsByLi: Record<string, any[]> = {}
  for (const m of materialItems) {
    const li = m.estimate_line_item_uuid
    if (!materialItemsByLi[li]) materialItemsByLi[li] = []
    const pi = m.item_uuid ? preferredItemsMap[m.item_uuid] : undefined
    materialItemsByLi[li].push(mapMaterialItemRow(m, pi))
  }

  const lwLaborByLi: Record<string, any[]> = {}
  for (const r of lwLabor) {
    const li = r.estimate_line_item_uuid
    if (!lwLaborByLi[li]) lwLaborByLi[li] = []
    lwLaborByLi[li].push({ breakdown_uuid: r.uuid, location_uuid: r.location_uuid, area_sq_ft: toNum(r.area_sq_ft), no_of_rooms: toNum(r.no_of_rooms), num_hours: toNum(r.num_hours), amount_per_sqft: toNum(r.amount_per_sqft), amount_per_room: toNum(r.amount_per_room), hourly_wage: toNum(r.hourly_wage), amount: toNum(r.amount) })
  }

  const lwMaterialByLi: Record<string, any[]> = {}
  for (const r of lwMaterial) {
    const li = r.estimate_line_item_uuid
    if (!lwMaterialByLi[li]) lwMaterialByLi[li] = []
    lwMaterialByLi[li].push({ breakdown_uuid: r.uuid, location_uuid: r.location_uuid, amount: toNum(r.amount) })
  }

  // Check if project is location-wise
  const project = await prisma.project.findFirst({ where: { uuid: projectUuid }, select: { enable_location_wise: true } })

  return {
    data: lineItems.map(li => ({
      id: String(li.id),
      uuid: li.uuid,
      cost_code_uuid: li.cost_code_uuid,
      cost_code_number: li.cost_code_number ?? '',
      cost_code_name: li.cost_code_name ?? '',
      division_name: li.division_name ?? '',
      description: li.description ?? '',
      labor_amount: toNum(li.labor_amount),
      material_amount: toNum(li.material_amount),
      total_amount: toNum(li.total_amount),
      material_items: materialItemsByLi[li.uuid] ?? [],
      location_wise_labor: lwLaborByLi[li.uuid] ?? [],
      location_wise_material: lwMaterialByLi[li.uuid] ?? [],
    })),
    project_enable_location_wise: project?.enable_location_wise ?? false,
  }
}
