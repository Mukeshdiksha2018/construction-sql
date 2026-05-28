import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

/** Raw shape returned by Nimble Core API /v1/accounts */
export interface NimbleChartOfAccountDTO {
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

/** Normalised shape stored in state — field names match ChartOfAccountsSelect usage */
export interface ChartOfAccountItem {
  uuid: string
  /** Account code / number (e.g. "490202.000") */
  code: string
  account_name: string
  /** Human-readable type name (e.g. "Expense", "Asset") – may be null */
  account_type: string | null
  account_type_id: string
  account_type_order: number
  corporation_id: string
  parent_account_name: string | null
  parent_account_number: string | null
  is_active: boolean
}

/** Pre-formatted option shape used in the USelectMenu */
export interface ChartOfAccountOption {
  label: string
  value: string
  account_type: string
  account_type_color: AccountTypeColor
  searchText: string
}

type AccountTypeColor = 'error' | 'warning' | 'info' | 'success' | 'primary' | 'secondary' | 'neutral'

const ACCOUNT_TYPE_COLORS: Record<string, AccountTypeColor> = {
  Asset: 'success',
  Liability: 'error',
  Equity: 'primary',
  Revenue: 'info',
  Income: 'info',
  Expense: 'warning',
  'Cost of Goods Sold': 'warning',
}

function accountTypeColor(type: string | null | undefined): AccountTypeColor {
  return ACCOUNT_TYPE_COLORS[type ?? ''] ?? 'neutral'
}

function normalise(dto: NimbleChartOfAccountDTO): ChartOfAccountItem {
  return {
    uuid: dto.ID ?? '',
    code: dto.Number ?? '',
    account_name: dto.Name ?? '',
    account_type: dto.AccountTypeName ?? null,
    account_type_id: dto.AccountTypeID ?? '',
    account_type_order: dto.AccountTypeOrder ?? 0,
    corporation_id: dto.CorporationID ?? '',
    parent_account_name: dto.ParentAccountName ?? null,
    parent_account_number: dto.ParentAccountNumber ?? null,
    // Mirror the reference project: active when IsAllowAccount is not false AND IsAllow is not 0.
    // Falls back to AccountStatus check if those fields are absent.
    is_active: dto.IsAllowAccount !== false && dto.IsAllow !== 0,
  }
}

function toOption(a: ChartOfAccountItem): ChartOfAccountOption {
  const type = a.account_type ?? ''
  return {
    label: `${a.code} - ${a.account_name}`,
    value: a.uuid,
    account_type: type,
    account_type_color: accountTypeColor(type),
    searchText: `${a.code} ${a.account_name} ${type}`.toLowerCase(),
  }
}

export const useChartOfAccountsStore = defineStore('chartOfAccounts', () => {
  const accounts = ref<ChartOfAccountItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** Per-corporation cache set (lowercased UUIDs) */
  const fetchedCorps = ref<Set<string>>(new Set())

  // ── Getters ─────────────────────────────────────────────────────────────────

  /** Pre-formatted options for all loaded accounts (both active and inactive) */
  const accountOptions = computed<ChartOfAccountOption[]>(() =>
    accounts.value.map(toOption),
  )

  /** All active accounts for a given corporation */
  const getActiveAccounts = computed(() => (corporationUuid: string): ChartOfAccountItem[] => {
    const corp = corporationUuid.toLowerCase()
    return accounts.value.filter(
      a => a.corporation_id.toLowerCase() === corp && a.is_active,
    )
  })

  /** Look up a single account by its UUID */
  const getAccountById = computed(() => (uuid: string): ChartOfAccountItem | undefined =>
    accounts.value.find(a => a.uuid === uuid),
  )

  /** Returns a display label ("code – name") for a given UUID */
  const getAccountLabel = computed(() => (uuid: string): string => {
    const a = accounts.value.find(acc => acc.uuid === uuid)
    return a ? `${a.code} – ${a.account_name}` : uuid
  })

  // ── Actions ──────────────────────────────────────────────────────────────────

  async function fetchAccounts(corporationUuid?: string, forceRefresh = false) {
    if (import.meta.server) return
    if (!corporationUuid) return

    const corp = corporationUuid.toLowerCase()
    if (!forceRefresh && fetchedCorps.value.has(corp)) return

    loading.value = true
    error.value = null

    try {
      const data = await $fetch<{ accounts: NimbleChartOfAccountDTO[] }>(
        '/api/nimble/chart-of-accounts',
        {
          query: { corporation_uuid: corporationUuid },
          credentials: 'include',
        },
      )

      // The Core API filters by CorpID but does NOT echo CorporationID back on each
      // account item. Inject it so the per-corporation filter in the component works.
      accounts.value = [
        ...accounts.value.filter(a => a.corporation_id.toLowerCase() !== corp),
        ...(data.accounts ?? []).map(dto => normalise({ ...dto, CorporationID: corporationUuid })),
      ]
      fetchedCorps.value.add(corp)
    }
    catch (err: unknown) {
      const e = err as Record<string, unknown>
      error.value
        = (e?.data as Record<string, unknown>)?.statusMessage as string
          || (e?.statusMessage as string)
          || (err as Error)?.message
          || 'Failed to fetch chart of accounts'
    }
    finally {
      loading.value = false
    }
  }

  async function refresh(corporationUuid?: string) {
    if (!corporationUuid) return
    fetchedCorps.value.delete(corporationUuid.toLowerCase())
    await fetchAccounts(corporationUuid, true)
  }

  function clear() {
    accounts.value = []
    fetchedCorps.value.clear()
    loading.value = false
    error.value = null
  }

  return {
    accounts,
    loading,
    error,
    accountOptions,
    getActiveAccounts,
    getAccountById,
    getAccountLabel,
    fetchAccounts,
    refresh,
    clear,
  }
})
