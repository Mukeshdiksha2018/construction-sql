import { Prisma } from '@prisma/client'
import { createError } from 'h3'
import { getPrisma } from './prisma'

export interface CostCodeDivision {
  id: number
  uuid: string
  corporation_uuid: string
  division_number: string
  division_name: string
  division_order: number
  description: string | null
  is_active: boolean
  exclude_in_estimates_and_reports: boolean
  created_at: string
  updated_at: string
}

export interface CreateDivisionInput {
  corporation_uuid: string
  division_number: string
  division_name: string
  division_order?: number
  description?: string | null
  is_active?: boolean
  exclude_in_estimates_and_reports?: boolean
}

export interface UpdateDivisionInput {
  division_number?: string
  division_name?: string
  division_order?: number
  description?: string | null
  is_active?: boolean
  exclude_in_estimates_and_reports?: boolean
}

type DivisionRecord = {
  id: bigint
  uuid: string
  corporation_uuid: string
  division_number: string
  division_name: string
  division_order: number
  description: string | null
  is_active: boolean
  exclude_in_estimates_and_reports: boolean
  created_at: Date
  updated_at: Date
}

function mapDivisionRow(row: DivisionRecord): CostCodeDivision {
  return {
    id: Number(row.id),
    uuid: String(row.uuid).toLowerCase(),
    corporation_uuid: String(row.corporation_uuid).toLowerCase(),
    division_number: row.division_number,
    division_name: row.division_name,
    division_order: row.division_order,
    description: row.description ?? null,
    is_active: Boolean(row.is_active),
    exclude_in_estimates_and_reports: Boolean(row.exclude_in_estimates_and_reports),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }
}

function isDuplicateError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

export async function listCostCodeDivisions(corporationUuid: string): Promise<CostCodeDivision[]> {
  const rows = await getPrisma().costCodeDivision.findMany({
    where: { corporation_uuid: corporationUuid.toLowerCase() },
    orderBy: [{ division_order: 'asc' }, { division_name: 'asc' }],
  })
  return rows.map(mapDivisionRow)
}

export async function getCostCodeDivisionByUuid(uuid: string): Promise<CostCodeDivision | null> {
  const row = await getPrisma().costCodeDivision.findUnique({
    where: { uuid: uuid.toLowerCase() },
  })
  return row ? mapDivisionRow(row) : null
}

export async function createCostCodeDivision(input: CreateDivisionInput): Promise<CostCodeDivision> {
  try {
    const row = await getPrisma().costCodeDivision.create({
      data: {
        corporation_uuid: input.corporation_uuid.toLowerCase(),
        division_number: input.division_number.trim(),
        division_name: input.division_name.trim(),
        division_order: input.division_order ?? 1,
        description: input.description?.trim() ?? null,
        is_active: input.is_active ?? true,
        exclude_in_estimates_and_reports: input.exclude_in_estimates_and_reports ?? false,
      },
    })
    return mapDivisionRow(row)
  }
  catch (err: unknown) {
    if (isDuplicateError(err)) {
      throw createError({ statusCode: 400, statusMessage: 'A division with this number already exists for the corporation' })
    }
    throw err
  }
}

export async function updateCostCodeDivision(uuid: string, input: UpdateDivisionInput): Promise<CostCodeDivision> {
  try {
    const row = await getPrisma().costCodeDivision.update({
      where: { uuid: uuid.toLowerCase() },
      data: {
        ...(input.division_number !== undefined && { division_number: input.division_number.trim() }),
        ...(input.division_name !== undefined && { division_name: input.division_name.trim() }),
        ...(input.division_order !== undefined && { division_order: input.division_order }),
        ...(input.description !== undefined && { description: input.description?.trim() ?? null }),
        ...(input.is_active !== undefined && { is_active: input.is_active }),
        ...(input.exclude_in_estimates_and_reports !== undefined && { exclude_in_estimates_and_reports: input.exclude_in_estimates_and_reports }),
      },
    })
    return mapDivisionRow(row)
  }
  catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Cost code division not found' })
    }
    if (isDuplicateError(err)) {
      throw createError({ statusCode: 400, statusMessage: 'A division with this number already exists for the corporation' })
    }
    throw err
  }
}

export async function deleteCostCodeDivision(uuid: string): Promise<void> {
  try {
    await getPrisma().costCodeDivision.delete({
      where: { uuid: uuid.toLowerCase() },
    })
  }
  catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Cost code division not found' })
    }
    throw err
  }
}

export async function deleteAllCostCodeDivisions(corporationUuid: string): Promise<void> {
  await getPrisma().costCodeDivision.deleteMany({
    where: { corporation_uuid: corporationUuid.toLowerCase() },
  })
}

export async function bulkCreateCostCodeDivisions(
  corporationUuid: string,
  divisions: Omit<CreateDivisionInput, 'corporation_uuid'>[],
): Promise<{ created: number; skipped: number }> {
  let created = 0
  let skipped = 0

  for (const div of divisions) {
    try {
      await createCostCodeDivision({ ...div, corporation_uuid: corporationUuid })
      created++
    }
    catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        skipped++
      }
      else {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.warn(`Failed to create division ${div.division_number}:`, errorMessage)
        skipped++
      }
    }
  }

  return { created, skipped }
}
