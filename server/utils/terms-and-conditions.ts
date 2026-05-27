import { Prisma } from '@prisma/client'
import { createError } from 'h3'
import { getPrisma } from './prisma'

export interface TermsAndCondition {
  id: number
  uuid: string
  name: string
  content: string
  isActive: boolean
  created_at: string
  updated_at: string
}

export interface CreateTermsAndConditionInput {
  name: string
  content: string
  isActive?: boolean
}

export interface UpdateTermsAndConditionInput {
  name?: string
  content?: string
  isActive?: boolean
}

type TermsAndConditionRecord = {
  id: bigint
  uuid: string
  name: string
  content: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

function normalizeUuid(value: string): string {
  return String(value).toLowerCase()
}

function toApiTermsAndCondition(row: TermsAndConditionRecord): TermsAndCondition {
  return {
    id: Number(row.id),
    uuid: normalizeUuid(row.uuid),
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

export function parseTermsAndConditionBody(body: unknown): CreateTermsAndConditionInput {
  const payload = (body ?? {}) as Record<string, unknown>
  const name = typeof payload.name === 'string' ? payload.name.trim() : ''
  const content = typeof payload.content === 'string' ? payload.content.trim() : ''
  const isActive = payload.isActive

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  }
  if (!content) {
    throw createError({ statusCode: 400, statusMessage: 'Content is required' })
  }
  if (isActive !== undefined && typeof isActive !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'isActive must be a boolean value' })
  }

  return {
    name,
    content,
    isActive: isActive ?? true,
  }
}

export function parseTermsAndConditionUpdateBody(body: unknown): UpdateTermsAndConditionInput {
  const payload = (body ?? {}) as Record<string, unknown>
  const result: UpdateTermsAndConditionInput = {}

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

  if (result.name === undefined && result.content === undefined && result.isActive === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'At least one field is required for update' })
  }

  return result
}

export async function listTermsAndConditions(): Promise<TermsAndCondition[]> {
  const rows = await getPrisma().termsAndCondition.findMany({
    orderBy: { name: 'asc' },
  })
  return rows.map(toApiTermsAndCondition)
}

export async function createTermsAndCondition(
  input: CreateTermsAndConditionInput,
  userId?: string | null,
): Promise<TermsAndCondition> {
  try {
    const row = await getPrisma().termsAndCondition.create({
      data: {
        name: input.name,
        content: input.content,
        is_active: input.isActive ?? true,
        created_by: userId ?? null,
        updated_by: userId ?? null,
      },
    })
    return toApiTermsAndCondition(row)
  }
  catch (error: unknown) {
    if (isUniqueConstraintError(error)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Terms and condition with this name already exists',
      })
    }
    throw error
  }
}

export async function updateTermsAndCondition(
  idOrUuid: string,
  input: UpdateTermsAndConditionInput,
  userId?: string | null,
): Promise<TermsAndCondition> {
  const isNumericId = /^\d+$/.test(idOrUuid.trim())
  const where = isNumericId
    ? { id: BigInt(idOrUuid) }
    : { uuid: normalizeUuid(idOrUuid) }

  try {
    const row = await getPrisma().termsAndCondition.update({
      where,
      data: {
        name: input.name,
        content: input.content,
        is_active: input.isActive,
        updated_by: userId ?? null,
      },
    })
    return toApiTermsAndCondition(row)
  }
  catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Terms and condition not found' })
    }
    if (isUniqueConstraintError(error)) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Terms and condition with this name already exists',
      })
    }
    throw error
  }
}

export async function deleteTermsAndCondition(idOrUuid: string): Promise<void> {
  const isNumericId = /^\d+$/.test(idOrUuid.trim())
  const where = isNumericId
    ? { id: BigInt(idOrUuid) }
    : { uuid: normalizeUuid(idOrUuid) }

  try {
    await getPrisma().termsAndCondition.delete({ where })
  }
  catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Terms and condition not found' })
    }
    throw error
  }
}
