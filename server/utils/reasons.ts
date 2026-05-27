import { Prisma } from '@prisma/client'
import { createError } from 'h3'
import { getPrisma } from './prisma'

export interface Reason {
  id: number
  uuid: string
  reason: string
  active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface CreateReasonInput {
  reason: string
  active?: boolean
}

export interface UpdateReasonInput {
  reason: string
  active: boolean
}

type ReasonRecord = {
  id: bigint
  uuid: string
  reason: string
  active: boolean
  created_at: Date
  updated_at: Date
  created_by: string | null
  updated_by: string | null
}

function normalizeUuid(value: string): string {
  return String(value).toLowerCase()
}

export function mapReasonRow(row: ReasonRecord): Reason {
  return {
    id: Number(row.id),
    uuid: normalizeUuid(row.uuid),
    reason: row.reason,
    active: Boolean(row.active),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    created_by: row.created_by ?? null,
    updated_by: row.updated_by ?? null,
  }
}

export function isDuplicateReasonError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

export async function listReasons(): Promise<Reason[]> {
  const rows = await getPrisma().reason.findMany({
    orderBy: { created_at: 'desc' },
  })
  return rows.map(mapReasonRow)
}

export async function createReason(
  input: CreateReasonInput,
  userId?: string | null,
): Promise<Reason> {
  const reason = input.reason.trim()
  const active = input.active ?? true

  try {
    const row = await getPrisma().reason.create({
      data: {
        reason,
        active,
        created_by: userId ?? null,
        updated_by: userId ?? null,
      },
    })
    return mapReasonRow(row)
  }
  catch (err: unknown) {
    if (isDuplicateReasonError(err)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Reason already exists',
      })
    }
    throw err
  }
}

export async function updateReason(
  uuid: string,
  input: UpdateReasonInput,
  userId?: string | null,
): Promise<Reason> {
  const reason = input.reason.trim()

  try {
    const row = await getPrisma().reason.update({
      where: { uuid: normalizeUuid(uuid) },
      data: {
        reason,
        active: input.active,
        updated_by: userId ?? null,
      },
    })
    return mapReasonRow(row)
  }
  catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Reason not found' })
    }
    if (isDuplicateReasonError(err)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Reason already exists',
      })
    }
    throw err
  }
}

export async function deleteReason(uuid: string): Promise<void> {
  try {
    await getPrisma().reason.delete({
      where: { uuid: normalizeUuid(uuid) },
    })
  }
  catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Reason not found' })
    }
    throw err
  }
}

export function parseReasonBody(body: unknown): CreateReasonInput {
  const payload = (body ?? {}) as Record<string, unknown>
  const reason = typeof payload.reason === 'string' ? payload.reason : ''
  const active = payload.active

  if (!reason.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Reason is required' })
  }
  if (active !== undefined && typeof active !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Active must be a boolean value' })
  }

  return { reason, active: active ?? true }
}

export function parseReasonUpdateBody(body: unknown): UpdateReasonInput {
  const payload = (body ?? {}) as Record<string, unknown>
  const reason = typeof payload.reason === 'string' ? payload.reason : ''
  const active = payload.active

  if (!reason.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Reason is required' })
  }
  if (typeof active !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Active must be a boolean value' })
  }

  return { reason, active }
}
