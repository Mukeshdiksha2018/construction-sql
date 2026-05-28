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
  unit_price: number | null
  unit: string | null
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
  unit_price?: number | null
  unit?: string | null
  description?: string | null
  status?: string
  is_active?: boolean
}

export interface UpdatePreferredItemInput extends Partial<Omit<CreatePreferredItemInput, 'corporation_uuid'>> {}

type Row = Awaited<ReturnType<typeof getPrisma>['costCodePreferredItem']['findFirst']> & object

function mapRow(row: Row): PreferredItem {
  return {
    id: Number(row.id),
    uuid: String(row.uuid).toLowerCase(),
    corporation_uuid: String(row.corporation_uuid).toLowerCase(),
    project_uuid: row.project_uuid ? String(row.project_uuid).toLowerCase() : null,
    cost_code_configuration_uuid: row.cost_code_configuration_uuid
      ? String(row.cost_code_configuration_uuid).toLowerCase()
      : null,
    item_type_uuid: row.item_type_uuid ? String(row.item_type_uuid).toLowerCase() : null,
    category: row.category ?? null,
    item_name: row.item_name,
    unit_price: row.unit_price != null ? Number(row.unit_price) : null,
    unit: row.unit ?? null,
    description: row.description ?? null,
    status: row.status,
    is_active: Boolean(row.is_active),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }
}

export async function listPreferredItems(
  corporationUuid: string,
  projectUuid?: string,
): Promise<PreferredItem[]> {
  const rows = await getPrisma().costCodePreferredItem.findMany({
    where: {
      corporation_uuid: corporationUuid.toLowerCase(),
      ...(projectUuid && { project_uuid: projectUuid.toLowerCase() }),
    },
    orderBy: { created_at: 'desc' },
  })
  return rows.map(row => mapRow(row as Row))
}

export async function getPreferredItemByUuid(uuid: string): Promise<PreferredItem | null> {
  const row = await getPrisma().costCodePreferredItem.findUnique({
    where: { uuid: uuid.toLowerCase() },
  })
  return row ? mapRow(row as Row) : null
}

export async function createPreferredItem(input: CreatePreferredItemInput): Promise<PreferredItem> {
  const name = String(input.item_name).trim()
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Item name is required' })
  if (!input.corporation_uuid) throw createError({ statusCode: 400, statusMessage: 'Corporation UUID is required' })

  const row = await getPrisma().costCodePreferredItem.create({
    data: {
      corporation_uuid: input.corporation_uuid.toLowerCase(),
      project_uuid: input.project_uuid?.toLowerCase() ?? null,
      cost_code_configuration_uuid: input.cost_code_configuration_uuid?.toLowerCase() ?? null,
      item_type_uuid: input.item_type_uuid?.toLowerCase() ?? null,
      category: input.category ?? null,
      item_name: name,
      unit_price: input.unit_price != null ? new Prisma.Decimal(input.unit_price) : null,
      unit: input.unit?.trim() ?? null,
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
      ...(input.cost_code_configuration_uuid !== undefined && {
        cost_code_configuration_uuid: input.cost_code_configuration_uuid?.toLowerCase() ?? null,
      }),
      ...(input.item_type_uuid !== undefined && { item_type_uuid: input.item_type_uuid?.toLowerCase() ?? null }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.item_name !== undefined && { item_name: String(input.item_name).trim() }),
      ...(input.unit_price !== undefined && {
        unit_price: input.unit_price != null ? new Prisma.Decimal(input.unit_price) : null,
      }),
      ...(input.unit !== undefined && { unit: input.unit?.trim() ?? null }),
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
