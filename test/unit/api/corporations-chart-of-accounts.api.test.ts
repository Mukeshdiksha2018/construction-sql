import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createError } from 'h3'

const mockFetchNimble = vi.fn()

vi.mock('../../../server/utils/nimbleChartOfAccounts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../server/utils/nimbleChartOfAccounts')>()
  return {
    ...actual,
    fetchNimbleChartOfAccounts: (...a: unknown[]) => mockFetchNimble(...a),
  }
})

describe('GET /api/corporations/chart-of-accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('defineEventHandler', (handler: any) => handler)
    vi.stubGlobal('createError', createError)
    vi.stubGlobal('getQuery', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function loadHandler() {
    vi.resetModules()
    const mod = await import('../../../server/api/corporations/chart-of-accounts.get')
    return mod.default as (event: unknown) => Promise<unknown>
  }

  it('requires corporation_uuid', async () => {
    ;(getQuery as any).mockReturnValue({})
    const handler = await loadHandler()
    await expect(handler({})).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns normalised Nimble accounts as { data }', async () => {
    ;(getQuery as any).mockReturnValue({ corporation_uuid: 'corp-1' })
    mockFetchNimble.mockResolvedValue({
      accounts: [{ ID: 'a1', Number: '1000', Name: 'Cash' }],
      normalised: [
        {
          uuid: 'a1',
          code: '1000',
          account_name: 'Cash',
          account_type: 'Asset',
          corporation_uuid: 'corp-1',
          is_active: true,
        },
      ],
    })

    const handler = await loadHandler()
    const result = (await handler({})) as { data: unknown[] }

    expect(mockFetchNimble).toHaveBeenCalledWith(expect.anything(), 'corp-1')
    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toMatchObject({
      uuid: 'a1',
      code: '1000',
      account_name: 'Cash',
    })
  })
})

describe('normaliseNimbleAccount', () => {
  it('maps Nimble DTO fields used by ChartOfAccountsSelect', async () => {
    const { normaliseNimbleAccount } = await import(
      '../../../server/utils/nimbleChartOfAccounts'
    )
    const row = normaliseNimbleAccount(
      {
        ID: 'acct-1',
        Number: '490202.000',
        Name: 'Expense',
        AccountTypeName: 'Expense',
        AccountTypeID: 'type-1',
        AccountTypeOrder: 5,
        CorporationID: 'corp-1',
        IsAllow: 1,
        IsAllowAccount: true,
      },
      'corp-fallback',
    )

    expect(row).toMatchObject({
      uuid: 'acct-1',
      code: '490202.000',
      account_name: 'Expense',
      account_type: 'Expense',
      corporation_uuid: 'corp-1',
      is_active: true,
    })
  })
})
