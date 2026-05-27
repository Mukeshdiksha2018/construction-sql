import { Prisma } from '@prisma/client'
import { createError } from 'h3'
import { getPrisma } from './prisma'

export interface ProjectType {
  id: number
  uuid: string
  name: string
  description: string | null
  color: string
  isActive: boolean
  created_at: string
  updated_at: string
}

export interface CreateProjectTypeInput {
  name: string
  description?: string | null
  color?: string
  isActive?: boolean
}

export interface UpdateProjectTypeInput {
  name?: string
  description?: string | null
  color?: string
  isActive?: boolean
}

type ProjectTypeRecord = {
  id: bigint
  uuid: string
  name: string
  description: string | null
  color: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/i

function normalizeUuid(value: string): string {
  return String(value).toLowerCase()
}

function normalizeColor(value?: string): string {
  const color = String(value || '#3B82F6').trim()
  if (!HEX_COLOR_REGEX.test(color)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Color must be a valid HEX value like #3B82F6',
    })
  }
  return color.toUpperCase()
}

function toApiProjectType(row: ProjectTypeRecord): ProjectType {
  return {
    id: Number(row.id),
    uuid: normalizeUuid(row.uuid),
    name: row.name,
    description: row.description ?? null,
    color: row.color,
    isActive: Boolean(row.is_active),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export function parseProjectTypeBody(body: unknown): CreateProjectTypeInput {
  const payload = (body ?? {}) as Record<string, unknown>
  const name = typeof payload.name === 'string' ? payload.name.trim() : ''
  const description = typeof payload.description === 'string' ? payload.description.trim() : null
  const color = payload.color === undefined ? '#3B82F6' : normalizeColor(String(payload.color))
  const isActive = payload.isActive

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'isActive must be a boolean value' })
  }

  return {
    name,
    description: description || null,
    color,
    isActive: isActive ?? true,
  }
}

export function parseProjectTypeUpdateBody(body: unknown): UpdateProjectTypeInput {
  const payload = (body ?? {}) as Record<string, unknown>
  const result: UpdateProjectTypeInput = {}

  if (payload.name !== undefined) {
    const name = typeof payload.name === 'string' ? payload.name.trim() : ''
    if (!name) {
      throw createError({ statusCode: 400, statusMessage: 'Name is required' })
    }
    result.name = name
  }

  if (payload.description !== undefined) {
    result.description = typeof payload.description === 'string' ? payload.description.trim() || null : null
  }

  if (payload.color !== undefined) {
    result.color = normalizeColor(String(payload.color))
  }

  if (payload.isActive !== undefined) {
    if (typeof payload.isActive !== 'boolean') {
      throw createError({ statusCode: 400, statusMessage: 'isActive must be a boolean value' })
    }
    result.isActive = payload.isActive
  }

  if (
    result.name === undefined
    && result.description === undefined
    && result.color === undefined
    && result.isActive === undefined
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'At least one field is required for update',
    })
  }

  return result
}

export async function listProjectTypes(): Promise<ProjectType[]> {
  const rows = await getPrisma().projectType.findMany({
    orderBy: { name: 'asc' },
  })
  return rows.map(toApiProjectType)
}

export async function listProjectTypeOptions(): Promise<Array<{ uuid: string, name: string }>> {
  const rows = await getPrisma().projectType.findMany({
    where: { is_active: true },
    orderBy: { name: 'asc' },
    select: { uuid: true, name: true },
  })

  return rows.map(row => ({
    uuid: normalizeUuid(row.uuid),
    name: row.name,
  }))
}

export async function createProjectType(input: CreateProjectTypeInput, userId?: string | null): Promise<ProjectType> {
  try {
    const row = await getPrisma().projectType.create({
      data: {
        name: input.name.trim(),
        description: input.description || null,
        color: normalizeColor(input.color),
        is_active: input.isActive ?? true,
        created_by: userId ?? null,
        updated_by: userId ?? null,
      },
    })
    return toApiProjectType(row)
  }
  catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Project type with this name already exists',
      })
    }
    throw error
  }
}

export async function updateProjectType(idOrUuid: string, input: UpdateProjectTypeInput, userId?: string | null): Promise<ProjectType> {
  const isNumericId = /^\d+$/.test(idOrUuid.trim())

  const where = isNumericId
    ? { id: BigInt(idOrUuid) }
    : { uuid: normalizeUuid(idOrUuid) }

  try {
    const row = await getPrisma().projectType.update({
      where,
      data: {
        name: input.name,
        description: input.description,
        color: input.color ? normalizeColor(input.color) : undefined,
        is_active: input.isActive,
        updated_by: userId ?? null,
      },
    })
    return toApiProjectType(row)
  }
  catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Project type not found' })
    }
    if (isUniqueConstraintError(error)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Project type with this name already exists',
      })
    }
    throw error
  }
}

export async function deleteProjectType(idOrUuid: string): Promise<void> {
  const isNumericId = /^\d+$/.test(idOrUuid.trim())
  const where = isNumericId
    ? { id: BigInt(idOrUuid) }
    : { uuid: normalizeUuid(idOrUuid) }

  try {
    await getPrisma().projectType.delete({ where })
  }
  catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Project type not found' })
    }
    throw error
  }
}
