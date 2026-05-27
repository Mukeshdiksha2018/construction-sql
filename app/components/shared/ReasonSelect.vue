<template>
  <div class="min-w-0">
    <div v-if="hasLabelRow" class="flex items-center justify-between gap-2 mb-1 min-w-0">
      <label :class="mergedLabelClass">{{ label }}</label>
      <UBadge
        v-if="showAddButton && canCreateReason"
        color="primary"
        variant="solid"
        size="xs"
        class="cursor-pointer hover:opacity-80 transition-opacity shrink-0"
        :class="{ 'opacity-50 pointer-events-none': disabled || store.loading }"
        title="Add new reason"
        @click="handleAddBadgeClick"
      >
        <UIcon name="i-heroicons-plus" class="w-3 h-3" />
        Add
      </UBadge>
    </div>

    <div class="flex items-center gap-1 min-w-0" :class="wrapperClass">
      <USelectMenu
        :model-value="selectedOption"
        :items="options"
        :loading="store.loading"
        :disabled="disabled || store.loading"
        :placeholder="placeholder"
        :size="size"
        :class="selectMenuClass"
        value-attribute="value"
        option-attribute="label"
        searchable
        :searchable-placeholder="searchablePlaceholder"
        @update:model-value="handleSelection"
      />
      <UBadge
        v-if="!hasLabelRow && showAddButton && canCreateReason"
        color="primary"
        variant="solid"
        size="xs"
        class="cursor-pointer hover:opacity-80 transition-opacity shrink-0 self-stretch min-h-[2rem] inline-flex items-center"
        :class="{ 'opacity-50 pointer-events-none': disabled || store.loading }"
        title="Add new reason"
        @click="handleAddBadgeClick"
      >
        <UIcon name="i-heroicons-plus" class="w-3 h-3" />
        Add
      </UBadge>
    </div>

    <UModal v-model:open="showAddModal">
      <template #header>
        <div class="flex items-center justify-between w-full gap-2">
          <div>
            <h3 class="text-base font-semibold text-default">Add New Reason</h3>
            <p class="text-xs text-muted mt-0.5">Saved to master reasons and selected here.</p>
          </div>
          <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="closeAddModal" />
        </div>
      </template>
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-default mb-2">Reason <span class="text-red-500">*</span></label>
            <UTextarea v-model="addForm.reason" variant="subtle" placeholder="Enter reason" size="md" :rows="5" class="w-full" />
          </div>
          <div>
            <label class="flex items-center gap-2 cursor-pointer">
              <UCheckbox v-model="addForm.active" />
              <span class="text-sm font-medium text-default">Active</span>
            </label>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="outline" @click="closeAddModal">Cancel</UButton>
          <UButton color="primary" :loading="savingAdd" :disabled="!isAddFormValid" @click="saveNewReason">
            Save &amp; select
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useReasonsStore } from '~/stores/reasons'
import { usePermissions } from '~/composables/usePermissions'

interface Props {
  modelValue?: string
  label?: string
  labelClass?: string
  placeholder?: string
  searchablePlaceholder?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  selectClass?: string
  disabled?: boolean
  showAddButton?: boolean
  wrapperClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  labelClass: '',
  placeholder: 'Select reason',
  searchablePlaceholder: 'Search reasons...',
  size: 'sm',
  className: '',
  selectClass: '',
  disabled: false,
  showAddButton: true,
  wrapperClass: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
  change: [reason: any]
}>()

const store = useReasonsStore()
const toast = useToast()
const { hasPermission } = usePermissions()

const selectedValue = ref<string | undefined>(props.modelValue)
const selectedOption = ref<any>(undefined)

const selectMenuClass = computed(() => {
  const fromProps = [props.selectClass, props.className].filter(Boolean).join(' ')
  if (hasLabelRow.value) return ['w-full min-w-0', fromProps].filter(Boolean).join(' ')
  return ['min-w-0 flex-1', fromProps].filter(Boolean).join(' ')
})

const canCreateReason = computed(() => hasPermission('reasons_create'))
const hasLabelRow = computed(() => Boolean(props.label && String(props.label).trim()))
const mergedLabelClass = computed(() => {
  const base = 'text-xs font-medium text-default min-w-0 flex-1 truncate pr-1'
  return props.labelClass ? `${base} ${props.labelClass}` : base
})

const showAddModal = ref(false)
const savingAdd = ref(false)
const addForm = ref({ reason: '', active: true })
const isAddFormValid = computed(() => addForm.value.reason.trim() !== '')

const options = computed(() => {
  const active = store.getActive || []
  return active.map(r => ({ label: r.reason, value: r.uuid, reason: r }))
})

const optionsMap = computed(() => new Map(options.value.map(o => [o.value, o])))

const updateSelected = () => {
  if (!selectedValue.value) { selectedOption.value = undefined; return }
  const val = selectedValue.value
  selectedOption.value =
    optionsMap.value.get(val) ||
    options.value.find(o =>
      String(o.value).toLowerCase() === String(val).toLowerCase() ||
      String(o.label).toLowerCase() === String(val).toLowerCase()
    ) || undefined
}

const handleSelection = (opt: any) => {
  if (opt) {
    selectedValue.value = opt.value
    emit('update:modelValue', opt.value)
    emit('change', opt)
  } else {
    selectedValue.value = undefined
    emit('update:modelValue', undefined)
  }
}

const handleAddBadgeClick = () => {
  if (props.disabled || store.loading) return
  if (!hasPermission('reasons_create')) {
    toast.add({ title: 'Access denied', description: "You don't have permission to add reasons.", color: 'error' })
    return
  }
  addForm.value = { reason: '', active: true }
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
  addForm.value = { reason: '', active: true }
}

const saveNewReason = async () => {
  if (!isAddFormValid.value) return
  savingAdd.value = true
  try {
    const created = await store.createReason({ reason: addForm.value.reason.trim(), active: addForm.value.active })
    if (!created?.uuid) {
      toast.add({ title: 'Error', description: 'Reason was not returned from the server.', color: 'error' })
      return
    }
    const opt = { label: created.reason, value: created.uuid, reason: created }
    handleSelection(opt)
    toast.add({ title: 'Reason added', description: 'The new reason is selected.', color: 'success' })
    closeAddModal()
  } catch (e: any) {
    toast.add({ title: 'Error', description: e?.message || 'Failed to save reason', color: 'error' })
  } finally {
    savingAdd.value = false
  }
}

watch(() => props.modelValue, v => { selectedValue.value = v; updateSelected() })
watch(options, () => updateSelected(), { immediate: true })
watch(selectedValue, () => updateSelected())

if (!store.getAll?.length) {
  store.fetchReasons().catch(() => {})
}
</script>
