<template>
  <div class="flex flex-col gap-3">
    <UCheckbox
      v-if="!hideEnableCheckbox"
      :model-value="enabled"
      label="Enable currency conversion"
      :disabled="readonly || prefillLoading || enableCheckboxDisabled"
      :loading="prefillLoading"
      @update:model-value="handleEnabledChange"
    />

    <div v-if="enabled" class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <USelectMenu
          v-if="!hideFromCurrencySelect"
          :model-value="fromCurrency"
          :items="currencyOptions"
          value-key="value"
          label-key="label"
          size="sm"
          class="w-full sm:w-36"
          :disabled="readonly"
          @update:model-value="handleFromCurrencyChange"
        >
          <template #leading>
            <PoCurrencyFlag :currency="fromCurrency" size="0.7em" />
          </template>
          <template #item="{ item }">
            <div class="flex items-center gap-2">
              <PoCurrencyFlag :currency="item.value" size="0.65em" />
              <span>{{ item.label }}</span>
            </div>
          </template>
        </USelectMenu>

        <div class="flex shrink-0 items-center gap-2">
          <span class="text-xs text-muted">×</span>
          <div
            class="shrink-0"
            :style="{
              width: `${PO_CONVERSION_RATE_INPUT_MIN_CHARS}ch`,
              minWidth: `${PO_CONVERSION_RATE_INPUT_MIN_CHARS}ch`,
            }"
          >
            <UInput
              :model-value="rateInput"
              type="text"
              inputmode="decimal"
              size="sm"
              class="po-conversion-rate-input w-full text-right font-mono tabular-nums"
              :disabled="readonly"
              @wheel.prevent
              @keydown="preventRateKeydown"
              @paste="preventRatePaste"
              @update:model-value="handleRateChange"
            />
          </div>
        </div>

        <span class="text-xs text-muted hidden sm:inline">→</span>

        <USelectMenu
          :model-value="toCurrency"
          :items="currencyOptions"
          value-key="value"
          label-key="label"
          size="sm"
          class="w-full sm:w-36"
          :disabled="readonly || lockToCurrency"
          @update:model-value="handleToCurrencyChange"
        >
          <template #leading>
            <PoCurrencyFlag :currency="toCurrency" size="0.7em" />
          </template>
          <template #item="{ item }">
            <div class="flex items-center gap-2">
              <PoCurrencyFlag :currency="item.value" size="0.65em" />
              <span>{{ item.label }}</span>
            </div>
          </template>
        </USelectMenu>

        <UButton
          v-if="!lockToCurrency"
          icon="i-heroicons-arrows-right-left"
          size="xs"
          variant="soft"
          color="neutral"
          class="shrink-0"
          :disabled="readonly"
          title="Swap currencies"
          @click="handleSwap"
        />

        <span class="text-xs text-muted sm:ml-1">
          {{ rateSummary }}
        </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import PoCurrencyFlag from '~/components/shared/PoCurrencyFlag.vue'
import { useRecentCorporationCurrencyConversion } from '~/composables/useRecentCorporationCurrencyConversion'
import {
  PO_CURRENCY_META,
  PO_CURRENCY_CONVERSION_DEFAULTS,
  PO_SUPPORTED_CURRENCIES,
  formatPoCurrencyRateSummary,
  formatPoConversionRateDisplay,
  getOtherPoCurrency,
  invertPoConversionRate,
  PO_CONVERSION_RATE_MAX_DECIMALS,
  PO_CONVERSION_RATE_INPUT_MIN_CHARS,
  roundPoConversionRate,
  sanitizePoConversionRateInput,
  type PoCurrencyCode,
} from '~/utils/poCurrencyConversion'

const props = withDefaults(
  defineProps<{
    enabled?: boolean
    fromCurrency?: PoCurrencyCode
    toCurrency?: PoCurrencyCode
    conversionRate?: number
    readonly?: boolean
    /** Corporation used to look up the most recent PO/CO conversion settings. */
    corporationUuid?: string | null
    /** When true, enabling conversion pre-fills from the latest corporation PO/CO. */
    prefillOnEnable?: boolean
    /** Hide the enable checkbox (e.g. PO form auto-enables when from currency is USD). */
    hideEnableCheckbox?: boolean
    /** Hide the from-currency select (shown elsewhere, e.g. next to vendor). */
    hideFromCurrencySelect?: boolean
    /** Disable the enable checkbox without hiding it. */
    enableCheckboxDisabled?: boolean
    /** Lock to-currency and hide swap (e.g. USD → CAD only). */
    lockToCurrency?: boolean
  }>(),
  {
    enabled: false,
    fromCurrency: 'CAD',
    toCurrency: 'USD',
    conversionRate: 1,
    readonly: false,
    corporationUuid: null,
    prefillOnEnable: false,
    hideEnableCheckbox: false,
    hideFromCurrencySelect: false,
    enableCheckboxDisabled: false,
    lockToCurrency: false,
  }
)

const emit = defineEmits<{
  (e: 'update:enabled', value: boolean): void
  (e: 'update:fromCurrency', value: PoCurrencyCode): void
  (e: 'update:toCurrency', value: PoCurrencyCode): void
  (e: 'update:conversionRate', value: number): void
}>()

const { fetchRecentForCorporation } = useRecentCorporationCurrencyConversion()
const prefillLoading = ref(false)

const currencyOptions = PO_SUPPORTED_CURRENCIES.map((code) => ({
  value: code,
  label: PO_CURRENCY_META[code].label,
}))

const rateSummary = computed(() =>
  formatPoCurrencyRateSummary(
    props.fromCurrency,
    props.toCurrency,
    props.conversionRate
  )
)

const rateInput = ref(formatPoConversionRateDisplay(props.conversionRate))

watch(
  () => props.conversionRate,
  (value) => {
    rateInput.value = formatPoConversionRateDisplay(value)
  }
)

function applyCurrencyDefaults(
  from: PoCurrencyCode,
  to: PoCurrencyCode,
  rate: number
) {
  emit('update:fromCurrency', from)
  emit('update:toCurrency', to)
  emit('update:conversionRate', rate)
  rateInput.value = formatPoConversionRateDisplay(rate)
}

async function handleEnabledChange(value: boolean | 'indeterminate') {
  const next = value === true
  if (!next) {
    emit('update:enabled', false)
    return
  }

  let from = PO_CURRENCY_CONVERSION_DEFAULTS.currency_from
  let to = PO_CURRENCY_CONVERSION_DEFAULTS.currency_to
  let rate = PO_CURRENCY_CONVERSION_DEFAULTS.conversion_rate

  const corp = String(props.corporationUuid ?? '').trim()
  if (props.prefillOnEnable && corp) {
    prefillLoading.value = true
    try {
      const recent = await fetchRecentForCorporation(corp)
      if (recent) {
        from = recent.currency_from
        to = recent.currency_to
        rate = recent.conversion_rate
      }
    } finally {
      prefillLoading.value = false
    }
  }

  applyCurrencyDefaults(from, to, rate)
  emit('update:enabled', true)
}

function normalizeCurrencyValue(value: unknown): PoCurrencyCode | null {
  if (value === 'CAD' || value === 'USD') return value
  if (value && typeof value === 'object' && 'value' in value) {
    const next = (value as { value?: unknown }).value
    if (next === 'CAD' || next === 'USD') return next
  }
  return null
}

function handleFromCurrencyChange(value: unknown) {
  const next = normalizeCurrencyValue(value) || props.fromCurrency
  if (next === props.toCurrency) {
    emit('update:toCurrency', getOtherPoCurrency(next))
  }
  emit('update:fromCurrency', next)
}

function handleToCurrencyChange(value: unknown) {
  const next = normalizeCurrencyValue(value) || props.toCurrency
  if (next === props.fromCurrency) {
    emit('update:fromCurrency', getOtherPoCurrency(next))
  }
  emit('update:toCurrency', next)
}

function preventRateKeydown(event: KeyboardEvent) {
  const key = event.key
  if (
    key === 'Backspace' ||
    key === 'Delete' ||
    key === 'Tab' ||
    key === 'Enter' ||
    key === 'Escape' ||
    key === 'ArrowLeft' ||
    key === 'ArrowRight' ||
    key === 'ArrowUp' ||
    key === 'ArrowDown' ||
    key === 'Home' ||
    key === 'End' ||
    (event.ctrlKey || event.metaKey)
  ) {
    return
  }

  const input = event.target as HTMLInputElement | null
  const current = input?.value ?? rateInput.value
  const selectionStart = input?.selectionStart ?? current.length
  const selectionEnd = input?.selectionEnd ?? current.length
  const next =
    current.slice(0, selectionStart) + key + current.slice(selectionEnd)

  if (/^\d$/.test(key)) {
    const dotIndex = next.indexOf('.')
    if (dotIndex >= 0) {
      const decimals = next.length - dotIndex - 1
      if (decimals > PO_CONVERSION_RATE_MAX_DECIMALS) {
        event.preventDefault()
      }
    }
    return
  }

  if (key === '.' && !current.includes('.')) return

  event.preventDefault()
}

function preventRatePaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text') ?? ''
  handleRateChange(sanitizePoConversionRateInput(text))
}

function handleRateChange(value: string | number | null | undefined) {
  const raw = sanitizePoConversionRateInput(String(value ?? ''))
  rateInput.value = raw
  if (!raw || raw === '.') return
  const parsed = parseFloat(raw)
  if (!Number.isFinite(parsed) || parsed < 0) return
  emit('update:conversionRate', roundPoConversionRate(parsed))
}

function handleSwap() {
  const nextFrom = props.toCurrency
  const nextTo = props.fromCurrency
  const nextRate = invertPoConversionRate(props.conversionRate)
  emit('update:fromCurrency', nextFrom)
  emit('update:toCurrency', nextTo)
  emit('update:conversionRate', nextRate)
  rateInput.value = formatPoConversionRateDisplay(nextRate)
}
</script>

<style scoped>
:deep(.po-conversion-rate-input input) {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0;
  overflow: visible;
  text-overflow: clip;
}
</style>
