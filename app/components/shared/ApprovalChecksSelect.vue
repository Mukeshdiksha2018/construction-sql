<template>
  <div class="relative">
    <USelectMenu
      v-model="selectedOptions"
      multiple
      :items="approvalCheckOptions"
      :loading="store.loading"
      :disabled="disabled || store.loading"
      :placeholder="placeholder"
      :size="size"
      :class="className"
      :ui="menuUi"
      value-attribute="value"
      option-attribute="label"
      searchable
      :searchable-placeholder="searchablePlaceholder"
      @update:model-value="handleSelection"
    >
      <template #default>
        <span
          v-if="selectedOptions.length === 0"
          class="flex-1 whitespace-normal text-left text-muted"
        >
          {{ placeholder }}
        </span>
        <span
          v-else
          class="flex-1 whitespace-normal text-left"
        >
          {{ selectedOptions[0].label }}
        </span>
      </template>
      <template #trailing="{ open }">
        <UIcon
          name="i-heroicons-chevron-down-20-solid"
          class="transition-transform duration-200 shrink-0"
          :class="{ 'rotate-180': open }"
        />
      </template>
    </USelectMenu>
    <UBadge
      v-if="selectedOptions.length > 1"
      color="primary"
      variant="solid"
      size="xs"
      class="absolute -top-2 -right-2 shrink-0 z-10 bg-[#2782EC]"
    >
      +{{ selectedOptions.length - 1 }}
    </UBadge>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useApprovalChecksStore } from '~/stores/approvalChecks'

interface Props {
  modelValue?: string[]
  placeholder?: string
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  ui?: any
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select approval checks',
  searchablePlaceholder: 'Search approval checks...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
})

interface ApprovalCheckOption {
  label: string
  value: string
  approvalCheck: any
}

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  'change': [approvalChecks: ApprovalCheckOption[]]
}>()

const store = useApprovalChecksStore()

const selectedOptions = ref<ApprovalCheckOption[]>([])

const defaultUi = {
  trigger: 'flex w-full justify-between gap-2 text-left',
  content: 'max-h-60 min-w-full w-max',
}

const menuUi = computed(() => ({
  ...defaultUi,
  ...(props.ui ?? {}),
}))

const approvalCheckOptions = computed<ApprovalCheckOption[]>(() => {
  const active = store.getActiveApprovalChecks || []
  return active.map(ac => ({
    label: ac.approval_check,
    value: ac.uuid,
    approvalCheck: ac,
  }))
})

const optionsByValue = computed(() => {
  const map = new Map<string, ApprovalCheckOption>()
  approvalCheckOptions.value.forEach(opt => map.set(opt.value, opt))
  return map
})

const handleSelection = (options: ApprovalCheckOption[]) => {
  selectedOptions.value = options || []
  const values = selectedOptions.value.map(opt => opt.value)
  emit('update:modelValue', values)
  emit('change', selectedOptions.value)
}

const syncSelectedOptions = () => {
  if (!props.modelValue || props.modelValue.length === 0) {
    if (selectedOptions.value.length > 0) selectedOptions.value = []
    return
  }
  if (approvalCheckOptions.value.length === 0) return
  const mapped = props.modelValue
    .map(uuid => optionsByValue.value.get(uuid))
    .filter((opt): opt is ApprovalCheckOption => opt !== undefined)
  const needsUpdate =
    mapped.length !== selectedOptions.value.length ||
    mapped.some((opt, idx) => opt.value !== selectedOptions.value[idx]?.value)
  if (needsUpdate) selectedOptions.value = mapped
}

watch(() => props.modelValue, () => syncSelectedOptions(), { immediate: true, deep: true })
watch(approvalCheckOptions, () => syncSelectedOptions(), { immediate: true })

if (!store.getAllApprovalChecks?.length) {
  store.fetchApprovalChecks().catch(() => {})
}
</script>
