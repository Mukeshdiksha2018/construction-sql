import { Prisma } from '@prisma/client'
import { createError } from 'h3'
import { getPrisma } from './prisma'

export interface SpecialInstructionRow {
  id: number
  uuid: string
  corporation_uuid: string
  project_uuid: string
  project_name: string | null
  project_id: string | null
  name: string
  content: string
  isActive: boolean
  created_at: string
  updated_at: string
}

type DbRow = {
  id: bigint
  uuid: string
  corporation_uuid: string
  project_uuid: string
  name: string
  content: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

function normalizeUuid(value: string): string {
  return String(value).trim().toLowerCase()
}

function toApiRow(row: DbRow, project?: { project_name: string; project_id: string } | null): SpecialInstructionRow {
  return {
    id: Number(row.id),
    uuid: normalizeUuid(row.uuid),
    corporation_uuid: normalizeUuid(row.corporation_uuid),
    project_uuid: normalizeUuid(row.project_uuid),
    project_name: project?.project_name ?? null,
    project_id: project?.project_id ?? null,
    name: row.name,
    content: row.content,
    isActive: Boolean(row.is_active),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

export async function listSpecialInstructions(params: {
  corporation_uuid?: string
  project_uuid?: string
}): Promise<SpecialInstructionRow[]> {
  const prisma = await getPrisma()
  const corporationUuid = String(params.corporation_uuid ?? '').trim()
  const projectUuid = String(params.project_uuid ?? '').trim()

  const where: Prisma.SpecialInstructionWhereInput = {}
  if (corporationUuid) where.corporation_uuid = corporationUuid
  if (projectUuid) where.project_uuid = projectUuid

  const rows = await prisma.specialInstruction.findMany({
    where,
    orderBy: { name: 'asc' },
  })

  const projectUuids = [...new Set(rows.map(r => r.project_uuid).filter(Boolean))]
  const projects = projectUuids.length
    ? await prisma.project.findMany({
        where: { uuid: { in: projectUuids } },
        select: { uuid: true, project_name: true, project_id: true },
      })
    : []
  const projectByUuid = new Map(projects.map(p => [normalizeUuid(p.uuid), p]))

  return rows.map(row => toApiRow(row, projectByUuid.get(normalizeUuid(row.project_uuid)) ?? null))
}

export async function createSpecialInstruction(payload: {
  corporation_uuid: string
  project_uuid: string
  name: string
  content: string
  isActive?: boolean
}): Promise<SpecialInstructionRow> {
  const prisma = await getPrisma()
  const corporationUuid = String(payload.corporation_uuid ?? '').trim()
  const projectUuid = String(payload.project_uuid ?? '').trim()
  const name = String(payload.name ?? '').trim()
  const content = String(payload.content ?? '').trim()

  if (!corporationUuid) {
    throw createError({ statusCode: 400, statusMessage: 'corporation_uuid is required' })
  }
  if (!projectUuid) {
    throw createError({ statusCode: 400, statusMessage: 'project_uuid is required' })
  }
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }
  if (!content) {
    throw createError({ statusCode: 400, statusMessage: 'Content is required' })
  }

  const project = await prisma.project.findFirst({
    where: { uuid: projectUuid },
    select: { uuid: true, corporation_uuid: true, project_name: true, project_id: true },
  })
  if (!project) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid project_uuid' })
  }
  if (normalizeUuid(project.corporation_uuid) !== normalizeUuid(corporationUuid)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project does not belong to the selected corporation',
    })
  }

  try {
    const row = await prisma.specialInstruction.create({
      data: {
        corporation_uuid: corporationUuid,
        project_uuid: projectUuid,
        name,
        content,
        is_active: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
      },
    })
    return toApiRow(row, project)
  }
  catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A special instruction with this name already exists for this project',
      })
    }
    throw error
  }
}

export interface UpdateSpecialInstructionInput {
  name?: string
  content?: string
  isActive?: boolean
  corporation_uuid?: string
  project_uuid?: string
}

export function parseSpecialInstructionUpdateBody(body: unknown): UpdateSpecialInstructionInput {
  const payload = (body ?? {}) as Record<string, unknown>
  const result: UpdateSpecialInstructionInput = {}

  if (payload.name !== undefined) {
    const name = typeof payload.name === 'string' ? payload.name.trim() : ''
    if (!name) {
      throw createError({ statusCode: 400, statusMessage: 'Name cannot be empty' })
    }
    result.name = name
  }

  if (payload.content !== undefined) {
    const content = typeof payload.content === 'string' ? payload.content.trim() : ''
    if (!content) {
      throw createError({ statusCode: 400, statusMessage: 'Content cannot be empty' })
    }
    result.content = content
  }

  if (payload.isActive !== undefined) {
    if (typeof payload.isActive !== 'boolean') {
      throw createError({ statusCode: 400, statusMessage: 'isActive must be a boolean value' })
    }
    result.isActive = payload.isActive
  }

  if (payload.corporation_uuid !== undefined) {
    const corporationUuid = typeof payload.corporation_uuid === 'string' ? payload.corporation_uuid.trim() : ''
    if (!corporationUuid) {
      throw createError({ statusCode: 400, statusMessage: 'corporation_uuid cannot be empty' })
    }
    result.corporation_uuid = corporationUuid
  }

  if (payload.project_uuid !== undefined) {
    const projectUuid = typeof payload.project_uuid === 'string' ? payload.project_uuid.trim() : ''
    if (!projectUuid) {
      throw createError({ statusCode: 400, statusMessage: 'project_uuid cannot be empty' })
    }
    result.project_uuid = projectUuid
  }

  if (
    result.name === undefined
    && result.content === undefined
    && result.isActive === undefined
    && result.corporation_uuid === undefined
    && result.project_uuid === undefined
  ) {
    throw createError({ statusCode: 400, statusMessage: 'At least one field is required for update' })
  }

  return result
}

async function resolveProjectForInstruction(
  projectUuid: string,
  corporationUuid: string,
): Promise<{ project_name: string; project_id: string }> {
  const prisma = await getPrisma()
  const project = await prisma.project.findFirst({
    where: { uuid: projectUuid },
    select: { uuid: true, corporation_uuid: true, project_name: true, project_id: true },
  })
  if (!project) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid project_uuid' })
  }
  if (normalizeUuid(project.corporation_uuid) !== normalizeUuid(corporationUuid)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project does not belong to the selected corporation',
    })
  }
  return { project_name: project.project_name, project_id: project.project_id }
}

export async function updateSpecialInstruction(
  idOrUuid: string,
  input: UpdateSpecialInstructionInput,
  userId?: string | null,
): Promise<SpecialInstructionRow> {
  const prisma = await getPrisma()
  const isNumericId = /^\d+$/.test(idOrUuid.trim())
  const where = isNumericId
    ? { id: BigInt(idOrUuid) }
    : { uuid: normalizeUuid(idOrUuid) }

  const existing = await prisma.specialInstruction.findFirst({ where })
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Special instruction not found' })
  }

  const corporationUuid = input.corporation_uuid ?? existing.corporation_uuid
  const projectUuid = input.project_uuid ?? existing.project_uuid
  const project = await resolveProjectForInstruction(projectUuid, corporationUuid)

  try {
    const row = await prisma.specialInstruction.update({
      where: { id: existing.id },
      data: {
        name: input.name,
        content: input.content,
        is_active: input.isActive,
        corporation_uuid: input.corporation_uuid,
        project_uuid: input.project_uuid,
        updated_by: userId ?? null,
      },
    })
    return toApiRow(row, project)
  }
  catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Special instruction not found' })
    }
    if (isUniqueConstraintError(error)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'A special instruction with this name already exists for this project',
      })
    }
    throw error
  }
}

export async function deleteSpecialInstruction(idOrUuid: string): Promise<void> {
  const prisma = await getPrisma()
  const isNumericId = /^\d+$/.test(idOrUuid.trim())
  const where = isNumericId
    ? { id: BigInt(idOrUuid) }
    : { uuid: normalizeUuid(idOrUuid) }

  try {
    await prisma.specialInstruction.delete({ where })
  }
  catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Special instruction not found' })
    }
    throw error
  }
}
