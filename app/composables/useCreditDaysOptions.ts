import { ref } from 'vue'
import {
  STATIC_CREDIT_DAYS_OPTIONS as UTIL_STATIC_OPTIONS,
  type CreditDaysOption,
} from '~/utils/creditDaysResolve'

const STATIC_CREDIT_DAYS_OPTIONS: CreditDaysOption[] = [...UTIL_STATIC_OPTIONS]

const creditDaysOptions = ref<CreditDaysOption[]>([...STATIC_CREDIT_DAYS_OPTIONS])
let _fetchPromise: Promise<void> | null = null

export function useCreditDaysOptions() {
  async function refreshCreditDaysOptions() {
    if (_fetchPromise) return _fetchPromise

    _fetchPromise = (async () => {
      try {
        const response = await $fetch<{ data: CreditDaysOption[] }>('/api/credit-days', {
          credentials: 'include',
        })
        const items = Array.isArray(response?.data) ? response.data : []
        if (items.length > 0) {
          creditDaysOptions.value = items
          return
        }
      }
      catch {
        // Fall back to static list if Nimble API is unavailable
      }
      finally {
        _fetchPromise = null
      }
      creditDaysOptions.value = [...STATIC_CREDIT_DAYS_OPTIONS]
    })()

    return _fetchPromise
  }

  function resolveCreditDaysToDayCount(creditDays: string | null, creditDaysId?: string | null): number | null {
    if (!creditDays && !creditDaysId) return null

    // Try match by Nimble ID first
    if (creditDaysId) {
      const byId = creditDaysOptions.value.find(o => String(o.id || '').toLowerCase() === String(creditDaysId).toLowerCase())
      if (typeof byId?.days === 'number') return byId.days
    }

    // Try match by value
    if (creditDays) {
      const byValue = creditDaysOptions.value.find(o => String(o.value).toLowerCase() === String(creditDays).toLowerCase())
      if (typeof byValue?.days === 'number') return byValue.days

      // Try label match
      const byLabel = creditDaysOptions.value.find(o => String(o.label).toLowerCase() === String(creditDays).toLowerCase())
      if (typeof byLabel?.days === 'number') return byLabel.days

      // Extract number from string (e.g. "NET_30" → 30)
      const match = String(creditDays).match(/(\d+)/)
      if (match?.[1]) {
        const n = Number(match[1])
        if (Number.isFinite(n)) return n
      }
    }

    return null
  }

  return { creditDaysOptions, refreshCreditDaysOptions, resolveCreditDaysToDayCount }
}
