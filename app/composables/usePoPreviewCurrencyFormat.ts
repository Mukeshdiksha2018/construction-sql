import { computed, type Ref } from 'vue'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import {
  convertPoCurrency,
  formatPoCurrency,
  formatPoCurrencyRateSummary,
  normalizePoCurrencyConversionFields,
  type PoCurrencyCode,
} from '~/utils/poCurrencyConversion'

export function usePoPreviewCurrencyFormat(
  detail: Ref<Record<string, unknown> | null | undefined>,
  printInToCurrency: Ref<boolean>,
) {
  const { formatCurrency } = useCurrencyFormat()

  const currencyFields = computed(() =>
    normalizePoCurrencyConversionFields(detail.value),
  )

  const currencyConversionEnabled = computed(
    () => currencyFields.value.currency_conversion_enabled,
  )

  const conversionRateSummary = computed(() => {
    const { currency_from, currency_to, conversion_rate } = currencyFields.value
    return formatPoCurrencyRateSummary(currency_from, currency_to, conversion_rate)
  })

  function formatOrderAmount(amount: number | string | null | undefined): string {
    const fields = currencyFields.value
    const numericAmount =
      typeof amount === 'string' ? parseFloat(amount) : Number(amount ?? 0)
    if (currencyConversionEnabled.value) {
      const displayAmount = printInToCurrency.value
        ? convertPoCurrency(numericAmount, fields.conversion_rate)
        : numericAmount
      const displayCurrency: PoCurrencyCode = printInToCurrency.value
        ? fields.currency_to
        : fields.currency_from
      return formatPoCurrency(displayAmount, displayCurrency)
    }
    return formatCurrency(amount ?? 0)
  }

  return {
    currencyFields,
    currencyConversionEnabled,
    conversionRateSummary,
    formatOrderAmount,
  }
}
