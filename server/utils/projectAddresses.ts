import { mssqlQueryParams } from './mssql'

export interface ProjectAddressRow {
  id?: number
  uuid?: string
  project_uuid?: string
  address_type?: string
  contact_person?: string | null
  email?: string | null
  phone?: string | null
  address_line_1?: string
  address_line_2?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  country?: string | null
  is_primary?: boolean | number | null
  is_active?: boolean | number | null
  copied_from_billing_address_uuid?: string | null
  created_at?: string | Date | null
  updated_at?: string | Date | null
}

export interface ProjectAddressApiModel {
  id: number
  uuid: string
  project_uuid: string
  address_type: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address_line_1: string
  address_line_2: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  is_primary: boolean
  is_active: boolean
  copied_from_billing_address_uuid: string | null
  created_at: string | null
  updated_at: string | null
}

export interface UpsertAddressInput {
  project_uuid: string
  address_type: string
  contact_person?: string | null
  email?: string | null
  phone?: string | null
  address_line_1: string
  address_line_2?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  country?: string | null
  is_primary?: boolean
  copied_from_billing_address_uuid?: string | null
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  return false
}

function toIso(value: unknown): string | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function ns(value: unknown): string | null {
  const s = String(value ?? '').trim()
  return s ? s : null
}

export function toAddressApiModel(row: ProjectAddressRow): ProjectAddressApiModel {
  return {
    id: Number(row.id ?? 0),
    uuid: String(row.uuid ?? ''),
    project_uuid: String(row.project_uuid ?? ''),
    address_type: String(row.address_type ?? ''),
    contact_person: ns(row.contact_person),
    email: ns(row.email),
    phone: ns(row.phone),
    address_line_1: String(row.address_line_1 ?? ''),
    address_line_2: ns(row.address_line_2),
    city: ns(row.city),
    state: ns(row.state),
    zip_code: ns(row.zip_code),
    country: ns(row.country),
    is_primary: toBoolean(row.is_primary),
    is_active: toBoolean(row.is_active),
    copied_from_billing_address_uuid: ns(row.copied_from_billing_address_uuid),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
  }
}

export async function listProjectAddresses(projectUuid: string): Promise<ProjectAddressApiModel[]> {
  const rows = await mssqlQueryParams<ProjectAddressRow>(
    `
      SELECT *
      FROM dbo.project_addresses
      WHERE project_uuid = @projectUuid
        AND ISNULL(is_active, 1) = 1
      ORDER BY address_type ASC
    `,
    { projectUuid },
  )
  return rows.map(toAddressApiModel)
}

export async function getProjectAddressByUuid(uuid: string): Promise<ProjectAddressApiModel | null> {
  const rows = await mssqlQueryParams<ProjectAddressRow>(
    `SELECT TOP 1 * FROM dbo.project_addresses WHERE uuid = @uuid`,
    { uuid },
  )
  return rows[0] ? toAddressApiModel(rows[0]) : null
}

export async function createProjectAddress(input: UpsertAddressInput): Promise<ProjectAddressApiModel> {
  const rows = await mssqlQueryParams<ProjectAddressRow>(
    `
      INSERT INTO dbo.project_addresses (
        uuid, project_uuid, address_type, contact_person, email, phone,
        address_line_1, address_line_2, city, state, zip_code, country,
        is_primary, is_active, copied_from_billing_address_uuid,
        created_at, updated_at
      )
      OUTPUT inserted.*
      VALUES (
        LOWER(CONVERT(NVARCHAR(36), NEWID())),
        @project_uuid, @address_type, @contact_person, @email, @phone,
        @address_line_1, @address_line_2, @city, @state, @zip_code, @country,
        @is_primary, 1, @copied_from_billing_address_uuid,
        GETUTCDATE(), GETUTCDATE()
      )
    `,
    {
      project_uuid: input.project_uuid,
      address_type: input.address_type,
      contact_person: ns(input.contact_person),
      email: ns(input.email),
      phone: ns(input.phone),
      address_line_1: input.address_line_1,
      address_line_2: ns(input.address_line_2),
      city: ns(input.city),
      state: ns(input.state),
      zip_code: ns(input.zip_code),
      country: ns(input.country),
      is_primary: (input.is_primary ?? false) ? 1 : 0,
      copied_from_billing_address_uuid: ns(input.copied_from_billing_address_uuid),
    },
  )

  const row = rows[0]
  if (!row) throw createError({ statusCode: 500, statusMessage: 'Failed to create project address' })
  return toAddressApiModel(row)
}

export async function updateProjectAddress(uuid: string, input: Partial<UpsertAddressInput>): Promise<ProjectAddressApiModel | null> {
  const existing = await getProjectAddressByUuid(uuid)
  if (!existing) return null

  const rows = await mssqlQueryParams<ProjectAddressRow>(
    `
      UPDATE dbo.project_addresses
      SET
        address_type                     = @address_type,
        contact_person                   = @contact_person,
        email                            = @email,
        phone                            = @phone,
        address_line_1                   = @address_line_1,
        address_line_2                   = @address_line_2,
        city                             = @city,
        state                            = @state,
        zip_code                         = @zip_code,
        country                          = @country,
        is_primary                       = @is_primary,
        copied_from_billing_address_uuid = @copied_from_billing_address_uuid,
        updated_at                       = GETUTCDATE()
      OUTPUT inserted.*
      WHERE uuid = @uuid
    `,
    {
      uuid,
      address_type: input.address_type ?? existing.address_type,
      contact_person: ns(input.contact_person !== undefined ? input.contact_person : existing.contact_person),
      email: ns(input.email !== undefined ? input.email : existing.email),
      phone: ns(input.phone !== undefined ? input.phone : existing.phone),
      address_line_1: input.address_line_1 ?? existing.address_line_1,
      address_line_2: ns(input.address_line_2 !== undefined ? input.address_line_2 : existing.address_line_2),
      city: ns(input.city !== undefined ? input.city : existing.city),
      state: ns(input.state !== undefined ? input.state : existing.state),
      zip_code: ns(input.zip_code !== undefined ? input.zip_code : existing.zip_code),
      country: ns(input.country !== undefined ? input.country : existing.country),
      is_primary: ((input.is_primary !== undefined ? input.is_primary : existing.is_primary) ? 1 : 0),
      copied_from_billing_address_uuid: ns(input.copied_from_billing_address_uuid !== undefined ? input.copied_from_billing_address_uuid : existing.copied_from_billing_address_uuid),
    },
  )

  return rows[0] ? toAddressApiModel(rows[0]) : null
}

export async function softDeleteProjectAddress(uuid: string): Promise<boolean> {
  await mssqlQueryParams(
    `UPDATE dbo.project_addresses SET is_active = 0, updated_at = GETUTCDATE() WHERE uuid = @uuid`,
    { uuid },
  )
  return true
}

export async function checkAddressUsage(uuid: string): Promise<{ in_use: boolean }> {
  // Addresses are project-scoped; no cross-entity usage currently.
  return { in_use: false }
}
