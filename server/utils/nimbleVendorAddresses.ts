import sql from 'mssql'
import {
  hexToNimbleBinary,
  newNimbleBusinessId,
  normalizeNimbleHexId,
  optionalHexToNimbleBinary,
} from './nimbleBinaryId'
import { getNimbleVendor } from './nimbleVendors'
import { nimbleMssqlQueryParams, nimbleMssqlTransaction } from './nimbleMssql'

export interface VendorAddressDto {
  vendor_address_id: number
  vendor_id: string
  address_id: string
  contact_id: string
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  state_id: number | null
  state_name: string | null
  country_id: number | null
  country_name: string | null
  zip_code: string | null
  contact_name: string | null
  mobile_num: string | null
  alternative_num: string | null
  work_num: string | null
  fax_num: string | null
  email: string | null
  website: string | null
  address_type: number | null
  business_type_id: string | null
  is_default: boolean
  status: number
  status_label: 'inactive' | 'active'
}

export interface VendorAddressInput {
  name?: string | null
  address?: string | null
  address_line_2?: string | null
  city?: string | null
  country_id?: number | null
  state_id?: number | null
  zip_code?: string | null
  business_type_id?: string | null
  address_type?: number | null
  mobile_num?: string | null
  alternative_num?: string | null
  work_num?: string | null
  fax_num?: string | null
  email?: string | null
  website?: string | null
  is_default?: boolean
  is_active?: boolean
}

type VendorAddressRow = {
  vendor_address_id: number
  business_id_hex: string
  address_id_hex: string
  contact_id_hex: string
  Address1: string | null
  Address2: string | null
  City: string | null
  State: number | null
  state_name: string | null
  Country: number | null
  country_name: string | null
  ZipCode: string | null
  ContactName: string | null
  Phone1: string | null
  AlternateNum: string | null
  Phone3: string | null
  Fax: string | null
  Email: string | null
  Website: string | null
  AddressType: number | null
  business_type_id_hex: string | null
  IsDefault: boolean | number | null
  Status: number | null
}

const ADDRESS_SELECT = `
  SELECT
    va.ID AS vendor_address_id,
    LOWER(CONVERT(varchar(36), va.BusinessID, 2)) AS business_id_hex,
    LOWER(CONVERT(varchar(36), va.AdressID, 2)) AS address_id_hex,
    LOWER(CONVERT(varchar(36), va.ContactID, 2)) AS contact_id_hex,
    a.Address1,
    a.Address2,
    a.City,
    a.State,
    st.Name AS state_name,
    a.Country,
    co.Name AS country_name,
    a.ZipCode,
    c.ContactName,
    c.Phone1,
    c.AlternateNum,
    c.Phone3,
    c.Fax,
    c.Email,
    c.Website,
    va.AddressType,
    LOWER(CONVERT(varchar(36), va.BusinessTypeID, 2)) AS business_type_id_hex,
    va.IsDefault,
    va.Status
  FROM dbo.VendorAddress va
  INNER JOIN dbo.Address a ON a.ID = va.AdressID
  INNER JOIN dbo.Contact c ON c.ID = va.ContactID
  LEFT JOIN dbo.State st ON st.ID = a.State
  LEFT JOIN dbo.Country co ON co.ID = a.Country
`

function addressStatusLabel(status: number | null): 'inactive' | 'active' {
  return status === 1 ? 'active' : 'inactive'
}

function mapRow(row: VendorAddressRow): VendorAddressDto {
  return {
    vendor_address_id: Number(row.vendor_address_id),
    vendor_id: normalizeNimbleHexId(row.business_id_hex),
    address_id: normalizeNimbleHexId(row.address_id_hex),
    contact_id: normalizeNimbleHexId(row.contact_id_hex),
    address_line_1: row.Address1 ?? null,
    address_line_2: row.Address2 ?? null,
    city: row.City ?? null,
    state_id: row.State != null ? Number(row.State) : null,
    state_name: row.state_name ?? null,
    country_id: row.Country != null ? Number(row.Country) : null,
    country_name: row.country_name ?? null,
    zip_code: row.ZipCode ?? null,
    contact_name: row.ContactName ?? null,
    mobile_num: row.Phone1 ?? null,
    alternative_num: row.AlternateNum ?? null,
    work_num: row.Phone3 ?? null,
    fax_num: row.Fax ?? null,
    email: row.Email ?? null,
    website: row.Website ?? null,
    address_type: row.AddressType != null ? Number(row.AddressType) : null,
    business_type_id: row.business_type_id_hex
      ? normalizeNimbleHexId(row.business_type_id_hex)
      : null,
    is_default: row.IsDefault === true || row.IsDefault === 1,
    status: row.Status != null ? Number(row.Status) : 0,
    status_label: addressStatusLabel(row.Status),
  }
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value != null ? String(value).trim() : ''
}

function parseOptionalNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function parseVendorAddressBody(body: unknown): VendorAddressInput {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Request body is required' })
  }
  const raw = body as Record<string, unknown>
  return {
    name: safeString(raw.name ?? raw.contact_name) || null,
    address: safeString(raw.address ?? raw.address_line_1) || null,
    address_line_2: safeString(raw.address_line_2) || null,
    city: safeString(raw.city) || null,
    country_id: parseOptionalNumber(raw.country_id),
    state_id: parseOptionalNumber(raw.state_id),
    zip_code: safeString(raw.zip_code) || null,
    business_type_id: safeString(raw.business_type_id) || null,
    address_type: parseOptionalNumber(raw.address_type),
    mobile_num: safeString(raw.mobile_num) || null,
    alternative_num: safeString(raw.alternative_num) || null,
    work_num: safeString(raw.work_num) || null,
    fax_num: safeString(raw.fax_num) || null,
    email: safeString(raw.email) || null,
    website: safeString(raw.website) || null,
    is_default: raw.is_default === true || raw.is_default === 1,
    is_active: raw.is_active !== false && raw.is_active !== 0,
  }
}

export async function listVendorAddresses(businessId: string): Promise<VendorAddressDto[]> {
  const rows = await nimbleMssqlQueryParams<VendorAddressRow>(
    `${ADDRESS_SELECT}
     WHERE va.BusinessID = @businessId
     ORDER BY va.IsDefault DESC, va.ID`,
    { businessId: hexToNimbleBinary(businessId) },
  )
  return rows.map(mapRow)
}

export async function getVendorAddress(
  businessId: string,
  vendorAddressId: number,
): Promise<VendorAddressDto | null> {
  const rows = await nimbleMssqlQueryParams<VendorAddressRow>(
    `${ADDRESS_SELECT}
     WHERE va.BusinessID = @businessId AND va.ID = @vendorAddressId`,
    {
      businessId: hexToNimbleBinary(businessId),
      vendorAddressId,
    },
  )
  const row = rows[0]
  return row ? mapRow(row) : null
}

async function nextVendorAddressId(transaction: sql.Transaction): Promise<number> {
  const rows = await nimbleMssqlQueryParams<{ nextId: number }>(
    `SELECT ISNULL(MAX(ID), 0) + 1 AS nextId FROM dbo.VendorAddress`,
    {},
    transaction,
  )
  return Number(rows[0]?.nextId ?? 1)
}

export async function createVendorAddress(
  businessId: string,
  payload: VendorAddressInput,
): Promise<VendorAddressDto> {
  const vendor = await getNimbleVendor(businessId)
  if (!vendor) {
    throw createError({ statusCode: 404, statusMessage: 'Vendor not found' })
  }

  const addressId = await newNimbleBusinessId()
  const contactId = await newNimbleBusinessId()
  const businessBinary = hexToNimbleBinary(businessId)
  const businessTypeId = optionalHexToNimbleBinary(payload.business_type_id)
  const status = payload.is_active === false ? 0 : 1

  const vendorAddressId = await nimbleMssqlTransaction(async (transaction) => {
    const existing = await nimbleMssqlQueryParams<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM dbo.VendorAddress WHERE BusinessID = @businessId`,
      { businessId: businessBinary },
      transaction,
    )
    const isFirst = Number(existing[0]?.cnt ?? 0) === 0
    const isDefault = payload.is_default || isFirst

    if (isDefault) {
      await nimbleMssqlQueryParams(
        `UPDATE dbo.VendorAddress SET IsDefault = 0 WHERE BusinessID = @businessId`,
        { businessId: businessBinary },
        transaction,
      )
    }

    await nimbleMssqlQueryParams(
      `INSERT INTO dbo.Address (ID, Address1, Address2, City, State, Country, ZipCode)
       VALUES (@id, @address1, @address2, @city, @state, @country, @zip)`,
      {
        id: addressId,
        address1: payload.address ?? null,
        address2: payload.address_line_2 ?? null,
        city: payload.city ?? null,
        state: payload.state_id ?? null,
        country: payload.country_id ?? null,
        zip: payload.zip_code ?? null,
      },
      transaction,
    )

    await nimbleMssqlQueryParams(
      `INSERT INTO dbo.Contact (
        ID, ContactName, Phone1, AlternateNum, Phone3, Fax, Email, Website
      ) VALUES (
        @id, @name, @phone1, @alt, @phone3, @fax, @email, @website
      )`,
      {
        id: contactId,
        name: payload.name ?? null,
        phone1: payload.mobile_num ?? null,
        alt: payload.alternative_num ?? null,
        phone3: payload.work_num ?? null,
        fax: payload.fax_num ?? null,
        email: payload.email ?? null,
        website: payload.website ?? null,
      },
      transaction,
    )

    const linkId = await nextVendorAddressId(transaction)
    await nimbleMssqlQueryParams(
      `INSERT INTO dbo.VendorAddress (
        ID, BusinessID, AdressID, ContactID, BusinessTypeID, Status, IsDefault, AddressType
      ) VALUES (
        @id, @businessId, @addressId, @contactId, @businessTypeId, @status, @isDefault, @addressType
      )`,
      {
        id: linkId,
        businessId: businessBinary,
        addressId,
        contactId,
        businessTypeId,
        status,
        isDefault: isDefault ? 1 : 0,
        addressType: payload.address_type ?? 0,
      },
      transaction,
    )
    return linkId
  })

  const created = await getVendorAddress(businessId, vendorAddressId)
  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'Address was created but could not be loaded' })
  }
  return created
}

export async function updateVendorAddress(
  businessId: string,
  vendorAddressId: number,
  payload: VendorAddressInput,
): Promise<VendorAddressDto> {
  const existing = await getVendorAddress(businessId, vendorAddressId)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Vendor address not found' })
  }

  const businessBinary = hexToNimbleBinary(businessId)
  const addressBinary = hexToNimbleBinary(existing.address_id)
  const contactBinary = hexToNimbleBinary(existing.contact_id)
  const businessTypeId = optionalHexToNimbleBinary(payload.business_type_id)
  const status = payload.is_active === false ? 0 : 1
  const isDefault = !!payload.is_default

  await nimbleMssqlTransaction(async (transaction) => {
    if (isDefault) {
      await nimbleMssqlQueryParams(
        `UPDATE dbo.VendorAddress SET IsDefault = 0 WHERE BusinessID = @businessId`,
        { businessId: businessBinary },
        transaction,
      )
    }

    await nimbleMssqlQueryParams(
      `UPDATE dbo.Address SET
        Address1 = @address1,
        Address2 = @address2,
        City = @city,
        State = @state,
        Country = @country,
        ZipCode = @zip
      WHERE ID = @id`,
      {
        id: addressBinary,
        address1: payload.address ?? null,
        address2: payload.address_line_2 ?? null,
        city: payload.city ?? null,
        state: payload.state_id ?? null,
        country: payload.country_id ?? null,
        zip: payload.zip_code ?? null,
      },
      transaction,
    )

    await nimbleMssqlQueryParams(
      `UPDATE dbo.Contact SET
        ContactName = @name,
        Phone1 = @phone1,
        AlternateNum = @alt,
        Phone3 = @phone3,
        Fax = @fax,
        Email = @email,
        Website = @website
      WHERE ID = @id`,
      {
        id: contactBinary,
        name: payload.name ?? null,
        phone1: payload.mobile_num ?? null,
        alt: payload.alternative_num ?? null,
        phone3: payload.work_num ?? null,
        fax: payload.fax_num ?? null,
        email: payload.email ?? null,
        website: payload.website ?? null,
      },
      transaction,
    )

    await nimbleMssqlQueryParams(
      `UPDATE dbo.VendorAddress SET
        BusinessTypeID = @businessTypeId,
        Status = @status,
        IsDefault = @isDefault,
        AddressType = @addressType
      WHERE ID = @id AND BusinessID = @businessId`,
      {
        id: vendorAddressId,
        businessId: businessBinary,
        businessTypeId,
        status,
        isDefault: isDefault ? 1 : 0,
        addressType: payload.address_type ?? existing.address_type ?? 0,
      },
      transaction,
    )
  })

  const updated = await getVendorAddress(businessId, vendorAddressId)
  if (!updated) {
    throw createError({ statusCode: 500, statusMessage: 'Address was updated but could not be loaded' })
  }
  return updated
}

export async function softDeleteVendorAddress(
  businessId: string,
  vendorAddressId: number,
): Promise<VendorAddressDto> {
  const existing = await getVendorAddress(businessId, vendorAddressId)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Vendor address not found' })
  }

  await nimbleMssqlQueryParams(
    `UPDATE dbo.VendorAddress SET Status = 0, IsDefault = 0
     WHERE ID = @id AND BusinessID = @businessId`,
    {
      id: vendorAddressId,
      businessId: hexToNimbleBinary(businessId),
    },
  )

  const deleted = await getVendorAddress(businessId, vendorAddressId)
  if (!deleted) {
    throw createError({ statusCode: 500, statusMessage: 'Address was deleted but could not be loaded' })
  }
  return deleted
}
