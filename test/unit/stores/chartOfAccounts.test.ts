import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useChartOfAccountsStore } from '~/stores/chartOfAccounts'

// ── Factories ─────────────────────────────────────────────────────────────────

const CORP_UUID = 'corp-abc-123'

function makeDTO(overrides: Record<string, unknown> = {}) {
  return {
    ID: 'acct-uuid-1',
    Number: '10000.000',
    Name: '10000.000. Cash',
    AccountTypeName: 'Bank',
    AccountTypeID: 'type-uuid-bank',
    AccountTypeOrder: 2,
    CorporationID: CORP_UUID,
    CorporationName: 'Test Corp',
    ParentAccountName: null,
    ParentAccountNumber: null,
    AccountStatus: 1,
    IsAllow: 1,
    IsAllowAccount: true,
    ClientName: null,
    ...overrides,
  }
}

function makeApiResponse(accounts = [makeDTO()]) {
  return { accounts, total: accounts.length }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useChartOfAccountsStore', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setActivePinia(createPinia())
    mockFetch = vi.fn()
    vi.stubGlobal('$fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── fetchAccounts ─────────────────────────────────────────────────────────

  describe('fetchAccounts', () => {
    it('calls the proxy endpoint with corporation_uuid', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/nimble/chart-of-accounts',
        { query: { corporation_uuid: CORP_UUID }, credentials: 'include' },
      )
    })

    it('does nothing when corporationUuid is undefined', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(undefined)

      expect(mockFetch).not.toHaveBeenCalled()
      expect(store.accounts).toHaveLength(0)
    })

    it('does nothing when corporationUuid is an empty string', async () => {
      const store = useChartOfAccountsStore()
      await store.fetchAccounts('')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('normalises the DTO: ID → uuid, Number → code, Name → account_name', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeDTO({ ID: 'u1', Number: '40000.000', Name: '40000.000. Sales' }),
      ]))
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)

      expect(store.accounts[0]).toMatchObject({
        uuid: 'u1',
        code: '40000.000',
        account_name: '40000.000. Sales',
      })
    })

    it('normalises AccountTypeName → account_type', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ AccountTypeName: 'Expense' })]))
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)

      expect(store.accounts[0]?.account_type).toBe('Expense')
    })

    it('sets account_type to null when AccountTypeName is null', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ AccountTypeName: null })]))
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)

      expect(store.accounts[0]?.account_type).toBeNull()
    })

    it('injects CorporationID from the queried uuid so per-corp filtering works', async () => {
      // The Nimble API does not echo CorporationID on each account object;
      // the store must inject it from the query parameter.
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ CorporationID: undefined })]))
      const store = useChartOfAccountsStore()

      await store.fetchAccounts('UPPER-CORP-UUID')

      expect(store.accounts[0]?.corporation_id).toBe('UPPER-CORP-UUID')
    })

    it('marks is_active = true when IsAllowAccount=true and IsAllow=1', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ IsAllowAccount: true, IsAllow: 1 })]))
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)

      expect(store.accounts[0]?.is_active).toBe(true)
    })

    it('marks is_active = false when IsAllowAccount is false', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ IsAllowAccount: false, IsAllow: 1 })]))
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)

      expect(store.accounts[0]?.is_active).toBe(false)
    })

    it('marks is_active = false when IsAllow is 0', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ IsAllowAccount: true, IsAllow: 0 })]))
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)

      expect(store.accounts[0]?.is_active).toBe(false)
    })

    it('sets loading = false after a successful fetch', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)

      expect(store.loading).toBe(false)
    })

    it('handles an empty accounts array gracefully', async () => {
      mockFetch.mockResolvedValue({ accounts: [], total: 0 })
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)

      expect(store.accounts).toHaveLength(0)
    })

    it('caches results: skips fetch when corporation already loaded', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)
      await store.fetchAccounts(CORP_UUID)

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('cache key is case-insensitive (upper and lower corp UUID treated as same)', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useChartOfAccountsStore()

      await store.fetchAccounts('CORP-ABC')
      await store.fetchAccounts('corp-abc')

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('bypasses cache when forceRefresh = true', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)
      await store.fetchAccounts(CORP_UUID, true)

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('fetches independently for different corporations', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useChartOfAccountsStore()

      await store.fetchAccounts('corp-1')
      await store.fetchAccounts('corp-2')

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('replaces existing accounts for a corp on re-fetch', async () => {
      const store = useChartOfAccountsStore()

      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ ID: 'old-acct' })]))
      await store.fetchAccounts(CORP_UUID)

      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ ID: 'new-acct' })]))
      await store.fetchAccounts(CORP_UUID, true)

      expect(store.accounts).toHaveLength(1)
      expect(store.accounts[0]?.uuid).toBe('new-acct')
    })

    it('keeps accounts for other corps when re-fetching a specific one', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ ID: 'acct-corp1' })]))
      const store = useChartOfAccountsStore()
      await store.fetchAccounts('corp-1')

      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ ID: 'acct-corp2' })]))
      await store.fetchAccounts('corp-2')

      expect(store.accounts).toHaveLength(2)
      expect(store.accounts.map(a => a.uuid)).toEqual(
        expect.arrayContaining(['acct-corp1', 'acct-corp2']),
      )
    })

    it('sets error.value on API failure', async () => {
      mockFetch.mockRejectedValue({ statusMessage: 'Unauthorized' })
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)

      expect(store.error).toBeTruthy()
    })

    it('reads error from data.statusMessage when present', async () => {
      mockFetch.mockRejectedValue({ data: { statusMessage: 'Custom upstream error' } })
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)

      expect(store.error).toBe('Custom upstream error')
    })

    it('reads error from statusMessage when data is absent', async () => {
      mockFetch.mockRejectedValue({ statusMessage: 'Gateway Timeout' })
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)

      expect(store.error).toBe('Gateway Timeout')
    })

    it('reads error from message when statusMessage is absent', async () => {
      mockFetch.mockRejectedValue(new Error('Network down'))
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)

      expect(store.error).toBe('Network down')
    })

    it('sets loading = false even on failure', async () => {
      mockFetch.mockRejectedValue(new Error('Fail'))
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)

      expect(store.loading).toBe(false)
    })

    it('does not add corp to cache on failure', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce(makeApiResponse())
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)
      await store.fetchAccounts(CORP_UUID)

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  // ── accountOptions computed ───────────────────────────────────────────────

  describe('accountOptions', () => {
    it('returns formatted options for all loaded accounts', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeDTO({ ID: 'u1', Number: '10000.000', Name: '10000.000. Cash', AccountTypeName: 'Bank' }),
      ]))
      const store = useChartOfAccountsStore()
      await store.fetchAccounts(CORP_UUID)

      expect(store.accountOptions[0]).toMatchObject({
        value: 'u1',
        label: expect.stringContaining('10000.000'),
        account_type: 'Bank',
      })
    })

    it('formats label as "code - name"', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeDTO({ ID: 'u1', Number: '4000.000', Name: '4000.000. Revenue' }),
      ]))
      const store = useChartOfAccountsStore()
      await store.fetchAccounts(CORP_UUID)

      expect(store.accountOptions[0]?.label).toBe('4000.000 - 4000.000. Revenue')
    })

    it('includes both active and inactive accounts in accountOptions', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeDTO({ ID: 'a', IsAllowAccount: true, IsAllow: 1 }),
        makeDTO({ ID: 'b', IsAllowAccount: false, IsAllow: 0 }),
      ]))
      const store = useChartOfAccountsStore()
      await store.fetchAccounts(CORP_UUID)

      expect(store.accountOptions).toHaveLength(2)
    })

    it('assigns correct account_type_color for known types', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeDTO({ AccountTypeName: 'Expense' }),
      ]))
      const store = useChartOfAccountsStore()
      await store.fetchAccounts(CORP_UUID)

      expect(store.accountOptions[0]?.account_type_color).toBe('warning')
    })

    it('assigns "neutral" color for unknown account types', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeDTO({ AccountTypeName: 'SomeUnknownType' }),
      ]))
      const store = useChartOfAccountsStore()
      await store.fetchAccounts(CORP_UUID)

      expect(store.accountOptions[0]?.account_type_color).toBe('neutral')
    })

    it('builds a searchText field containing code, name, and type', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeDTO({ Number: '42000.000', Name: '42000.000. Payroll', AccountTypeName: 'Expense' }),
      ]))
      const store = useChartOfAccountsStore()
      await store.fetchAccounts(CORP_UUID)

      const { searchText } = store.accountOptions[0]!
      expect(searchText).toContain('42000.000')
      expect(searchText).toContain('payroll')
      expect(searchText).toContain('expense')
    })
  })

  // ── getActiveAccounts getter ──────────────────────────────────────────────

  describe('getActiveAccounts', () => {
    it('returns only active accounts for the given corporation', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeDTO({ ID: 'a1', IsAllowAccount: true, IsAllow: 1 }),
        makeDTO({ ID: 'a2', IsAllowAccount: false, IsAllow: 0 }),
        makeDTO({ ID: 'a3', IsAllowAccount: true, IsAllow: 1 }),
      ]))
      const store = useChartOfAccountsStore()
      await store.fetchAccounts(CORP_UUID)

      const active = store.getActiveAccounts(CORP_UUID)
      expect(active).toHaveLength(2)
      expect(active.every(a => a.is_active)).toBe(true)
    })

    it('filters by corporation ID (case-insensitive)', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeDTO({ ID: 'corp1-acct' }),
      ]))
      const store = useChartOfAccountsStore()
      await store.fetchAccounts(CORP_UUID)

      const result = store.getActiveAccounts(CORP_UUID.toUpperCase())
      expect(result).toHaveLength(1)
    })

    it('returns empty array for a corporation that has no accounts', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO()]))
      const store = useChartOfAccountsStore()
      await store.fetchAccounts(CORP_UUID)

      expect(store.getActiveAccounts('unknown-corp')).toHaveLength(0)
    })

    it('excludes accounts from other corporations', async () => {
      const store = useChartOfAccountsStore()

      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ ID: 'c1-a1' })]))
      await store.fetchAccounts('corp-1')

      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ ID: 'c2-a1' })]))
      await store.fetchAccounts('corp-2')

      expect(store.getActiveAccounts('corp-1')).toHaveLength(1)
      expect(store.getActiveAccounts('corp-1')[0]?.uuid).toBe('c1-a1')
    })
  })

  // ── getAccountById getter ─────────────────────────────────────────────────

  describe('getAccountById', () => {
    it('finds an account by its UUID', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeDTO({ ID: 'target-uuid', Name: '50000.000. Sales Revenue' }),
      ]))
      const store = useChartOfAccountsStore()
      await store.fetchAccounts(CORP_UUID)

      const account = store.getAccountById('target-uuid')
      expect(account?.account_name).toBe('50000.000. Sales Revenue')
    })

    it('returns undefined for an unknown UUID', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO()]))
      const store = useChartOfAccountsStore()
      await store.fetchAccounts(CORP_UUID)

      expect(store.getAccountById('does-not-exist')).toBeUndefined()
    })

    it('returns undefined when no accounts are loaded', () => {
      const store = useChartOfAccountsStore()
      expect(store.getAccountById('any-uuid')).toBeUndefined()
    })
  })

  // ── getAccountLabel getter ────────────────────────────────────────────────

  describe('getAccountLabel', () => {
    it('returns "code – name" for a known UUID', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([
        makeDTO({ ID: 'lbl-uuid', Number: '10050.000', Name: '10050.000. Operating Account' }),
      ]))
      const store = useChartOfAccountsStore()
      await store.fetchAccounts(CORP_UUID)

      expect(store.getAccountLabel('lbl-uuid')).toBe('10050.000 – 10050.000. Operating Account')
    })

    it('falls back to the raw UUID when not found', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useChartOfAccountsStore()
      await store.fetchAccounts(CORP_UUID)

      expect(store.getAccountLabel('unknown-uuid')).toBe('unknown-uuid')
    })

    it('returns the raw UUID when no data is loaded', () => {
      const store = useChartOfAccountsStore()
      expect(store.getAccountLabel('raw-id')).toBe('raw-id')
    })
  })

  // ── refresh ───────────────────────────────────────────────────────────────

  describe('refresh', () => {
    it('forces a re-fetch even when corporation is already cached', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)
      await store.refresh(CORP_UUID)

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('does nothing when corporationUuid is undefined', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useChartOfAccountsStore()
      await store.fetchAccounts(CORP_UUID)

      await store.refresh(undefined)

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('updates the accounts after refresh', async () => {
      const store = useChartOfAccountsStore()

      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ ID: 'v1' })]))
      await store.fetchAccounts(CORP_UUID)

      mockFetch.mockResolvedValue(makeApiResponse([makeDTO({ ID: 'v2' })]))
      await store.refresh(CORP_UUID)

      expect(store.accounts[0]?.uuid).toBe('v2')
    })
  })

  // ── clear ─────────────────────────────────────────────────────────────────

  describe('clear', () => {
    it('resets all state to initial values', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO()]))
      const store = useChartOfAccountsStore()
      await store.fetchAccounts(CORP_UUID)

      expect(store.accounts).toHaveLength(1)

      store.clear()

      expect(store.accounts).toHaveLength(0)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('invalidates the cache so fetchAccounts runs again after clear', async () => {
      mockFetch.mockResolvedValue(makeApiResponse())
      const store = useChartOfAccountsStore()

      await store.fetchAccounts(CORP_UUID)
      store.clear()
      await store.fetchAccounts(CORP_UUID)

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    it('clears accounts for all corporations', async () => {
      mockFetch.mockResolvedValue(makeApiResponse([makeDTO()]))
      const store = useChartOfAccountsStore()

      await store.fetchAccounts('corp-1')
      await store.fetchAccounts('corp-2')

      expect(store.accounts).toHaveLength(2)

      store.clear()

      expect(store.accounts).toHaveLength(0)
    })
  })
})
