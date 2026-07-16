import type { H3Event } from 'h3'
import { requireAuthSession } from './auth-session'

const ALL_ACCOUNT_TYPES_ID = '000000000000000000000000000000000000'

export interface NimbleAccountItem {
  ID?: string
  Number?: string
  Name?: string
  AccountTypeName?: string | null
  AccountTypeID?: string
  AccountTypeOrder?: number
  CorporationID?: string
  CorporationName?: string | null
  ParentAccountName?: string | null
  ParentAccountNumber?: string | null
  AccountStatus?: number
  IsAllow?: number
  IsAllowAccount?: boolean
  ClientName?: string | null
}

export interface NimbleAccountsResponse {
  Accounts?: NimbleAccountItem[]
  TotalCount?: number
}

/** Shape expected by ChartOfAccountsSelect / payables local-accounts props */
export interface ChartOfAccountRow {
  uuid: string
  code: string
  account_name: string
  account_type: string | null
  account_type_id: string
  account_type_order: number
  corporation_id: string
  corporation_uuid: string
  parent_account_name: string | null
  parent_account_number: string | null
  is_active: boolean
}

export function normaliseNimbleAccount(
  dto: NimbleAccountItem,
  corporationUuid?: string,
): ChartOfAccountRow {
  const corpId = dto.CorporationID ?? corporationUuid ?? ''
  return {
    uuid: dto.ID ?? '',
    code: dto.Number ?? '',
    account_name: dto.Name ?? '',
    account_type: dto.AccountTypeName ?? null,
    account_type_id: dto.AccountTypeID ?? '',
    account_type_order: dto.AccountTypeOrder ?? 0,
    corporation_id: corpId,
    corporation_uuid: corpId,
    parent_account_name: dto.ParentAccountName ?? null,
    parent_account_number: dto.ParentAccountNumber ?? null,
    is_active: dto.IsAllowAccount !== false && dto.IsAllow !== 0,
  }
}

/**
 * Fetch active Nimble chart-of-accounts for a corporation (Bearer session).
 * construction-sql has no local chart_of_accounts table — Nimble is source of truth.
 */
export async function fetchNimbleChartOfAccounts(
  event: H3Event,
  corporationUuid: string,
): Promise<{ accounts: NimbleAccountItem[]; normalised: ChartOfAccountRow[] }> {
  const session = requireAuthSession(event)
  const config = useRuntimeConfig()
  const coreBaseUrl = String(
    (config.public as Record<string, unknown>).nimbleCoreApiUrl || '',
  )
    .trim()
    .replace(/\/$/, '')

  if (!coreBaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NUXT_PUBLIC_NIMBLE_CORE_API_URL is not configured',
    })
  }

  try {
    const data = await $fetch<NimbleAccountsResponse>(`${coreBaseUrl}/v1/accounts`, {
      query: {
        AccountTypeID: ALL_ACCOUNT_TYPES_ID,
        IsInactive: false,
        CorpID: corporationUuid,
      },
      headers: { Authorization: `Bearer ${session.token}` },
    })

    const accounts = data?.Accounts ?? []
    const normalised = accounts.map((a) => normaliseNimbleAccount(a, corporationUuid))
    return { accounts, normalised }
  } catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode ?? 502
    throw createError({
      statusCode: status,
      statusMessage: 'Failed to fetch chart of accounts from Nimble',
      data: { details: String(err) },
    })
  }
}
