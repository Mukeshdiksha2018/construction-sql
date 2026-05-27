import { Prisma } from '@prisma/client'
import { createError } from 'h3'
import { getPrisma } from './prisma'

export type POInstructionStatus = 'ACTIVE' | 'INACTIVE'

export interface POInstruction {
  id: number
  uuid: string
  corporation_uuid: string
  po_instruction_name: string
  instruction: string
  status: POInstructionStatus
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface CreatePOInstructionInput {
  corporation_uuid: string
  po_instruction_name: string
  instruction: string
  status?: POInstructionStatus
}

export interface UpdatePOInstructionInput {
  po_instruction_name: string
  instruction: string
  status: POInstructionStatus
}

type POInstructionRecord = {
  id: bigint
  uuid: string
  corporation_uuid: string
  po_instruction_name: string
  instruction: string
  status: string
  created_at: Date
  updated_at: Date
  created_by: string | null
  updated_by: string | null
}

function normalizeUuid(value: string): string {
  return String(value).toLowerCase()
}

function normalizeStatus(status: string): POInstructionStatus {
  return status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
}

function assertValidStatus(status: unknown): asserts status is POInstructionStatus {
  if (status !== 'ACTIVE' && status !== 'INACTIVE') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Status must be either ACTIVE or INACTIVE',
    })
  }
}

export function mapPOInstructionRow(row: POInstructionRecord): POInstruction {
  return {
    id: Number(row.id),
    uuid: normalizeUuid(row.uuid),
    corporation_uuid: row.corporation_uuid,
    po_instruction_name: row.po_instruction_name,
    instruction: row.instruction,
    status: normalizeStatus(row.status),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    created_by: row.created_by ?? null,
    updated_by: row.updated_by ?? null,
  }
}

export function isDuplicatePOInstructionError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

export async function listPOInstructions(corporationUuid: string): Promise<POInstruction[]> {
  const rows = await getPrisma().pOInstruction.findMany({
    where: { corporation_uuid: corporationUuid },
    orderBy: { created_at: 'desc' },
  })
  return rows.map(mapPOInstructionRow)
}

export async function createPOInstruction(
  input: CreatePOInstructionInput,
  userId?: string | null,
): Promise<POInstruction> {
  const corporationUuid = input.corporation_uuid.trim()
  const poInstructionName = input.po_instruction_name.trim()
  const instruction = input.instruction.trim()
  const status = input.status ?? 'ACTIVE'

  try {
    const row = await getPrisma().pOInstruction.create({
      data: {
        corporation_uuid: corporationUuid,
        po_instruction_name: poInstructionName,
        instruction,
        status,
        created_by: userId ?? null,
        updated_by: userId ?? null,
      },
    })
    return mapPOInstructionRow(row)
  }
  catch (err: unknown) {
    if (isDuplicatePOInstructionError(err)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'PO instruction already exists',
      })
    }
    throw err
  }
}

export async function updatePOInstruction(
  uuid: string,
  input: UpdatePOInstructionInput,
  userId?: string | null,
): Promise<POInstruction> {
  const poInstructionName = input.po_instruction_name.trim()
  const instruction = input.instruction.trim()

  try {
    const row = await getPrisma().pOInstruction.update({
      where: { uuid: normalizeUuid(uuid) },
      data: {
        po_instruction_name: poInstructionName,
        instruction,
        status: input.status,
        updated_by: userId ?? null,
      },
    })
    return mapPOInstructionRow(row)
  }
  catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'PO instruction not found' })
    }
    if (isDuplicatePOInstructionError(err)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'PO instruction already exists',
      })
    }
    throw err
  }
}

export async function deletePOInstruction(uuid: string): Promise<void> {
  try {
    await getPrisma().pOInstruction.delete({
      where: { uuid: normalizeUuid(uuid) },
    })
  }
  catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'PO instruction not found' })
    }
    throw err
  }
}

export function parsePOInstructionBody(body: unknown): CreatePOInstructionInput {
  const payload = (body ?? {}) as Record<string, unknown>
  const corporation_uuid = typeof payload.corporation_uuid === 'string' ? payload.corporation_uuid : ''
  const po_instruction_name = typeof payload.po_instruction_name === 'string' ? payload.po_instruction_name : ''
  const instruction = typeof payload.instruction === 'string' ? payload.instruction : ''
  const status = payload.status ?? 'ACTIVE'

  if (!corporation_uuid.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Corporation UUID is required' })
  }
  if (!po_instruction_name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'PO Instruction Name is required' })
  }
  if (!instruction.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Instruction is required' })
  }
  assertValidStatus(status)

  return { corporation_uuid, po_instruction_name, instruction, status }
}

export function parsePOInstructionUpdateBody(body: unknown): UpdatePOInstructionInput {
  const payload = (body ?? {}) as Record<string, unknown>
  const po_instruction_name = typeof payload.po_instruction_name === 'string' ? payload.po_instruction_name : ''
  const instruction = typeof payload.instruction === 'string' ? payload.instruction : ''
  const status = payload.status

  if (!po_instruction_name.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'PO Instruction Name is required' })
  }
  if (!instruction.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Instruction is required' })
  }
  assertValidStatus(status)

  return { po_instruction_name, instruction, status }
}
