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

    <!-- Add Ship Via Modal -->
    <UModal v-model:open="showAddModal" :ui="{ wrapper: 'max-w-md', body: 'p-6' }">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-base font-semibold">Add Ship Via</h3>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="showAddModal = false" />
        </div>
      </template>
      <template #body>
        <form class="space-y-4" @submit.prevent>
          <div>
            <label class="block text-sm font-medium text-default mb-1">Ship Via Name <span class="text-red-500">*</span></label>
            <UInput v-model="addForm.ship_via" placeholder="Enter ship via name" size="sm" class="w-full" />
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
import { useShipViaStore } from '~/stores/freight'
import { useNimbleSessionStore } from '~/stores/nimbleSession'

declare function useToast(): { add: (opts: any) => void }

interface Props {
  modelValue?: string
  placeholder?: string
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  showAddButton?: boolean
  /** When true, load options from the API only (skip IndexedDB cache). Used for Nimble integration. */
  forceApiFetch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select ship via',
  searchablePlaceholder: 'Search ship via...',
  size: 'sm',
  className: 'w-full',
  disabled: false,
  showAddButton: false,
  forceApiFetch: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  'change': [shipVia: any]
}>()

const runtimeConfig = useRuntimeConfig()
const nimbleSession = useNimbleSessionStore()
const store = useShipViaStore()

const selectedValue = ref<string | undefined>(props.modelValue)
const selectedOption = ref<any>(undefined)
const showAddModal = ref(false)
const isCreating = ref(false)
const addForm = ref({
  ship_via: '',
  description: '',
})

const isAddFormValid = computed(() => !!addForm.value.ship_via.trim())

const options = computed(() => {
  const active = store.getActiveShipVia || []
  return active.map(s => ({
    label: s.ship_via,
    value: s.uuid,
    shipVia: s
  }))
})

const optionsMapByUuid = computed(() => new Map(options.value.map(o => [o.value, o])))

const updateSelected = () => {
  if (!selectedValue.value) {
    selectedOption.value = undefined
  } else {
    const val = String(selectedValue.value)
    selectedOption.value =
      optionsMapByUuid.value.get(val)
      || options.value.find(
          o =>
            String(o.shipVia?.uuid) === val
            || String(o.label).toLowerCase() === val.toLowerCase()
        )
      || undefined
  }
}

const handleSelection = (opt: any) => {
  if (opt) {
    const id = opt.value ?? opt?.shipVia?.uuid
    selectedValue.value = id
    emit('update:modelValue', id)
    emit('change', opt)
  } else {
    selectedValue.value = undefined
    emit('update:modelValue', undefined)
  }
}

function openAddModal() {
  if (props.disabled) return
  addForm.value = { ship_via: '', description: '' }
  showAddModal.value = true
}

async function saveAndSelect() {
  if (!isAddFormValid.value) return
  isCreating.value = true
  const toast = useToast()
  try {
    if (props.forceApiFetch && runtimeConfig.public.nimbleIntegrations && !nimbleSession.token) {
      toast.add({
        title: 'Nimble session required',
        description: 'Open the app from Nimble or sign in so Ship Via can be saved to Nimble.',
        color: 'warning',
        icon: 'i-heroicons-exclamation-triangle',
      })
      return
    }

    const payload = {
      ship_via: addForm.value.ship_via.trim(),
      description: addForm.value.description.trim() || null,
      active: true,
    }

    const result =
      props.forceApiFetch && runtimeConfig.public.nimbleIntegrations && nimbleSession.token
        ? await store.createShipViaViaNimble(payload)
        : await store.createShipVia(payload)
    if (result) {
      await store.fetchShipVia(props.forceApiFetch)
      const newUuid = result.uuid
      emit('update:modelValue', newUuid)
      emit('change', {
        label: result.ship_via,
        value: newUuid,
        shipVia: result
      })
      selectedValue.value = newUuid
      showAddModal.value = false
      toast.add({ title: 'Success', description: 'Ship via created and selected.', color: 'success', icon: 'i-heroicons-check-circle' })
    } else {
      toast.add({ title: 'Error', description: store.error ?? 'Failed to create ship via', color: 'error', icon: 'i-heroicons-x-circle' })
    }
  } catch (err: any) {
    toast.add({ title: 'Error', description: err.message || 'Failed to create ship via', color: 'error', icon: 'i-heroicons-x-circle' })
  } finally {
    isCreating.value = false
  }
}

watch(() => props.modelValue, (v) => {
  selectedValue.value = v
  updateSelected()
})

watch(options, () => updateSelected(), { immediate: true })
watch(selectedValue, () => updateSelected())

if (props.forceApiFetch) {
  store.fetchShipVia(true).catch(() => {})
} else if (!store.getAllShipVia?.length) {
  store.fetchShipVia().catch(() => {})
}

defineExpose({ openAddModal })
</script>
