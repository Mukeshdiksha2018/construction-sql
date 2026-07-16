import { fetchNimbleChartOfAccounts } from '../../utils/nimbleChartOfAccounts'

/**
 * GET /api/corporations/chart-of-accounts?corporation_uuid=<uuid>
 *
 * Compatibility route for payables UIs (HoldbackBreakdownTable, AdvancePaymentCostCodesTable)
 * that expect `{ data: [{ uuid, code, account_name, ... }] }`.
 *
 * There is no local chart_of_accounts table — accounts come from Nimble Core.
 * Mutations (POST/PUT/DELETE) are not supported; manage accounts in Nimble.
 */
export default defineEventHandler(async (event) => {
  const { corporation_uuid } = getQuery(event)
  if (!corporation_uuid) {
    throw createError({
      statusCode: 400,
      statusMessage: 'corporation_uuid query parameter is required',
    })
  }

  const { normalised } = await fetchNimbleChartOfAccounts(
    event,
    String(corporation_uuid),
  )

  return { data: normalised }
})
