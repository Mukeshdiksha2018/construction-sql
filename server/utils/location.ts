import { Prisma } from '@prisma/client'
import { createError } from 'h3'
import { getPrisma } from './prisma'

export interface Location {
  id: number
  uuid: string
  location_name: string
  location_code: string | null
  description: string | null
  active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface CreateLocationInput {
  location_name: string
  location_code?: string | null
  description?: string | null
  active?: boolean
}

export interface UpdateLocationInput {
  location_name: string
  location_code?: string | null
  description?: string | null
  active: boolean
}

type LocationRecord = {
  id: bigint
  uuid: string
  location_name: string
  location_code: string | null
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

export function mapLocationRow(row: LocationRecord): Location {
  return {
    id: Number(row.id),
    uuid: normalizeUuid(row.uuid),
    location_name: row.location_name,
    location_code: row.location_code ?? null,
    description: row.description ?? null,
    active: Boolean(row.active),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    created_by: row.created_by ?? null,
    updated_by: row.updated_by ?? null,
  }
}

export function isDuplicateLocationError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

export async function listLocation(): Promise<Location[]> {
  const rows = await getPrisma().location.findMany({
    orderBy: { created_at: 'desc' },
  })
  return rows.map(mapLocationRow)
}

export async function createLocation(
  input: CreateLocationInput,
  userId?: string | null,
): Promise<Location> {
  const locationName = input.location_name.trim()
  const locationCode = input.location_code?.trim() || null
  const description = input.description?.trim() || null
  const active = input.active ?? true

  try {
    const row = await getPrisma().location.create({
      data: {
        location_name: locationName,
        location_code: locationCode,
        description,
        active,
        created_by: userId ?? null,
        updated_by: userId ?? null,
      },
    })
    return mapLocationRow(row)
  }
  catch (err: unknown) {
    if (isDuplicateLocationError(err)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Location already exists',
      })
    }
    throw err
  }
}

export async function updateLocation(
  uuid: string,
  input: UpdateLocationInput,
  userId?: string | null,
): Promise<Location> {
  const locationName = input.location_name.trim()
  const locationCode = input.location_code?.trim() || null
  const description = input.description?.trim() || null

  try {
    const row = await getPrisma().location.update({
      where: { uuid: normalizeUuid(uuid) },
      data: {
        location_name: locationName,
        location_code: locationCode,
        description,
        active: input.active,
        updated_by: userId ?? null,
      },
    })
    return mapLocationRow(row)
  }
  catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Location not found' })
    }
    if (isDuplicateLocationError(err)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Location already exists',
      })
    }
    throw err
  }
}

export async function deleteLocation(uuid: string): Promise<void> {
  try {
    await getPrisma().location.delete({
      where: { uuid: normalizeUuid(uuid) },
    })
  }
  catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Location not found' })
    }
    throw err
  }
}

export function parseLocationBody(body: unknown): CreateLocationInput {
  const payload = (body ?? {}) as Record<string, unknown>
  const location_name = typeof payload.location_name === 'string' ? payload.location_name : ''
  const location_code = typeof payload.location_code === 'string' ? payload.location_code : null
  const description = typeof payload.description === 'string' ? payload.description : null
  const active = payload.active

  if (!location_name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Location Name is required' })
  }
  if (active !== undefined && typeof active !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Active must be a boolean value' })
  }

  return { location_name, location_code, description, active: active ?? true }
}

export function parseLocationUpdateBody(body: unknown): UpdateLocationInput {
  const payload = (body ?? {}) as Record<string, unknown>
  const location_name = typeof payload.location_name === 'string' ? payload.location_name : ''
  const location_code = typeof payload.location_code === 'string' ? payload.location_code : null
  const description = typeof payload.description === 'string' ? payload.description : null
  const active = payload.active

  if (!location_name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Location Name is required' })
  }
  if (typeof active !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Active must be a boolean value' })
  }

  return { location_name, location_code, description, active }
}
