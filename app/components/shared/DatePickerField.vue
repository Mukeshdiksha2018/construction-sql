<template>
  <UInput
    ref="uInputRef"
    :model-value="inputText"
    :placeholder="placeholder"
    :disabled="disabled"
    :size="size"
    class="w-full"
    inputmode="numeric"
    maxlength="10"
    :color="hasInputError ? 'error' : undefined"
    @update:model-value="onInputUpdate"
    @focus="onInputFocus"
    @blur="commitInput"
    @keydown.enter.prevent="commitInput"
  >
    <template #trailing>
      <UPopover v-model:open="popoverOpen" :disabled="disabled">
        <UButton
          color="neutral"
          variant="link"
          icon="i-heroicons-calendar-days"
          :size="size"
          :disabled="disabled"
          :padded="false"
          aria-label="Open calendar"
          @click.stop
        />
        <template #content>
          <UCalendar
            v-model="calendarValue"
            class="p-2"
            :disabled="disabled"
            :min-value="minCalendar ?? undefined"
            :max-value="maxCalendar ?? undefined"
          />
        </template>
      </UPopover>
    </template>
  </UInput>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { CalendarDate } from '@internationalized/date'
import { useFormDateField } from '~/composables/useFormDateField'

interface Props {
  modelValue?: string | null
  minValue?: string | null
  maxValue?: string | null
  disabled?: boolean
  placeholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  rangeErrorTitle?: string
  rangeErrorDescription?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  minValue: null,
  maxValue: null,
  disabled: false,
  placeholder: 'MM/DD/YYYY',
  size: 'sm',
  rangeErrorTitle: 'Invalid date',
  rangeErrorDescription: 'The selected date is outside the allowed range.',
})

const emit = defineEmits<{ 'update:modelValue': [value: string | null] }>()

const {
  parseUtcToCalendarDate,
  calendarDateToUtc,
  formatUtcAsMmDdYyyy,
  parseMmDdYyyyToCalendarDate,
  sanitizeDateInputText,
  isCalendarDateOutOfRange,
} = useFormDateField()

const DATE_INPUT_MAX_LENGTH = 10
const ALLOWED_DATE_INPUT_KEYS = new Set([
  'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
])

const uInputRef = ref<ComponentPublicInstance | null>(null)
const popoverOpen = ref(false)
const inputText = ref('')
const hasInputError = ref(false)
const isFocused = ref(false)
let nativeInputEl: HTMLInputElement | null = null

const minCalendar = computed(() => parseUtcToCalendarDate(props.minValue))
const maxCalendar = computed(() => parseUtcToCalendarDate(props.maxValue))

const getNativeInput = (): HTMLInputElement | null => {
  const root = uInputRef.value?.$el as HTMLElement | undefined
  return root?.querySelector('input') ?? null
}

const unbindNativeInput = () => {
  if (!nativeInputEl) return
  nativeInputEl.removeEventListener('keydown', onDateInputKeydown)
  nativeInputEl.removeEventListener('paste', onDateInputPaste)
  nativeInputEl = null
}

const bindNativeInput = () => {
  const input = getNativeInput()
  if (!input || input === nativeInputEl) return
  unbindNativeInput()
  nativeInputEl = input
  nativeInputEl.addEventListener('keydown', onDateInputKeydown)
  nativeInputEl.addEventListener('paste', onDateInputPaste)
}

onMounted(async () => { await nextTick(); bindNativeInput() })
onBeforeUnmount(() => unbindNativeInput())

const syncInputFromModel = () => {
  if (!isFocused.value) {
    inputText.value = formatUtcAsMmDdYyyy(props.modelValue) || ''
    hasInputError.value = false
  }
}

watch(() => props.modelValue, syncInputFromModel, { immediate: true })

const showRangeError = () => {
  const toast = useToast()
  toast.add({ title: props.rangeErrorTitle, description: props.rangeErrorDescription, color: 'error', icon: 'i-heroicons-exclamation-triangle' })
}

const emitCalendarDate = (date: CalendarDate | null) => {
  if (!date) {
    emit('update:modelValue', null)
    inputText.value = ''
    hasInputError.value = false
    return
  }
  if (isCalendarDateOutOfRange(date, minCalendar.value, maxCalendar.value)) {
    showRangeError()
    syncInputFromModel()
    return
  }
  const utc = calendarDateToUtc(date)
  emit('update:modelValue', utc)
  inputText.value = formatUtcAsMmDdYyyy(utc) || ''
  hasInputError.value = false
}

const resolveCalendarDate = (): CalendarDate | null => {
  const fromInput = parseMmDdYyyyToCalendarDate(inputText.value.trim())
  if (fromInput) return fromInput
  return parseUtcToCalendarDate(props.modelValue)
}

const calendarValue = computed({
  get: () => resolveCalendarDate(),
  set: (value: CalendarDate | null) => {
    emitCalendarDate(value)
    if (value && !isCalendarDateOutOfRange(value, minCalendar.value, maxCalendar.value)) {
      popoverOpen.value = false
    }
  },
})

const normalizeInputText = (value: string) => sanitizeDateInputText(value).slice(0, DATE_INPUT_MAX_LENGTH)

const applyInputText = (value: string) => {
  const sanitized = normalizeInputText(value)
  inputText.value = sanitized
  const target = nativeInputEl ?? getNativeInput()
  if (target && target.value !== sanitized) target.value = sanitized
}

const onInputFocus = () => { isFocused.value = true; bindNativeInput() }
const onInputUpdate = (value: string) => applyInputText(value)

const onDateInputKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return
  if (ALLOWED_DATE_INPUT_KEYS.has(event.key)) return
  if (/^[0-9/]$/.test(event.key)) return
  event.preventDefault()
}

const onDateInputPaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const pasted = sanitizeDateInputText(event.clipboardData?.getData('text') ?? '')
  if (!pasted) return
  const input = event.target as HTMLInputElement | null
  if (!input) { applyInputText(inputText.value + pasted); return }
  const start = input.selectionStart ?? inputText.value.length
  const end = input.selectionEnd ?? inputText.value.length
  applyInputText(inputText.value.slice(0, start) + pasted + inputText.value.slice(end))
}

const commitInput = () => {
  isFocused.value = false
  const trimmed = inputText.value.trim()
  if (!trimmed) { emit('update:modelValue', null); hasInputError.value = false; return }
  const parsed = parseMmDdYyyyToCalendarDate(trimmed)
  if (!parsed) { hasInputError.value = true; return }
  emitCalendarDate(parsed)
}

defineExpose({ calendarValue, inputText, commitInput, hasInputError })
</script>
