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

export function useCreditDaysOptions() {
  async function refreshCreditDaysOptions() {
    creditDaysOptions.value = [...STATIC_CREDIT_DAYS_OPTIONS]
  }

  function resolveCreditDaysToDayCount(creditDays: string | null, _creditDaysId?: string | null): number | null {
    if (!creditDays) return null
    const opt = creditDaysOptions.value.find(o => String(o.value).toLowerCase() === String(creditDays).toLowerCase())
    return opt?.days ?? null
  }

  return { creditDaysOptions, refreshCreditDaysOptions, resolveCreditDaysToDayCount }
}
