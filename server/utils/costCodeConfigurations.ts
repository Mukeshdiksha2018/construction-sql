import { Prisma } from '@prisma/client'
import { createError } from 'h3'
import { getPrisma } from './prisma'

export interface CostCodeConfiguration {
  id: number
  uuid: string
  corporation_uuid: string
  division_uuid: string | null
  cost_code_number: string
  cost_code_name: string
  parent_cost_code_uuid: string | null
  order_number: number | null
  gl_account_uuid: string | null
  effective_from: string | null
  description: string | null
  update_previous_transactions: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateConfigurationInput {
  corporation_uuid: string
  division_uuid?: string | null
  cost_code_number: string
  cost_code_name: string
  parent_cost_code_uuid?: string | null
  order_number?: number | null
  gl_account_uuid?: string | null
  effective_from?: string | null
  description?: string | null
  update_previous_transactions?: boolean
  is_active?: boolean
}

export interface UpdateConfigurationInput {
  division_uuid?: string | null
  cost_code_number?: string
  cost_code_name?: string
  parent_cost_code_uuid?: string | null
  order_number?: number | null
  gl_account_uuid?: string | null
  effective_from?: string | null
  description?: string | null
  update_previous_transactions?: boolean
  is_active?: boolean
}

type ConfigurationRecord = {
  id: bigint
  uuid: string
  corporation_uuid: string
  division_uuid: string | null
  cost_code_number: string
  cost_code_name: string
  parent_cost_code_uuid: string | null
  order_number: number | null
  gl_account_uuid: string | null
  effective_from: Date | null
  description: string | null
  update_previous_transactions: boolean
  is_active: boolean
  created_at: Date
  updated_at: Date
}

function mapConfigurationRow(row: ConfigurationRecord): CostCodeConfiguration {
  return {
    id: Number(row.id),
    uuid: String(row.uuid).toLowerCase(),
    corporation_uuid: String(row.corporation_uuid).toLowerCase(),
    division_uuid: row.division_uuid ? String(row.division_uuid).toLowerCase() : null,
    cost_code_number: row.cost_code_number,
    cost_code_name: row.cost_code_name,
    parent_cost_code_uuid: row.parent_cost_code_uuid ? String(row.parent_cost_code_uuid).toLowerCase() : null,
    order_number: row.order_number,
    gl_account_uuid: row.gl_account_uuid ? String(row.gl_account_uuid).toLowerCase() : null,
    effective_from: row.effective_from ? row.effective_from.toISOString() : null,
    description: row.description ?? null,
    update_previous_transactions: Boolean(row.update_previous_transactions),
    is_active: Boolean(row.is_active),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
  }
}

function isDuplicateError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
}

export async function listCostCodeConfigurations(corporationUuid: string): Promise<CostCodeConfiguration[]> {
  const rows = await getPrisma().costCodeConfiguration.findMany({
    where: { corporation_uuid: corporationUuid.toLowerCase() },
    orderBy: [{ order_number: 'asc' }, { cost_code_number: 'asc' }],
  })
  return rows.map(mapConfigurationRow)
}

export async function getCostCodeConfigurationByUuid(uuid: string): Promise<CostCodeConfiguration | null> {
  const row = await getPrisma().costCodeConfiguration.findUnique({
    where: { uuid: uuid.toLowerCase() },
  })
  return row ? mapConfigurationRow(row) : null
}

export async function createCostCodeConfiguration(input: CreateConfigurationInput): Promise<CostCodeConfiguration> {
  try {
    const row = await getPrisma().costCodeConfiguration.create({
      data: {
        corporation_uuid: input.corporation_uuid.toLowerCase(),
        division_uuid: input.division_uuid?.toLowerCase() ?? null,
        cost_code_number: input.cost_code_number.trim(),
        cost_code_name: input.cost_code_name.trim(),
        parent_cost_code_uuid: input.parent_cost_code_uuid?.toLowerCase() ?? null,
        order_number: input.order_number ?? null,
        gl_account_uuid: input.gl_account_uuid?.toLowerCase() ?? null,
        effective_from: input.effective_from ? new Date(input.effective_from) : null,
        description: input.description?.trim() ?? null,
        update_previous_transactions: input.update_previous_transactions ?? false,
        is_active: input.is_active ?? true,
      },
    })
    return mapConfigurationRow(row)
  }
  catch (err: unknown) {
    if (isDuplicateError(err)) {
      throw createError({ statusCode: 400, statusMessage: 'A cost code with this number already exists for the corporation' })
    }
    throw err
  }
}

export async function updateCostCodeConfiguration(uuid: string, input: UpdateConfigurationInput): Promise<CostCodeConfiguration> {
  try {
    const row = await getPrisma().costCodeConfiguration.update({
      where: { uuid: uuid.toLowerCase() },
      data: {
        ...(input.division_uuid !== undefined && { division_uuid: input.division_uuid?.toLowerCase() ?? null }),
        ...(input.cost_code_number !== undefined && { cost_code_number: input.cost_code_number.trim() }),
        ...(input.cost_code_name !== undefined && { cost_code_name: input.cost_code_name.trim() }),
        ...(input.parent_cost_code_uuid !== undefined && { parent_cost_code_uuid: input.parent_cost_code_uuid?.toLowerCase() ?? null }),
        ...(input.order_number !== undefined && { order_number: input.order_number }),
        ...(input.gl_account_uuid !== undefined && { gl_account_uuid: input.gl_account_uuid?.toLowerCase() ?? null }),
        ...(input.effective_from !== undefined && { effective_from: input.effective_from ? new Date(input.effective_from) : null }),
        ...(input.description !== undefined && { description: input.description?.trim() ?? null }),
        ...(input.update_previous_transactions !== undefined && { update_previous_transactions: input.update_previous_transactions }),
        ...(input.is_active !== undefined && { is_active: input.is_active }),
      },
    })
    return mapConfigurationRow(row)
  }
  catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Cost code configuration not found' })
    }
    if (isDuplicateError(err)) {
      throw createError({ statusCode: 400, statusMessage: 'A cost code with this number already exists for the corporation' })
    }
    throw err
  }
}

export async function deleteCostCodeConfiguration(uuid: string): Promise<void> {
  try {
    await getPrisma().costCodeConfiguration.delete({
      where: { uuid: uuid.toLowerCase() },
    })
  }
  catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Cost code configuration not found' })
    }
    throw err
  }
}

export async function deleteAllCostCodeConfigurations(corporationUuid: string): Promise<void> {
  await getPrisma().costCodeConfiguration.deleteMany({
    where: { corporation_uuid: corporationUuid.toLowerCase() },
  })
}

export async function bulkCreateCostCodeConfigurations(
  corporationUuid: string,
  configurations: Array<{
    cost_code_number: string
    cost_code_name: string
    division_number?: string
    parent_cost_code_number?: string
    order?: number | null
    description?: string
    is_active?: boolean
  }>,
  divisionUuidByNumber: Map<string, string>,
  configUuidByNumber: Map<string, string>,
): Promise<{ created: number; skipped: number }> {
  let created = 0
  let skipped = 0

  for (const cfg of configurations) {
    try {
      const divisionUuid = cfg.division_number ? divisionUuidByNumber.get(cfg.division_number) ?? null : null
      const parentUuid = cfg.parent_cost_code_number ? configUuidByNumber.get(cfg.parent_cost_code_number) ?? null : null

      const newConfig = await createCostCodeConfiguration({
        corporation_uuid: corporationUuid,
        cost_code_number: cfg.cost_code_number,
        cost_code_name: cfg.cost_code_name,
        division_uuid: divisionUuid,
        parent_cost_code_uuid: parentUuid,
        order_number: cfg.order ?? null,
        description: cfg.description,
        is_active: cfg.is_active ?? true,
      })

      configUuidByNumber.set(cfg.cost_code_number, newConfig.uuid)
      created++
    }
    catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        skipped++
      }
      else {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.warn(`Failed to create configuration ${cfg.cost_code_number}:`, errorMessage)
        skipped++
      }
    }
  }

  return { created, skipped }
}
