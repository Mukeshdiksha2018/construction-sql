import { nimbleMssqlQueryParams } from './nimbleMssql'

export interface NimbleCountryDto {
  id: number
  code: string
  name: string
}

export interface NimbleStateDto {
  id: number
  country_id: number
  code: string
  name: string
}

export async function listCountries(): Promise<NimbleCountryDto[]> {
  const rows = await nimbleMssqlQueryParams<{
    ID: number
    Code: string
    Name: string
  }>(`
    SELECT ID, Code, Name
    FROM dbo.Country
    WHERE Status = 1
    ORDER BY Name
  `)
  return rows.map(r => ({
    id: Number(r.ID),
    code: r.Code?.trim() ?? '',
    name: r.Name,
  }))
}

export async function listStates(countryId?: number): Promise<NimbleStateDto[]> {
  const conditions = ['Status = 1']
  const inputs: Record<string, unknown> = {}
  if (countryId != null) {
    conditions.push('CountryID = @countryId')
    inputs.countryId = countryId
  }

  const rows = await nimbleMssqlQueryParams<{
    ID: number
    CountryID: number
    Code: string
    Name: string
  }>(`
    SELECT ID, CountryID, Code, Name
    FROM dbo.State
    WHERE ${conditions.join(' AND ')}
    ORDER BY Name
  `, inputs)

  return rows.map(r => ({
    id: Number(r.ID),
    country_id: Number(r.CountryID),
    code: r.Code?.trim() ?? '',
    name: r.Name,
  }))
}
