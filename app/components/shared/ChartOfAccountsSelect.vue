<template>
  <USelectMenu
    :model-value="selectedOption"
    :items="options"
    :loading="store.loading"
    :disabled="disabled || store.loading"
    :placeholder="placeholder"
    :size="size"
    :class="className"
    value-key="value"
    label-key="label"
    searchable
    :searchable-placeholder="searchablePlaceholder"
    @update:model-value="handleSelection"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useChartOfAccountsStore } from '~/stores/chartOfAccounts'

interface Props {
  modelValue?: string
  placeholder?: string
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  corporationUuid?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select account...',
  searchablePlaceholder: 'Search accounts...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [account: any]
}>()

const store = useChartOfAccountsStore()
const selectedValue = ref<string | undefined>(props.modelValue)
const selectedOption = ref<any>(undefined)

const options = computed(() =>
  store.accounts.map((a: any) => ({
    label: a.account_name || a.name,
    value: a.uuid,
    account: a,
    searchText: `${a.account_name || ''} ${a.account_number || ''}`.toLowerCase(),
  }))
)

const optionsMap = computed(() => new Map(options.value.map(o => [o.value, o])))

const updateSelected = () => {
  selectedOption.value = selectedValue.value ? optionsMap.value.get(selectedValue.value) || undefined : undefined
}

const handleSelection = (val: any) => {
  if (val) {
    const value = typeof val === 'string' ? val : val.value
    selectedValue.value = value
    emit('update:modelValue', value)
    emit('change', optionsMap.value.get(value) || val)
  } else {
    selectedValue.value = undefined
    selectedOption.value = undefined
    emit('update:modelValue', undefined)
  }
}

watch(() => props.modelValue, v => { selectedValue.value = v; updateSelected() })
watch(options, () => updateSelected(), { immediate: true })
watch(() => props.corporationUuid, v => {
  if (v) store.fetchAccounts(v).catch(() => {})
}, { immediate: true })
</script>
