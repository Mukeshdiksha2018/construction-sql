import { computed } from 'vue'

export function useCurrencyFormat() {
  const corporationStore = useCorporationStore()
  const selectedCorporation = computed(() => corporationStore.selectedCorporation)
  const currencyCode = computed(() => 'USD')
  const currencySymbol = computed(() => '$')

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined || amount === '') return '$0.00'
    const value = typeof amount === 'string' ? Number.parseFloat(amount) : amount
    if (Number.isNaN(value)) return '$0.00'

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode.value,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)
    }
    catch {
      return `${currencySymbol.value}${value.toFixed(2)}`
    }
  }

  return {
    selectedCorporation,
    currencyCode,
    currencySymbol,
    formatCurrency,
  }
}
