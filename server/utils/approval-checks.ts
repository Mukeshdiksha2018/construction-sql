import { Prisma } from '@prisma/client'
import { createError } from 'h3'
import { getPrisma } from './prisma'

export interface ApprovalCheck {
  id: number
  uuid: string
  approval_check: string
  description: string | null
  active: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface CreateApprovalCheckInput {
  approval_check: string
  description?: string | null
  active?: boolean
}

export interface UpdateApprovalCheckInput {
  approval_check: string
  description?: string | null
  active: boolean
}

type ApprovalCheckRecord = {
  id: bigint
  uuid: string
  approval_check: string
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

export function mapApprovalCheckRow(row: ApprovalCheckRecord): ApprovalCheck {
  return {
    id: Number(row.id),
    uuid: normalizeUuid(row.uuid),
    approval_check: row.approval_check,
    description: row.description ?? null,
    active: Boolean(row.active),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    created_by: row.created_by ?? null,
    updated_by: row.updated_by ?? null,
  }
}

export function isDuplicateApprovalCheckError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

export async function listApprovalChecks(): Promise<ApprovalCheck[]> {
  const rows = await getPrisma().approvalCheck.findMany({
    orderBy: { created_at: 'desc' },
  })
  return rows.map(mapApprovalCheckRow)
}

export async function createApprovalCheck(
  input: CreateApprovalCheckInput,
  userId?: string | null,
): Promise<ApprovalCheck> {
  const approvalCheckName = input.approval_check.trim()
  const description = input.description?.trim() || null
  const active = input.active ?? true

  try {
    const row = await getPrisma().approvalCheck.create({
      data: {
        approval_check: approvalCheckName,
        description,
        active,
        created_by: userId ?? null,
        updated_by: userId ?? null,
      },
    })
    return mapApprovalCheckRow(row)
  }
  catch (err: unknown) {
    if (isDuplicateApprovalCheckError(err)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Approval Check already exists',
      })
    }
    throw err
  }
}

export async function updateApprovalCheck(
  uuid: string,
  input: UpdateApprovalCheckInput,
  userId?: string | null,
): Promise<ApprovalCheck> {
  const approvalCheckName = input.approval_check.trim()
  const description = input.description?.trim() || null

  try {
    const row = await getPrisma().approvalCheck.update({
      where: { uuid: normalizeUuid(uuid) },
      data: {
        approval_check: approvalCheckName,
        description,
        active: input.active,
        updated_by: userId ?? null,
      },
    })
    return mapApprovalCheckRow(row)
  }
  catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Approval Check not found' })
    }
    if (isDuplicateApprovalCheckError(err)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Approval Check already exists',
      })
    }
    throw err
  }
}

export async function deleteApprovalCheck(uuid: string): Promise<void> {
  try {
    await getPrisma().approvalCheck.delete({
      where: { uuid: normalizeUuid(uuid) },
    })
  }
  catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Approval Check not found' })
    }
    throw err
  }
}

export function parseApprovalCheckBody(body: unknown): CreateApprovalCheckInput {
  const payload = (body ?? {}) as Record<string, unknown>
  const approval_check = typeof payload.approval_check === 'string' ? payload.approval_check : ''
  const description = typeof payload.description === 'string' ? payload.description : null
  const active = payload.active

  if (!approval_check.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Approval Check is required' })
  }
  if (active !== undefined && typeof active !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Active must be a boolean value' })
  }

  return { approval_check, description, active: active ?? true }
}

export function parseApprovalCheckUpdateBody(body: unknown): UpdateApprovalCheckInput {
  const payload = (body ?? {}) as Record<string, unknown>
  const approval_check = typeof payload.approval_check === 'string' ? payload.approval_check : ''
  const description = typeof payload.description === 'string' ? payload.description : null
  const active = payload.active

  if (!approval_check.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Approval Check is required' })
  }
  if (typeof active !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Active must be a boolean value' })
  }

  return { approval_check, description, active }
}
