import { Prisma } from '@prisma/client'
import { createError } from 'h3'
import { sanitizeCustomerCountry } from '../../app/utils/countries'
import { getPrisma } from './prisma'
import { mssqlQueryParams } from './mssql'

const VALID_SALUTATIONS = [
  'Mr.',
  'Mrs.',
  'Ms.',
  'Dr.',
  'Prof.',
  'Rev.',
  'Sir',
  'Madam',
] as const

export interface CustomerRecord {
  id: number
  uuid: string
  created_at: string
  updated_at: string
  corporation_uuid: string
  project_uuid: string | null
  customer_address: string
  customer_city: string
  customer_state: string
  customer_country: string
  customer_zip: string
  customer_phone: string
  customer_email: string
  company_name: string
  salutation: string
  first_name: string
  middle_name: string
  last_name: string
  profile_image_url: string
  is_active: boolean
  nimble_customer_id: string | null
  created_by: string | null
  updated_by: string | null
}

export interface CustomerPayload {
  corporation_uuid: string
  project_uuid?: string | null
  customer_address?: string
  customer_city?: string
  customer_state?: string
  customer_country?: string
  customer_zip?: string
  customer_phone?: string
  customer_email?: string
  company_name?: string
  salutation?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  profile_image_url?: string
}

type CustomerRow = {
  id: bigint
  uuid: string
  created_at: Date
  updated_at: Date
  corporation_uuid: string
  project_uuid: string | null
  customer_address: string
  customer_city: string
  customer_state: string
  customer_country: string
  customer_zip: string
  customer_phone: string
  customer_email: string
  company_name: string
  salutation: string
  first_name: string
  middle_name: string
  last_name: string
  profile_image_url: string
  is_active: boolean
  nimble_customer_id: string | null
  created_by: string | null
  updated_by: string | null
}

function normalizeUuid(value: string): string {
  return String(value).trim().toLowerCase()
}

export function mapCustomerRow(row: CustomerRow): CustomerRecord {
  return {
    id: Number(row.id),
    uuid: normalizeUuid(row.uuid),
    created_at: row.created_at.toISOString(),
    updated_at: row.updated_at.toISOString(),
    corporation_uuid: normalizeUuid(row.corporation_uuid),
    project_uuid: row.project_uuid ? normalizeUuid(row.project_uuid) : null,
    customer_address: row.customer_address ?? '',
    customer_city: row.customer_city ?? '',
    customer_state: row.customer_state ?? '',
    customer_country: row.customer_country ?? '',
    customer_zip: row.customer_zip ?? '',
    customer_phone: row.customer_phone ?? '',
    customer_email: row.customer_email ?? '',
    company_name: row.company_name ?? '',
    salutation: row.salutation ?? 'Mr.',
    first_name: row.first_name ?? '',
    middle_name: row.middle_name ?? '',
    last_name: row.last_name ?? '',
    profile_image_url: row.profile_image_url ?? '',
    is_active: Boolean(row.is_active),
    nimble_customer_id: row.nimble_customer_id ?? null,
    created_by: row.created_by ?? null,
    updated_by: row.updated_by ?? null,
  }
}

function resolveCustomerCountry(value: unknown): string {
  try {
    return sanitizeCustomerCountry(
      typeof value === 'string' ? value : String(value ?? ''),
      { allowEmpty: true },
    )
  }
  catch {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Invalid customer_country. Select a country from the list (ISO code, e.g. US, CA).',
    })
  }
}

function validateEmail(email: string | undefined): void {
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid email format' })
  }
}

function validatePhone(phone: string | undefined): void {
  if (phone && !/^[\d\s\-+()]+$/.test(phone)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid phone number format' })
  }
}

function validateSalutation(salutation: string | undefined): void {
  if (salutation && !VALID_SALUTATIONS.includes(salutation as typeof VALID_SALUTATIONS[number])) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid salutation. Must be one of: ${VALID_SALUTATIONS.join(', ')}`,
    })
  }
}

async function assertProjectBelongsToCorporation(
  projectUuid: string,
  corporationUuid: string,
): Promise<void> {
  const rows = await mssqlQueryParams<{ uuid: string }>(
    `
      SELECT TOP 1 uuid
      FROM dbo.projects
      WHERE uuid = @projectUuid AND corporation_uuid = @corporationUuid
    `,
    { projectUuid: normalizeUuid(projectUuid), corporationUuid: normalizeUuid(corporationUuid) },
  )
  if (!rows.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid project_uuid or project does not belong to the corporation',
    })
  }
}

function normalizePayload(payload: CustomerPayload, forUpdate = false): CustomerPayload {
  const corporation_uuid = normalizeUuid(payload.corporation_uuid)
  const project_uuid = payload.project_uuid
    ? normalizeUuid(payload.project_uuid)
    : null

  if (!forUpdate) {
    if (!payload.first_name?.trim() || !payload.last_name?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: first_name and last_name are required',
      })
    }
  }

  validateEmail(payload.customer_email?.trim())
  validatePhone(payload.customer_phone?.trim())
  validateSalutation(payload.salutation)

  return {
    corporation_uuid,
    project_uuid,
    customer_address: payload.customer_address?.trim() ?? '',
    customer_city: payload.customer_city?.trim() ?? '',
    customer_state: payload.customer_state?.trim() ?? '',
    customer_country: resolveCustomerCountry(payload.customer_country),
    customer_zip: payload.customer_zip?.trim() ?? '',
    customer_phone: payload.customer_phone?.trim() ?? '',
    customer_email: payload.customer_email?.trim() ?? '',
    company_name: payload.company_name?.trim() ?? '',
    salutation: payload.salutation || 'Mr.',
    first_name: payload.first_name?.trim() ?? '',
    middle_name: payload.middle_name?.trim() ?? '',
    last_name: payload.last_name?.trim() ?? '',
    profile_image_url: payload.profile_image_url?.trim() ?? '',
  }
}

export async function listCustomers(
  corporationUuid: string,
  projectUuid?: string | null,
): Promise<CustomerRecord[]> {
  const corp = normalizeUuid(corporationUuid)
  const where: Prisma.CustomerWhereInput = {
    corporation_uuid: corp,
    is_active: true,
  }

  if (projectUuid) {
    const proj = normalizeUuid(projectUuid)
    where.OR = [{ project_uuid: null }, { project_uuid: proj }]
  }

  const rows = await getPrisma().customer.findMany({
    where,
    orderBy: [{ first_name: 'asc' }, { last_name: 'asc' }],
  })

  return rows.map(mapCustomerRow)
}

export async function createCustomer(
  payload: CustomerPayload,
  userId?: string | null,
): Promise<CustomerRecord> {
  if (!payload.corporation_uuid?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required field: corporation_uuid is required',
    })
  }

  const data = normalizePayload(payload)

  if (data.project_uuid) {
    await assertProjectBelongsToCorporation(data.project_uuid, data.corporation_uuid)
  }

  const row = await getPrisma().customer.create({
    data: {
      corporation_uuid: data.corporation_uuid,
      project_uuid: data.project_uuid,
      customer_address: data.customer_address ?? '',
      customer_city: data.customer_city ?? '',
      customer_state: data.customer_state ?? '',
      customer_country: data.customer_country ?? '',
      customer_zip: data.customer_zip ?? '',
      customer_phone: data.customer_phone ?? '',
      customer_email: data.customer_email ?? '',
      company_name: data.company_name ?? '',
      salutation: data.salutation ?? 'Mr.',
      first_name: data.first_name ?? '',
      middle_name: data.middle_name ?? '',
      last_name: data.last_name ?? '',
      profile_image_url: data.profile_image_url ?? '',
      is_active: true,
      created_by: userId ?? null,
      updated_by: userId ?? null,
    },
  })

  return mapCustomerRow(row)
}

export async function updateCustomer(
  uuid: string,
  payload: CustomerPayload,
  userId?: string | null,
): Promise<CustomerRecord> {
  const customerUuid = normalizeUuid(uuid)
  const data = normalizePayload(payload, true)

  if (data.project_uuid) {
    await assertProjectBelongsToCorporation(data.project_uuid, data.corporation_uuid)
  }

  try {
    const row = await getPrisma().customer.update({
      where: { uuid: customerUuid },
      data: {
        corporation_uuid: data.corporation_uuid,
        project_uuid: data.project_uuid,
        customer_address: data.customer_address,
        customer_city: data.customer_city,
        customer_state: data.customer_state,
        customer_country: data.customer_country,
        customer_zip: data.customer_zip,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email,
        company_name: data.company_name,
        salutation: data.salutation,
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        profile_image_url: data.profile_image_url,
        updated_by: userId ?? null,
      },
    })
    return mapCustomerRow(row)
  }
  catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Customer not found' })
    }
    throw err
  }
}

export async function softDeleteCustomer(uuid: string, userId?: string | null): Promise<void> {
  try {
    await getPrisma().customer.update({
      where: { uuid: normalizeUuid(uuid) },
      data: { is_active: false, updated_by: userId ?? null },
    })
  }
  catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Customer not found' })
    }
    throw err
  }
}
