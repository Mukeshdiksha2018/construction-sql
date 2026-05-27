import { Prisma } from '@prisma/client'
import { createError } from 'h3'
import { getPrisma } from './prisma'

export interface Freight {
  id: number
  uuid: string
  freight_name: string
  description: string | null
  active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface CreateFreightInput {
  freight_name: string
  description?: string | null
  active?: boolean
}

export interface UpdateFreightInput {
  freight_name: string
  description?: string | null
  active: boolean
}

type FreightRecord = {
  id: bigint
  uuid: string
  freight_name: string
  description: string | null
  active: boolean
  created_at: Date
  updated_at: Date
  created_by: string | null
  updated_by: string | null
}

function normalizeUuid(value: string): string {
  return String(value).toLowerCase()
}

export function mapFreightRow(row: FreightRecord): Freight {
  return {
    id: Number(row.id),
    uuid: normalizeUuid(row.uuid),
    freight_name: row.freight_name,
    description: row.description ?? null,
    active: Boolean(row.active),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    created_by: row.created_by ?? null,
    updated_by: row.updated_by ?? null,
  }
}

export function isDuplicateFreightError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

export async function listFreight(): Promise<Freight[]> {
  const rows = await getPrisma().freight.findMany({
    orderBy: { created_at: 'desc' },
  })
  return rows.map(mapFreightRow)
}

export async function createFreight(
  input: CreateFreightInput,
  userId?: string | null,
): Promise<Freight> {
  const freightName = input.freight_name.trim()
  const description = input.description?.trim() || null
  const active = input.active ?? true

  try {
    const row = await getPrisma().freight.create({
      data: {
        freight_name: freightName,
        description,
        active,
        created_by: userId ?? null,
        updated_by: userId ?? null,
      },
    })
    return mapFreightRow(row)
  }
  catch (err: unknown) {
    if (isDuplicateFreightError(err)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Freight entry with this name already exists',
      })
    }
    throw err
  }
}

export async function updateFreight(
  uuid: string,
  input: UpdateFreightInput,
  userId?: string | null,
): Promise<Freight> {
  const freightName = input.freight_name.trim()
  const description = input.description?.trim() || null

  try {
    const row = await getPrisma().freight.update({
      where: { uuid: normalizeUuid(uuid) },
      data: {
        freight_name: freightName,
        description,
        active: input.active,
        updated_by: userId ?? null,
      },
    })
    return mapFreightRow(row)
  }
  catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Freight not found' })
    }
    if (isDuplicateFreightError(err)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Freight entry with this name already exists',
      })
    }
    throw err
  }
}

export async function deleteFreight(uuid: string): Promise<void> {
  try {
    await getPrisma().freight.delete({
      where: { uuid: normalizeUuid(uuid) },
    })
  }
  catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Freight not found' })
    }
    throw err
  }
}

export function parseFreightBody(body: unknown): CreateFreightInput {
  const payload = (body ?? {}) as Record<string, unknown>
  const freight_name = typeof payload.freight_name === 'string' ? payload.freight_name : ''
  const description = typeof payload.description === 'string' ? payload.description : null
  const active = payload.active

  if (!freight_name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Freight name is required' })
  }
  if (active !== undefined && typeof active !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Active must be a boolean value' })
  }

  return { freight_name, description, active: active ?? true }
}

export function parseFreightUpdateBody(body: unknown): UpdateFreightInput {
  const payload = (body ?? {}) as Record<string, unknown>
  const freight_name = typeof payload.freight_name === 'string' ? payload.freight_name : ''
  const description = typeof payload.description === 'string' ? payload.description : null
  const active = payload.active

  if (!freight_name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Freight name is required' })
  }
  if (typeof active !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Active must be a boolean value' })
  }

  return { freight_name, description, active }
}
