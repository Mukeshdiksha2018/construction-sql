<template>
  <div>
    <USelectMenu
      :model-value="selectedOption"
      :items="options"
      :loading="store.loading"
      :disabled="disabled || store.loading"
      :placeholder="placeholder"
      :size="size"
      :class="className"
      value-attribute="value"
      option-attribute="label"
      searchable
      :searchable-placeholder="searchablePlaceholder"
      @update:model-value="handleSelection"
    />

    <UModal v-model:open="showAddModal" :ui="{ wrapper: 'max-w-md', body: 'p-6' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold">Add Freight</h3>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="showAddModal = false" />
        </div>
      </template>
      <template #body>
        <form class="space-y-4" @submit.prevent>
          <div>
            <label class="block text-sm font-medium text-default mb-1">Freight Name <span class="text-red-500">*</span></label>
            <UInput v-model="addForm.freight_name" placeholder="Enter freight name" size="sm" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-1">Description</label>
            <UInput v-model="addForm.description" placeholder="Enter description (optional)" size="sm" class="w-full" />
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
import { useFreightStore } from '~/stores/freight'

interface Props {
  modelValue?: string
  placeholder?: string
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  showAddButton?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select freight',
  searchablePlaceholder: 'Search freight...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
  showAddButton: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [freight: any]
}>()

const store = useFreightStore()
const toast = useToast()

const selectedValue = ref<string | undefined>(props.modelValue)
const selectedOption = ref<any>(undefined)
const showAddModal = ref(false)
const isCreating = ref(false)
const addForm = ref({ freight_name: '', description: '' })

const isAddFormValid = computed(() => !!addForm.value.freight_name.trim())

const options = computed(() => {
  const active = store.getActiveFreight || []
  return active.map(f => ({
    label: f.freight_name,
    value: f.uuid,
    freight: f,
  }))
})

const optionsMapByUuid = computed(() => new Map(options.value.map(o => [o.value, o])))

const updateSelected = () => {
  if (!selectedValue.value) { selectedOption.value = undefined; return }
  const val = String(selectedValue.value)
  selectedOption.value =
    optionsMapByUuid.value.get(val) ||
    options.value.find(o => String(o.freight?.uuid) === val || String(o.label).toLowerCase() === val.toLowerCase()) ||
    undefined
}

const handleSelection = (opt: any) => {
  if (opt) {
    const id = opt.value ?? opt?.freight?.uuid
    selectedValue.value = id
    emit('update:modelValue', id)
    emit('change', opt)
  } else {
    selectedValue.value = undefined
    emit('update:modelValue', undefined)
  }
}

async function saveAndSelect() {
  if (!isAddFormValid.value) return
  isCreating.value = true
  try {
    const result = await store.createFreight({
      freight_name: addForm.value.freight_name.trim(),
      description: addForm.value.description.trim() || null,
      active: true,
    })
    if (result) {
      await store.fetchFreight()
      const newUuid = result.uuid
      emit('update:modelValue', newUuid)
      emit('change', { label: result.freight_name, value: newUuid, freight: result })
      selectedValue.value = newUuid
      showAddModal.value = false
      toast.add({ title: 'Success', description: 'Freight created and selected.', color: 'success', icon: 'i-heroicons-check-circle' })
    }
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message || 'Failed to create freight', color: 'error', icon: 'i-heroicons-x-circle' })
  } finally {
    isCreating.value = false
  }
}

watch(() => props.modelValue, v => { selectedValue.value = v; updateSelected() })
watch(options, () => updateSelected(), { immediate: true })
watch(selectedValue, () => updateSelected())

if (!store.getAllFreight?.length) {
  store.fetchFreight().catch(() => {})
}

defineExpose({ openAddModal: () => { if (!props.disabled) { addForm.value = { freight_name: '', description: '' }; showAddModal.value = true } } })
</script>
