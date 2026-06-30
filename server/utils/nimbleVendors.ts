import {
  hexToNimbleBinary,
  newNimbleBusinessId,
  nimbleBinaryToHex,
  normalizeNimbleHexId,
  optionalHexToNimbleBinary,
} from './nimbleBinaryId'
import { nimbleMssqlQueryParams } from './nimbleMssql'

/** `dbo.Business.Type` — 0 = customer, 1 = vendor */
export const NIMBLE_BUSINESS_TYPE_CUSTOMER = 0
export const NIMBLE_BUSINESS_TYPE_VENDOR = 1

export type NimbleVendorStatus = 0 | 1 | 3
export type NimbleVendorStatusLabel = 'inactive' | 'active' | 'deleted'

export interface NimbleVendorDto {
  vendor_id: string
  name: string
  company_name: string | null
  corporation_id: string
  account_id: string | null
  status: NimbleVendorStatus
  status_label: NimbleVendorStatusLabel
  tax_id: string | null
  contact_person_name: string | null
  credit_limit: number | null
  check_reference: string | null
  federal_id: string | null
  ssn: string | null
  print_check_as: string | null
  is_1099: boolean
  credit_days_id: string | null
  type: number
  bid: string | null
  created_by: string | null
  modified_by: string | null
  created_at: string | null
  modified_at: string | null
}

export interface NimbleVendorInput {
  corporation_id: string
  name: string
  company_name?: string | null
  account_id?: string | null
  status?: NimbleVendorStatus
  tax_id?: string | null
  contact_person_name?: string | null
  credit_limit?: number | null
  check_reference?: string | null
  federal_id?: string | null
  ssn?: string | null
  print_check_as?: string | null
  is_1099?: boolean
  credit_days_id?: string | null
}

type BusinessRow = {
  id_hex: string
  Type: number
  Name: string
  CompanyName: string | null
  corporation_id_hex: string
  account_id_hex: string | null
  Status: number
  TaxID: string | null
  ContactPersonName: string | null
  CreditLimit: number | null
  CheckReference: string | null
  FederalID: string | null
  SSN: string | null
  PrintCheckAs: string | null
  Is1099: boolean | number | null
  credit_days_id_hex: string | null
  created_by_hex: string | null
  modified_by_hex: string | null
  CreatedDateBy: Date | null
  ModifiedDateBy: Date | null
  BID: bigint | number | null
}

const BUSINESS_SELECT = `
  SELECT
    LOWER(CONVERT(varchar(36), b.ID, 2)) AS id_hex,
    b.Type,
    b.Name,
    b.CompanyName,
    LOWER(CONVERT(varchar(36), b.CorporationID, 2)) AS corporation_id_hex,
    LOWER(CONVERT(varchar(36), b.AccountID, 2)) AS account_id_hex,
    b.Status,
    b.TaxID,
    b.ContactPersonName,
    b.CreditLimit,
    b.CheckReference,
    bi.FederalID,
    bi.SSN,
    bi.PrintCheckAs,
    bi.Is1099,
    LOWER(CONVERT(varchar(36), bi.CreditDaysID, 2)) AS credit_days_id_hex,
    LOWER(CONVERT(varchar(36), b.CreatedBy, 2)) AS created_by_hex,
    LOWER(CONVERT(varchar(36), b.ModifiedBy, 2)) AS modified_by_hex,
    b.CreatedDateBy,
    b.ModifiedDateBy,
    b.BID
  FROM dbo.Business b
  LEFT JOIN dbo.BusinessInfo bi ON bi.ID = b.ID
`

function statusLabel(status: number): NimbleVendorStatusLabel {
  if (status === 1) return 'active'
  if (status === 3) return 'deleted'
  return 'inactive'
}

function isVendorRow(row: BusinessRow): boolean {
  return row.Type === NIMBLE_BUSINESS_TYPE_VENDOR
}

function toIsoDate(value: Date | null | undefined): string | null {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : String(value)
}

function mapBusinessRow(row: BusinessRow): NimbleVendorDto {
  const status = row.Status as NimbleVendorStatus
  return {
    vendor_id: normalizeNimbleHexId(row.id_hex),
    name: row.Name,
    company_name: row.CompanyName ?? null,
    corporation_id: normalizeNimbleHexId(row.corporation_id_hex),
    account_id: row.account_id_hex ? normalizeNimbleHexId(row.account_id_hex) : null,
    status,
    status_label: statusLabel(status),
    tax_id: row.TaxID ?? null,
    contact_person_name: row.ContactPersonName ?? null,
    credit_limit: row.CreditLimit != null ? Number(row.CreditLimit) : null,
    check_reference: row.CheckReference ?? null,
    federal_id: row.FederalID ?? row.TaxID ?? null,
    ssn: row.SSN ?? null,
    print_check_as: row.PrintCheckAs ?? null,
    is_1099: row.Is1099 === true || row.Is1099 === 1,
    credit_days_id: row.credit_days_id_hex
      ? normalizeNimbleHexId(row.credit_days_id_hex)
      : null,
    type: row.Type,
    bid: row.BID != null ? String(row.BID) : null,
    created_by: row.created_by_hex ? normalizeNimbleHexId(row.created_by_hex) : null,
    modified_by: row.modified_by_hex ? normalizeNimbleHexId(row.modified_by_hex) : null,
    created_at: toIsoDate(row.CreatedDateBy),
    modified_at: toIsoDate(row.ModifiedDateBy),
  }
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value != null ? String(value).trim() : ''
}

function parseStatus(value: unknown, fallback: NimbleVendorStatus = 1): NimbleVendorStatus {
  const n = Number(value)
  if (n === 0 || n === 1 || n === 3) return n
  return fallback
}

function parseBool(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true'
}

export function parseNimbleVendorBody(body: unknown, requireCorporation = true): NimbleVendorInput {
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Request body is required' })
  }

  const raw = body as Record<string, unknown>
  const corporationId = safeString(raw.corporation_id ?? raw.corporation_uuid)
  const name = safeString(raw.name ?? raw.vendor_name)

  if (requireCorporation && !corporationId) {
    throw createError({ statusCode: 400, statusMessage: 'Corporation is required' })
  }
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Vendor name is required' })
  }

  const creditLimitRaw = raw.credit_limit
  let creditLimit: number | null = null
  if (creditLimitRaw != null && creditLimitRaw !== '') {
    const n = Number(creditLimitRaw)
    if (!Number.isFinite(n)) {
      throw createError({ statusCode: 400, statusMessage: 'Credit limit must be a number' })
    }
    creditLimit = n
  }

  const federalId = safeString(raw.federal_id ?? raw.vendor_federal_id) || null

  return {
    corporation_id: corporationId,
    name,
    company_name: safeString(raw.company_name) || null,
    account_id: safeString(raw.account_id ?? raw.account_uuid) || null,
    status: parseStatus(raw.status, 1),
    tax_id: federalId || safeString(raw.tax_id) || null,
    contact_person_name: safeString(raw.contact_person_name) || null,
    credit_limit: creditLimit,
    check_reference: safeString(raw.check_reference) || null,
    federal_id: federalId,
    ssn: safeString(raw.ssn ?? raw.vendor_ssn) || null,
    print_check_as: safeString(raw.print_check_as ?? raw.check_printed_as) || null,
    is_1099: parseBool(raw.is_1099),
    credit_days_id: safeString(raw.credit_days_id) || null,
  }
}

async function upsertBusinessInfo(
  businessId: Buffer,
  payload: NimbleVendorInput,
): Promise<void> {
  const creditDaysId = optionalHexToNimbleBinary(payload.credit_days_id)
  const existing = await nimbleMssqlQueryParams<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM dbo.BusinessInfo WHERE ID = @id`,
    { id: businessId },
  )

  if (Number(existing[0]?.cnt ?? 0) > 0) {
    await nimbleMssqlQueryParams(
      `UPDATE dbo.BusinessInfo SET
        FederalID = @federalId,
        SSN = @ssn,
        PrintCheckAs = @printCheckAs,
        Is1099 = @is1099,
        CreditDaysID = @creditDaysId
      WHERE ID = @id`,
      {
        id: businessId,
        federalId: payload.federal_id ?? payload.tax_id ?? null,
        ssn: payload.ssn ?? null,
        printCheckAs: payload.print_check_as ?? null,
        is1099: payload.is_1099 ? 1 : 0,
        creditDaysId,
      },
    )
  }
  else {
    await nimbleMssqlQueryParams(
      `INSERT INTO dbo.BusinessInfo (
        ID, FederalID, SSN, PrintCheckAs, Is1099, CreditDaysID
      ) VALUES (
        @id, @federalId, @ssn, @printCheckAs, @is1099, @creditDaysId
      )`,
      {
        id: businessId,
        federalId: payload.federal_id ?? payload.tax_id ?? null,
        ssn: payload.ssn ?? null,
        printCheckAs: payload.print_check_as ?? null,
        is1099: payload.is_1099 ? 1 : 0,
        creditDaysId,
      },
    )
  }
}

export interface ListNimbleVendorsOptions {
  corporationId?: string
  status?: NimbleVendorStatus
  includeDeleted?: boolean
}

export async function listNimbleVendors(options: ListNimbleVendorsOptions = {}): Promise<NimbleVendorDto[]> {
  const { corporationId, status, includeDeleted = false } = options

  const conditions: string[] = [`b.Type = ${NIMBLE_BUSINESS_TYPE_VENDOR}`]
  const inputs: Record<string, unknown> = {}

  if (corporationId) {
    conditions.push('b.CorporationID = @corporationId')
    inputs.corporationId = hexToNimbleBinary(corporationId)
  }

  if (status != null) {
    conditions.push('b.Status = @status')
    inputs.status = status
  }
  else if (!includeDeleted) {
    conditions.push('b.Status <> 3')
  }

  const rows = await nimbleMssqlQueryParams<BusinessRow>(
    `${BUSINESS_SELECT}
     WHERE ${conditions.join(' AND ')}
     ORDER BY b.Name`,
    inputs,
  )

  return rows.map(mapBusinessRow)
}

export async function getNimbleVendor(id: string): Promise<NimbleVendorDto | null> {
  const rows = await nimbleMssqlQueryParams<BusinessRow>(
    `${BUSINESS_SELECT}
     WHERE b.ID = @id AND b.Type = ${NIMBLE_BUSINESS_TYPE_VENDOR}`,
    { id: hexToNimbleBinary(id) },
  )
  const row = rows[0]
  return row && isVendorRow(row) ? mapBusinessRow(row) : null
}

function actorBinary(actorUserId: string | undefined): Buffer | null {
  const id = safeString(actorUserId)
  if (!id) return null
  try {
    return hexToNimbleBinary(id)
  }
  catch {
    return null
  }
}

export async function createNimbleVendor(
  payload: NimbleVendorInput,
  actorUserId?: string,
): Promise<NimbleVendorDto> {
  const id = await newNimbleBusinessId()
  const corporationId = hexToNimbleBinary(payload.corporation_id)
  const accountId = optionalHexToNimbleBinary(payload.account_id)
  const actor = actorBinary(actorUserId)

  const bidRows = await nimbleMssqlQueryParams<{ nextBid: bigint | number }>(`
    SELECT ISNULL(MAX(BID), 0) + 1 AS nextBid FROM dbo.Business
  `)
  const nextBid = bidRows[0]?.nextBid ?? 1

  await nimbleMssqlQueryParams(
    `INSERT INTO dbo.Business (
      ID, Type, Name, CompanyName, CorporationID, AccountID, Status,
      TaxID, ContactPersonName, CreditLimit, CheckReference,
      CreatedBy, ModifiedBy, BID, CreatedDateBy, ModifiedDateBy
    ) VALUES (
      @id, @type, @name, @companyName, @corporationId, @accountId, @status,
      @taxId, @contactPersonName, @creditLimit, @checkReference,
      @createdBy, @modifiedBy, @bid, GETUTCDATE(), GETUTCDATE()
    )`,
    {
      id,
      type: NIMBLE_BUSINESS_TYPE_VENDOR,
      name: payload.name,
      companyName: payload.company_name ?? null,
      corporationId,
      accountId,
      status: payload.status ?? 1,
      taxId: payload.federal_id ?? payload.tax_id ?? null,
      contactPersonName: payload.contact_person_name ?? null,
      creditLimit: payload.credit_limit ?? null,
      checkReference: payload.check_reference ?? null,
      createdBy: actor,
      modifiedBy: actor,
      bid: nextBid,
    },
  )

  await upsertBusinessInfo(id, payload)

  const created = await getNimbleVendor(nimbleBinaryToHex(id)!)
  if (!created) {
    throw createError({ statusCode: 500, statusMessage: 'Vendor was created but could not be loaded' })
  }
  return created
}

export async function updateNimbleVendor(
  id: string,
  payload: NimbleVendorInput,
  actorUserId?: string,
): Promise<NimbleVendorDto> {
  const existing = await getNimbleVendor(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Vendor not found' })
  }

  const businessId = hexToNimbleBinary(id)
  const accountId = optionalHexToNimbleBinary(payload.account_id)
  const actor = actorBinary(actorUserId)

  await nimbleMssqlQueryParams(
    `UPDATE dbo.Business SET
      Name = @name,
      CompanyName = @companyName,
      AccountID = @accountId,
      Status = @status,
      TaxID = @taxId,
      ContactPersonName = @contactPersonName,
      CreditLimit = @creditLimit,
      CheckReference = @checkReference,
      ModifiedBy = @modifiedBy,
      ModifiedDateBy = GETUTCDATE()
    WHERE ID = @id AND Type = ${NIMBLE_BUSINESS_TYPE_VENDOR}`,
    {
      id: businessId,
      name: payload.name,
      companyName: payload.company_name ?? null,
      accountId,
      status: payload.status ?? existing.status,
      taxId: payload.federal_id ?? payload.tax_id ?? null,
      contactPersonName: payload.contact_person_name ?? null,
      creditLimit: payload.credit_limit ?? null,
      checkReference: payload.check_reference ?? null,
      modifiedBy: actor,
    },
  )

  await upsertBusinessInfo(businessId, payload)

  const updated = await getNimbleVendor(id)
  if (!updated) {
    throw createError({ statusCode: 500, statusMessage: 'Vendor was updated but could not be loaded' })
  }
  return updated
}

export async function softDeleteNimbleVendor(
  id: string,
  actorUserId?: string,
): Promise<NimbleVendorDto> {
  const existing = await getNimbleVendor(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Vendor not found' })
  }

  const actor = actorBinary(actorUserId)

  await nimbleMssqlQueryParams(
    `UPDATE dbo.Business SET
      Status = 3,
      ModifiedBy = @modifiedBy,
      ModifiedDateBy = GETUTCDATE()
    WHERE ID = @id AND Type = ${NIMBLE_BUSINESS_TYPE_VENDOR}`,
    {
      id: hexToNimbleBinary(id),
      modifiedBy: actor,
    },
  )

  const deleted = await getNimbleVendor(id)
  if (!deleted) {
    throw createError({ statusCode: 500, statusMessage: 'Vendor was deleted but could not be loaded' })
  }
  return deleted
}
