import { Prisma } from '@prisma/client'
import { createError } from 'h3'
import { getPrisma } from './prisma'

export interface PreferredItem {
  id: number
  uuid: string
  corporation_uuid: string
  project_uuid: string | null
  cost_code_configuration_uuid: string | null
  item_type_uuid: string | null
  category: string | null
  item_name: string
  item_sequence: string | null
  model_number: string | null
  unit_price: number | null
  uom_uuid: string | null
  location_uuid: string | null
  preferred_vendor_uuid: string | null
  initial_quantity: number | null
  as_of_date: string | null
  reorder_point: number | null
  maximum_limit: number | null
  description: string | null
  status: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreatePreferredItemInput {
  corporation_uuid: string
  project_uuid?: string | null
  cost_code_configuration_uuid?: string | null
  item_type_uuid?: string | null
  category?: string | null
  item_name: string
  item_sequence?: string | null
  model_number?: string | null
  unit_price?: number | null
  uom_uuid?: string | null
  location_uuid?: string | null
  preferred_vendor_uuid?: string | null
  initial_quantity?: number | null
  as_of_date?: string | null
  reorder_point?: number | null
  maximum_limit?: number | null
  description?: string | null
  status?: string
  is_active?: boolean
}

export type UpdatePreferredItemInput = Partial<Omit<CreatePreferredItemInput, 'corporation_uuid'>>

type Row = NonNullable<Awaited<ReturnType<ReturnType<typeof getPrisma>['costCodePreferredItem']['findFirst']>>>

function dec(v: Prisma.Decimal | null | undefined): number | null {
  return v != null ? Number(v) : null
}

function mapRow(row: Row): PreferredItem {
  return {
    id: Number(row.id),
    uuid: String(row.uuid).toLowerCase(),
    corporation_uuid: String(row.corporation_uuid).toLowerCase(),
    project_uuid: row.project_uuid ? String(row.project_uuid).toLowerCase() : null,
    cost_code_configuration_uuid: row.cost_code_configuration_uuid ? String(row.cost_code_configuration_uuid).toLowerCase() : null,
    item_type_uuid: row.item_type_uuid ? String(row.item_type_uuid).toLowerCase() : null,
    category: row.category ?? null,
    item_name: row.item_name,
    item_sequence: row.item_sequence ?? null,
    model_number: row.model_number ?? null,
    unit_price: dec(row.unit_price),
    uom_uuid: row.uom_uuid ?? null,
    location_uuid: row.location_uuid ? String(row.location_uuid).toLowerCase() : null,
    preferred_vendor_uuid: row.preferred_vendor_uuid ? String(row.preferred_vendor_uuid).toLowerCase() : null,
    initial_quantity: dec(row.initial_quantity),
    as_of_date: row.as_of_date ? row.as_of_date.toISOString() : null,
    reorder_point: dec(row.reorder_point),
    maximum_limit: dec(row.maximum_limit),
    description: row.description ?? null,
    status: row.status,
    is_active: Boolean(row.is_active),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }
}

function toDecimal(v: number | null | undefined) {
  return v != null ? new Prisma.Decimal(v) : null
}

export async function listPreferredItems(corporationUuid: string, projectUuid?: string): Promise<PreferredItem[]> {
  const rows = await getPrisma().costCodePreferredItem.findMany({
    where: {
      corporation_uuid: corporationUuid.toLowerCase(),
      ...(projectUuid && { project_uuid: projectUuid.toLowerCase() }),
    },
    orderBy: { created_at: 'desc' },
  })
  return rows.map(row => mapRow(row as Row))
}

export async function getPreferredItemsByProjectAndItemType(
  corporationUuid: string,
  projectUuid: string,
  itemTypeUuid: string,
  costCodeConfigurationUuid?: string,
): Promise<PreferredItem[]> {
  const rows = await getPrisma().costCodePreferredItem.findMany({
    where: {
      corporation_uuid: corporationUuid.toLowerCase(),
      project_uuid: projectUuid.toLowerCase(),
      item_type_uuid: itemTypeUuid.toLowerCase(),
      ...(costCodeConfigurationUuid && {
        cost_code_configuration_uuid: costCodeConfigurationUuid.toLowerCase(),
      }),
    },
    orderBy: { created_at: 'asc' },
  })
  return rows.map(row => mapRow(row as Row))
}

export async function getPreferredItemByUuid(uuid: string): Promise<PreferredItem | null> {
  const row = await getPrisma().costCodePreferredItem.findUnique({ where: { uuid: uuid.toLowerCase() } })
  return row ? mapRow(row as Row) : null
}

export async function createPreferredItem(input: CreatePreferredItemInput): Promise<PreferredItem> {
  const name = String(input.item_name).trim()
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Item name is required' })
  if (!input.corporation_uuid) throw createError({ statusCode: 400, statusMessage: 'Corporation UUID is required' })

  const asOfDate = input.as_of_date ? new Date(input.as_of_date) : null

  const row = await getPrisma().costCodePreferredItem.create({
    data: {
      corporation_uuid: input.corporation_uuid.toLowerCase(),
      project_uuid: input.project_uuid?.toLowerCase() ?? null,
      cost_code_configuration_uuid: input.cost_code_configuration_uuid?.toLowerCase() ?? null,
      item_type_uuid: input.item_type_uuid?.toLowerCase() ?? null,
      category: input.category ?? null,
      item_name: name,
      item_sequence: input.item_sequence?.trim() ?? null,
      model_number: input.model_number?.trim() ?? null,
      unit_price: toDecimal(input.unit_price),
      uom_uuid: input.uom_uuid?.trim() ?? null,
      location_uuid: input.location_uuid?.toLowerCase() ?? null,
      preferred_vendor_uuid: input.preferred_vendor_uuid?.toLowerCase() ?? null,
      initial_quantity: toDecimal(input.initial_quantity),
      as_of_date: asOfDate,
      reorder_point: toDecimal(input.reorder_point),
      maximum_limit: toDecimal(input.maximum_limit),
      description: input.description?.trim() ?? null,
      status: input.status ?? 'Active',
      is_active: input.is_active ?? true,
    },
  })
  return mapRow(row as Row)
}

export async function updatePreferredItem(uuid: string, input: UpdatePreferredItemInput): Promise<PreferredItem> {
  const existing = await getPrisma().costCodePreferredItem.findUnique({ where: { uuid: uuid.toLowerCase() } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Item not found' })

  const row = await getPrisma().costCodePreferredItem.update({
    where: { uuid: uuid.toLowerCase() },
    data: {
      ...(input.project_uuid !== undefined && { project_uuid: input.project_uuid?.toLowerCase() ?? null }),
      ...(input.cost_code_configuration_uuid !== undefined && { cost_code_configuration_uuid: input.cost_code_configuration_uuid?.toLowerCase() ?? null }),
      ...(input.item_type_uuid !== undefined && { item_type_uuid: input.item_type_uuid?.toLowerCase() ?? null }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.item_name !== undefined && { item_name: String(input.item_name).trim() }),
      ...(input.item_sequence !== undefined && { item_sequence: input.item_sequence?.trim() ?? null }),
      ...(input.model_number !== undefined && { model_number: input.model_number?.trim() ?? null }),
      ...(input.unit_price !== undefined && { unit_price: toDecimal(input.unit_price) }),
      ...(input.uom_uuid !== undefined && { uom_uuid: input.uom_uuid?.trim() ?? null }),
      ...(input.location_uuid !== undefined && { location_uuid: input.location_uuid?.toLowerCase() ?? null }),
      ...(input.preferred_vendor_uuid !== undefined && { preferred_vendor_uuid: input.preferred_vendor_uuid?.toLowerCase() ?? null }),
      ...(input.initial_quantity !== undefined && { initial_quantity: toDecimal(input.initial_quantity) }),
      ...(input.as_of_date !== undefined && { as_of_date: input.as_of_date ? new Date(input.as_of_date) : null }),
      ...(input.reorder_point !== undefined && { reorder_point: toDecimal(input.reorder_point) }),
      ...(input.maximum_limit !== undefined && { maximum_limit: toDecimal(input.maximum_limit) }),
      ...(input.description !== undefined && { description: input.description?.trim() ?? null }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.is_active !== undefined && { is_active: input.is_active }),
    },
  })
  return mapRow(row as Row)
}

export async function deletePreferredItem(uuid: string): Promise<void> {
  try {
    await getPrisma().costCodePreferredItem.delete({ where: { uuid: uuid.toLowerCase() } })
  }
  catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Item not found' })
    }
    throw err
  }
}

export async function bulkSavePreferredItems(
  rows: CreatePreferredItemInput[],
  projectUuid: string,
  itemTypeUuid: string,
  corporationUuid: string,
): Promise<PreferredItem[]> {
  const results: PreferredItem[] = []
  for (const row of rows) {
    const item = await createPreferredItem({
      ...row,
      corporation_uuid: corporationUuid,
      project_uuid: projectUuid,
      item_type_uuid: itemTypeUuid,
    })
    results.push(item)
  }
  return results
}
