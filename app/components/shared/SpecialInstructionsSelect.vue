<template>
  <USelectMenu
    v-model="selectedObject"
    :items="options"
    :filter-fields="['label', 'description', 'searchText']"
    :placeholder="effectivePlaceholder"
    :searchable="searchable"
    :searchable-placeholder="searchablePlaceholder"
    :size="size"
    :class="className"
    :disabled="disabled || !canLoad"
    :loading="loading"
    value-key="value"
    label-key="label"
    @update:model-value="handleSelection"
  >
    <template #default>
      <span
        class="flex-1 whitespace-normal text-left"
        :class="{ 'text-muted': !selectedObject }"
      >
        {{ displayLabel }}
      </span>
    </template>
    <template #item-label="{ item }">
      <span class="truncate font-medium">{{ item.label }}</span>
    </template>
  </USelectMenu>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSpecialInstructionsStore, type SpecialInstruction } from '~/stores/specialInstructions'

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    corporationUuid?: string | null
    projectUuid?: string | null
    placeholder?: string
    searchable?: boolean
    searchablePlaceholder?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    className?: string
    disabled?: boolean
  }>(),
  {
    modelValue: null,
    corporationUuid: null,
    projectUuid: null,
    placeholder: 'Select special instruction...',
    searchable: true,
    searchablePlaceholder: 'Type to search...',
    size: 'sm',
    className: 'w-full',
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string | null | undefined]
  change: [row: SpecialInstruction | null]
}>()

const specialInstructionsStore = useSpecialInstructionsStore()

const selectedUuid = ref<string | null>(props.modelValue ? String(props.modelValue) : null)
const selectedObject = ref<{
  label: string
  value: string
  description?: string
  searchText: string
  raw: SpecialInstruction
} | undefined>(undefined)

const corp = computed(() => String(props.corporationUuid ?? '').trim())
const proj = computed(() => String(props.projectUuid ?? '').trim())

const canLoad = computed(() => Boolean(corp.value && proj.value))

const effectivePlaceholder = computed(() =>
  canLoad.value ? props.placeholder : 'Select corporation and project first',
)

const loading = computed(() => specialInstructionsStore.loading)

const activeRows = computed(() => {
  const rows = specialInstructionsStore.items || []
  return rows.filter((r) => r.isActive && String(r.uuid || '').trim())
})

const options = computed(() =>
  activeRows.value.map((r) => {
    const contentPreview = r.content
      ? r.content.replace(/<[^>]*>/g, '').substring(0, 60)
      : ''
    const sub = [r.project_name, r.project_id].filter(Boolean).join(' · ')
    return {
      label: r.name,
      value: String(r.uuid),
      description: sub
        ? `${sub}${contentPreview ? ' — ' + contentPreview : ''}`
        : contentPreview || undefined,
      searchText: `${r.name} ${contentPreview} ${sub}`.toLowerCase(),
      raw: r,
    }
  }),
)

const optionsMap = computed(() => new Map(options.value.map((o) => [o.value, o])))

function syncSelectedObject() {
  const id = selectedUuid.value
  if (!id) {
    selectedObject.value = undefined
    return
  }
  selectedObject.value = optionsMap.value.get(id) || undefined
}

const displayLabel = computed(() => selectedObject.value?.label || props.placeholder)

async function loadList() {
  if (!canLoad.value) {
    specialInstructionsStore.clearItems()
    return
  }
  await specialInstructionsStore.fetchList({
    corporation_uuid: corp.value,
    project_uuid: proj.value,
  })
}

watch(
  () => [corp.value, proj.value] as const,
  async () => {
    await loadList()
    const id = selectedUuid.value
    if (id && !optionsMap.value.has(id)) {
      selectedUuid.value = null
      emit('update:modelValue', null)
      emit('change', null)
    }
    syncSelectedObject()
  },
  { immediate: true },
)

watch(
  () => props.modelValue,
  (v) => {
    selectedUuid.value = v ? String(v) : null
    syncSelectedObject()
  },
)

watch(options, () => syncSelectedObject(), { immediate: true })

watch(selectedUuid, () => syncSelectedObject())

function handleSelection(item: any) {
  let uuidVal: string | null = null
  let raw: SpecialInstruction | null = null
  if (item) {
    if (typeof item === 'string') {
      uuidVal = item
      raw = activeRows.value.find((r) => String(r.uuid) === item) || null
    } else if (typeof item === 'object' && item.value) {
      uuidVal = String(item.value)
      raw = item.raw || activeRows.value.find((r) => String(r.uuid) === uuidVal) || null
    }
  }
  selectedUuid.value = uuidVal
  emit('update:modelValue', uuidVal)
  emit('change', raw)
}
</script>
