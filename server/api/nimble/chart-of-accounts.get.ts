import { requireAuthSession } from '../../utils/auth-session'

/**
 * GET /api/nimble/chart-of-accounts?corporation_uuid=<uuid>
 *
 * Proxies the Nimble Core API chart of accounts list for a given corporation.
 * Endpoint: {NUXT_PUBLIC_NIMBLE_CORE_API_URL}/v1/accounts
 *   ?AccountTypeID=000000000000000000000000000000000000   ← all types
 *   &IsInactive=false                                     ← active only
 *   &CorpID=<corporation_uuid>
 *
 * Response envelope: { Accounts: [...], TotalCount: number }
 */

const ALL_ACCOUNT_TYPES_ID = '000000000000000000000000000000000000'

interface NimbleAccountItem {
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

interface NimbleAccountsResponse {
  Accounts?: NimbleAccountItem[]
  TotalCount?: number
}

export default defineEventHandler(async (event) => {
  const session = requireAuthSession(event)
  const config = useRuntimeConfig()

  const coreBaseUrl = String((config.public as Record<string, unknown>).nimbleCoreApiUrl || '').trim().replace(/\/$/, '')

  if (!coreBaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NUXT_PUBLIC_NIMBLE_CORE_API_URL is not configured',
    })
  }

  const { corporation_uuid } = getQuery(event)
  if (!corporation_uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'corporation_uuid query parameter is required',
    })
  }

  try {
    const data = await $fetch<NimbleAccountsResponse>(
      `${coreBaseUrl}/v1/accounts`,
      {
        query: {
          AccountTypeID: ALL_ACCOUNT_TYPES_ID,
          IsInactive: false,
          CorpID: corporation_uuid,
        },
        headers: { Authorization: `Bearer ${session.token}` },
      },
    )

    const accounts = data?.Accounts ?? []
    return { accounts, total: accounts.length }
  }
  catch (err: unknown) {
    const status = (err as { statusCode?: number })?.statusCode ?? 502
    throw createError({
      statusCode: status,
      statusMessage: 'Failed to fetch chart of accounts from Nimble',
      data: { details: String(err) },
    })
  }
})
