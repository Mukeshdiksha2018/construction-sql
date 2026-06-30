import { computed, ref, type Ref } from 'vue'
import type { PoCurrencyCode } from '~/utils/poCurrencyConversion'

type PreviewCurrencyExpose = {
  orderCurrencyConversionEnabled?: boolean | { value: boolean }
  orderCurrencyFrom?: PoCurrencyCode
  orderCurrencyTo?: PoCurrencyCode
  orderConversionRateSummary?: string | { value: string }
}

function unwrap<T>(value: T | { value: T } | undefined): T | undefined {
  if (value !== null && typeof value === 'object' && 'value' in (value as object)) {
    return (value as { value: T }).value
  }
  return value as T | undefined
}

export function usePrintPreviewCurrencyBar(
  previewRef: Ref<PreviewCurrencyExpose | null | undefined>,
) {
  const printInToCurrency = ref(false)

  const currencyBarFields = computed(() => {
    const preview = previewRef.value
    if (!preview) return null
    if (!unwrap(preview.orderCurrencyConversionEnabled)) return null
    const fromCurrency = preview.orderCurrencyFrom
    const toCurrency = preview.orderCurrencyTo
    const rateSummary = unwrap(preview.orderConversionRateSummary)
    if (!fromCurrency || !toCurrency || !rateSummary) return null
    return { fromCurrency, toCurrency, rateSummary }
  })

  return { printInToCurrency, currencyBarFields }
}
