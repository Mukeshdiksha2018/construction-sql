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
