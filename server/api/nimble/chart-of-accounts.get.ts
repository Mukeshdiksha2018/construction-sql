import { fetchNimbleChartOfAccounts } from '../../utils/nimbleChartOfAccounts'

/**
 * GET /api/nimble/chart-of-accounts?corporation_uuid=<uuid>
 *
 * Proxies Nimble Core API chart of accounts list for a given corporation.
 * Response envelope: { accounts, total } (raw Nimble DTOs).
 */
export default defineEventHandler(async (event) => {
  const { corporation_uuid } = getQuery(event)
  if (!corporation_uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'corporation_uuid query parameter is required',
    })
  }

  const { accounts } = await fetchNimbleChartOfAccounts(
    event,
    String(corporation_uuid),
  )

  return { accounts, total: accounts.length }
})
