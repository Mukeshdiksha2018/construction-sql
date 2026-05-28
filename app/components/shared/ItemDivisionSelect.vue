<template>
  <div class="flex flex-col gap-1">
    <div v-if="showAddButton && label" class="flex items-center justify-between gap-2">
      <label v-if="label" class="block text-sm font-medium text-default">{{ label }}</label>
      <UBadge
        color="primary"
        variant="solid"
        size="xs"
        class="cursor-pointer hover:opacity-80 transition-opacity shrink-0"
        title="Add division"
        @click="openAddModal"
      >
        <UIcon name="i-heroicons-plus" class="w-3 h-3" />
        Add
      </UBadge>
    </div>
    <div v-else-if="label" class="block text-sm font-medium text-default mb-1">{{ label }}</div>
    <USelectMenu
      v-model="selectedObject"
      :items="divisionOptions"
      :filter-fields="['label', 'searchText']"
      :placeholder="selectPlaceholder"
      :searchable="searchable"
      :searchable-placeholder="searchablePlaceholder"
      :size="size"
      :class="className"
      :disabled="disabled || !corporationUuid"
      :loading="loading"
      :ui="menuUi"
      value-key="value"
      label-key="label"
      @update:model-value="handleSelection"
    >
      <template #item-label="{ item }">
        <div
          :class="item.value === '__ALL__' || item.isAllOption ? 'rounded-md -mx-1 px-2 py-1.5 bg-gray-100 dark:bg-gray-700 font-semibold text-highlighted' : ''"
          class="whitespace-normal break-words text-left"
        >
          {{ item.label }}
        </div>
      </template>
      <template #default>
        <span class="flex-1 whitespace-normal break-words text-left" :class="{ 'text-muted': !selectedObject }">
          <template v-if="selectedObject">{{ selectedObject.label }}</template>
          <template v-else>{{ selectPlaceholder }}</template>
        </span>
      </template>
    </USelectMenu>
    <UModal v-model:open="showAddModal" :ui="{ wrapper: 'max-w-lg', body: 'p-6' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold">Add Item Division</h3>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="showAddModal = false" />
        </div>
      </template>
      <template #body>
        <form class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-default mb-1">Corporation <span class="text-red-500">*</span></label>
            <CorporationSelect
              :model-value="addForm.corporation_uuid"
              placeholder="Select corporation"
              size="sm"
              class="w-full"
              @update:model-value="addForm.corporation_uuid = ($event ?? '')"
            />
          </div>
          <div>
            <ItemCategorySelect
              v-model="addForm.category"
              label="Item Category"
              placeholder="Select category"
              size="sm"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-1">Division Name <span class="text-red-500">*</span></label>
            <UInput v-model="addForm.division_name" placeholder="Enter division name" size="sm" class="w-full" />
          </div>
          <div>
            <UCheckbox v-model="addForm.is_active" label="Active" class="text-sm" />
          </div>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="solid" color="neutral" @click="showAddModal = false">Cancel</UButton>
          <UButton
            variant="solid"
            color="primary"
            :disabled="!isAddFormValid || isCreating"
            :loading="isCreating"
            @click="saveAndSelect"
          >
            Save &amp; Select
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useItemDivisionsStore } from '~/stores/itemDivisions'
import CorporationSelect from '~/components/shared/CorporationSelect.vue'
import ItemCategorySelect from '~/components/shared/ItemCategorySelect.vue'

interface Props {
  modelValue?: string
  corporationUuid?: string
  category?: string
  label?: string
  placeholder?: string
  searchable?: boolean
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  showAddButton?: boolean
  includeAllOption?: boolean
  allOptionLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  corporationUuid: '',
  category: '',
  placeholder: 'Select division...',
  searchable: true,
  searchablePlaceholder: 'Type to search...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
  showAddButton: true,
  includeAllOption: false,
  allOptionLabel: 'All',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [division: { value: string; label: string } | undefined]
}>()

const itemDivisionsStore = useItemDivisionsStore()
const selectedObject = ref<{ value: string; label: string } | undefined>(undefined)
const showAddModal = ref(false)
const isCreating = ref(false)
const addForm = ref({ corporation_uuid: '', category: '', division_name: '', is_active: true })

const selectPlaceholder = computed(() => !props.corporationUuid ? 'Select corporation first' : props.placeholder)

const divisionOptions = computed(() => {
  if (!props.corporationUuid) return []
  const list = itemDivisionsStore.getActiveItemDivisions(props.corporationUuid, props.category || undefined)
  const rows = list.map(d => ({ label: d.division_name, value: d.uuid, searchText: d.division_name.toLowerCase() }))
  if (props.includeAllOption) {
    return [{ label: props.allOptionLabel, value: '__ALL__', isAllOption: true, searchText: props.allOptionLabel.toLowerCase() }, ...rows]
  }
  return rows
})

const divisionOptionsMap = computed(() => new Map(divisionOptions.value.map(o => [o.value, o])))
const isAddFormValid = computed(() => !!addForm.value.corporation_uuid && !!addForm.value.category && !!String(addForm.value.division_name).trim())
const loading = computed(() => itemDivisionsStore.loading)
const menuUi = { content: 'max-h-60 min-w-full w-max', item: { base: 'whitespace-normal break-words', label: 'whitespace-normal break-words text-left' } }

function updateSelectedObject() {
  if (!props.modelValue) {
    selectedObject.value = props.includeAllOption ? divisionOptions.value.find(o => o.value === '__ALL__') ?? undefined : undefined
    return
  }
  selectedObject.value = divisionOptionsMap.value.get(props.modelValue) ?? undefined
}

function handleSelection(item: any) {
  if (!item) {
    selectedObject.value = props.includeAllOption ? divisionOptions.value.find(o => o.value === '__ALL__') ?? undefined : undefined
    emit('update:modelValue', undefined)
    emit('change', undefined)
    return
  }
  const value = typeof item === 'string' ? item : item.value
  if (value === '__ALL__' || item.isAllOption) {
    selectedObject.value = divisionOptions.value.find(o => o.value === '__ALL__') ?? undefined
    emit('update:modelValue', undefined)
    emit('change', undefined)
    return
  }
  const label = typeof item === 'object' ? item.label : divisionOptionsMap.value.get(value)?.label ?? value
  emit('update:modelValue', value)
  emit('change', { value, label })
}

function openAddModal() {
  if (props.disabled) return
  addForm.value = { corporation_uuid: props.corporationUuid || '', category: props.category || '', division_name: '', is_active: true }
  showAddModal.value = true
}

async function saveAndSelect() {
  if (!isAddFormValid.value) return
  isCreating.value = true
  const toast = useToast()
  try {
    const result = await itemDivisionsStore.createItemDivision({
      corporation_uuid: addForm.value.corporation_uuid,
      category: addForm.value.category,
      division_name: addForm.value.division_name.trim(),
      is_active: addForm.value.is_active,
    })
    if (result) {
      await itemDivisionsStore.fetchItemDivisions(addForm.value.corporation_uuid, true)
      emit('update:modelValue', result.uuid)
      emit('change', { value: result.uuid, label: result.division_name })
      selectedObject.value = { value: result.uuid, label: result.division_name }
      showAddModal.value = false
      toast.add({ title: 'Success', description: 'Division created and selected.', color: 'success', icon: 'i-heroicons-check-circle' })
    } else {
      toast.add({ title: 'Error', description: itemDivisionsStore.error ?? 'Failed to create division', color: 'error', icon: 'i-heroicons-x-circle' })
    }
  } finally {
    isCreating.value = false
  }
}

watch(() => props.modelValue, () => updateSelectedObject(), { immediate: true })
watch(() => divisionOptions.value, () => updateSelectedObject(), { deep: true })
watch(() => props.corporationUuid, (uuid) => {
  if (uuid && itemDivisionsStore.itemDivisions.length === 0) itemDivisionsStore.fetchItemDivisions(uuid)
}, { immediate: true })
</script>
