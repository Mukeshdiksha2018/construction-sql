import { Prisma } from '@prisma/client'
import { createError } from 'h3'
import { getPrisma } from './prisma'

export interface ItemType {
  id: number
  uuid: string
  corporation_uuid: string | null
  category: string
  spec_type: string
  item_division_uuid: string | null
  item_type: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateItemTypeInput {
  corporation_uuid?: string | null
  category: string
  spec_type: string
  item_division_uuid?: string | null
  item_type: string
  description?: string | null
  is_active?: boolean
}

export interface UpdateItemTypeInput {
  corporation_uuid?: string | null
  category?: string
  spec_type?: string
  item_division_uuid?: string | null
  item_type?: string
  description?: string | null
  is_active?: boolean
}

type ItemTypeRecord = {
  id: bigint
  uuid: string
  corporation_uuid: string | null
  category: string
  spec_type: string
  item_division_uuid: string | null
  item_type: string
  description: string | null
  is_active: boolean
  created_at: Date
  updated_at: Date
}

const VALID_CATEGORIES = ['procurement', 'construction']

function mapRow(row: ItemTypeRecord): ItemType {
  return {
    id: Number(row.id),
    uuid: String(row.uuid).toLowerCase(),
    corporation_uuid: row.corporation_uuid ? String(row.corporation_uuid).toLowerCase() : null,
    category: row.category,
    spec_type: row.spec_type,
    item_division_uuid: row.item_division_uuid ? String(row.item_division_uuid).toLowerCase() : null,
    item_type: row.item_type,
    description: row.description ?? null,
    is_active: Boolean(row.is_active),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }
}

export async function listItemTypes(corporationUuid?: string): Promise<ItemType[]> {
  const where = corporationUuid
    ? { OR: [{ corporation_uuid: corporationUuid.toLowerCase() }, { corporation_uuid: null }] }
    : {}

  const rows = await getPrisma().itemType.findMany({
    where,
    orderBy: { item_type: 'asc' },
  })
  return rows.map(mapRow)
}

export async function getItemTypeByUuid(uuid: string): Promise<ItemType | null> {
  const row = await getPrisma().itemType.findUnique({ where: { uuid: uuid.toLowerCase() } })
  return row ? mapRow(row) : null
}

export async function createItemType(input: CreateItemTypeInput): Promise<ItemType> {
  const cat = String(input.category).toLowerCase()
  if (!VALID_CATEGORIES.includes(cat)) {
    throw createError({ statusCode: 400, statusMessage: 'Category must be procurement or construction' })
  }

  const specType = String(input.spec_type).trim()
  if (!specType) throw createError({ statusCode: 400, statusMessage: 'Spec Type is required' })

  const itemTypeName = String(input.item_type).trim()
  if (!itemTypeName) throw createError({ statusCode: 400, statusMessage: 'Item Type name is required' })

  const divisionUuid = input.item_division_uuid?.trim() || null

  // Check duplicate
  const existing = await getPrisma().itemType.findFirst({
    where: {
      item_type: itemTypeName,
      category: cat,
      spec_type: specType,
      item_division_uuid: divisionUuid,
    },
  })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Item type with this name already exists for this category, spec type, and division' })
  }

  const row = await getPrisma().itemType.create({
    data: {
      corporation_uuid: input.corporation_uuid?.toLowerCase() ?? null,
      category: cat,
      spec_type: specType,
      item_division_uuid: divisionUuid,
      item_type: itemTypeName,
      description: input.description?.trim() ?? null,
      is_active: input.is_active ?? true,
    },
  })
  return mapRow(row)
}

export async function updateItemType(uuid: string, input: UpdateItemTypeInput): Promise<ItemType> {
  const existing = await getPrisma().itemType.findUnique({ where: { uuid: uuid.toLowerCase() } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Item type not found' })

  const cat = input.category ? String(input.category).toLowerCase() : existing.category
  if (!VALID_CATEGORIES.includes(cat)) {
    throw createError({ statusCode: 400, statusMessage: 'Category must be procurement or construction' })
  }

  const specType = input.spec_type !== undefined ? String(input.spec_type).trim() : existing.spec_type
  const itemTypeName = input.item_type !== undefined ? String(input.item_type).trim() : existing.item_type
  const divisionUuid = input.item_division_uuid !== undefined
    ? (input.item_division_uuid?.trim() || null)
    : existing.item_division_uuid

  // Duplicate check (exclude self)
  const isDifferent = itemTypeName !== existing.item_type
    || specType !== existing.spec_type
    || cat !== existing.category
    || divisionUuid !== existing.item_division_uuid

  if (isDifferent) {
    const dup = await getPrisma().itemType.findFirst({
      where: {
        item_type: itemTypeName,
        category: cat,
        spec_type: specType,
        item_division_uuid: divisionUuid,
        uuid: { not: uuid.toLowerCase() },
      },
    })
    if (dup) throw createError({ statusCode: 409, statusMessage: 'Item type with this name already exists for this category, spec type, and division' })
  }

  const row = await getPrisma().itemType.update({
    where: { uuid: uuid.toLowerCase() },
    data: {
      ...(input.corporation_uuid !== undefined && { corporation_uuid: input.corporation_uuid?.toLowerCase() ?? null }),
      category: cat,
      spec_type: specType,
      item_division_uuid: divisionUuid,
      item_type: itemTypeName,
      ...(input.description !== undefined && { description: input.description?.trim() ?? null }),
      ...(input.is_active !== undefined && { is_active: input.is_active }),
    },
  })
  return mapRow(row)
}

export async function deleteItemType(uuid: string): Promise<void> {
  try {
    await getPrisma().itemType.delete({ where: { uuid: uuid.toLowerCase() } })
  }
  catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Item type not found' })
    }
    throw err
  }
}
