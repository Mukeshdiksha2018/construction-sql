import { ref } from 'vue'

export interface CreditDaysOption {
  id?: string | null
  label: string
  value: string
  days?: number | null
}

const STATIC_CREDIT_DAYS_OPTIONS: CreditDaysOption[] = [
  { label: 'Net 15 - 15 days', value: 'NET_15', days: 15 },
  { label: 'Net 30 - 30 days', value: 'NET_30', days: 30 },
  { label: 'Net 45 - 45 days', value: 'NET_45', days: 45 },
  { label: 'Net 60 - 60 days', value: 'NET_60', days: 60 },
  { label: 'Net 90 - 90 days', value: 'NET_90', days: 90 },
]

const creditDaysOptions = ref<CreditDaysOption[]>([...STATIC_CREDIT_DAYS_OPTIONS])
let _fetchPromise: Promise<void> | null = null

export function useCreditDaysOptions() {
  async function refreshCreditDaysOptions() {
    if (_fetchPromise) return _fetchPromise

    _fetchPromise = (async () => {
      try {
        const response = await $fetch<{ data: CreditDaysOption[] }>('/api/credit-days')
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
