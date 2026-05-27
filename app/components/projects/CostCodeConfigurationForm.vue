<template>
  <div class="h-[80vh] flex flex-col">
    <div class="flex-1 overflow-y-auto">
      <div class="flex flex-col gap-4 pb-4">
        <!-- Cost Code Configuration Card -->
        <UCard variant="soft">
          <h4 class="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
            <UIcon name="i-heroicons-cog-6-tooth-solid" class="w-5 h-5 text-primary-600 dark:text-primary-400" />
            Cost Code Configuration
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <!-- Division -->
            <div>
              <label class="block text-xs font-medium text-default mb-1">Division</label>
              <SharedDivisionSelect
                :model-value="internalForm.division_uuid ?? undefined"
                :corporation-uuid="corporationStore.selectedCorporationId ?? undefined"
                placeholder="Select Division"
                size="sm"
                class="w-full"
                :disabled="readonly"
                @update:model-value="(v) => internalForm.division_uuid = v ?? null"
              />
            </div>

            <!-- Cost Code Number -->
            <div>
              <label class="block text-xs font-medium text-default mb-1">Cost Code Number <span class="text-red-500">*</span></label>
              <UInput
                v-model="internalForm.cost_code_number"
                placeholder="e.g., 01 02 03.15"
                size="sm"
                class="w-full"
                :readonly="readonly"
                @keydown="numericDotSpace"
              />
            </div>

            <!-- Cost Code Name -->
            <div class="col-span-2">
              <label class="block text-xs font-medium text-default mb-1">Cost Code Name <span class="text-red-500">*</span></label>
              <UInput
                v-model="internalForm.cost_code_name"
                placeholder="Enter cost code name"
                size="sm"
                class="w-full"
                :readonly="readonly"
              />
            </div>

            <!-- Sub Category of (parent cost code) -->
            <div>
              <label class="block text-xs font-medium text-default mb-1">Sub Category of</label>
              <SharedParentCostCodeSelect
                :model-value="internalForm.parent_cost_code_uuid ?? undefined"
                :corporation-uuid="corporationStore.selectedCorporationId ?? undefined"
                :exclude-uuid="props.editingUuid"
                placeholder="Search cost codes..."
                size="sm"
                class="w-full"
                :disabled="readonly"
                @update:model-value="(v) => internalForm.parent_cost_code_uuid = v ?? null"
              />
            </div>

            <!-- Order -->
            <div>
              <label class="block text-xs font-medium text-default mb-1">Order</label>
              <SharedOrderSelect
                :model-value="internalForm.order_number ?? undefined"
                placeholder="Select"
                size="sm"
                :disabled="readonly"
                @change="(v) => internalForm.order_number = v"
              />
            </div>

            <!-- GL Account (optional) -->
            <div class="col-span-2">
              <label class="block text-xs font-medium text-default mb-1">GL Account</label>
              <UInput
                v-model="internalForm.gl_account_uuid"
                placeholder="GL Account UUID (optional)"
                size="sm"
                class="w-full"
                :readonly="readonly"
              />
            </div>

            <!-- Description -->
            <div class="col-span-4">
              <label class="block text-xs font-medium text-default mb-1">Description</label>
              <UTextarea
                v-model="internalForm.description"
                placeholder="Optional description"
                size="sm"
                class="w-full"
                :rows="3"
                :readonly="readonly"
              />
            </div>

            <!-- Status + Update previous transactions -->
            <div v-if="props.editingUuid && !readonly" class="flex items-center gap-6 col-span-4">
              <UCheckbox v-model="internalForm.is_active" label="Active" />
              <UCheckbox v-model="internalForm.update_previous_transactions" label="Update previous transactions" />
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import { useCorporationStore } from '~/stores/corporations'

interface FormData {
  division_uuid: string | null
  cost_code_number: string
  cost_code_name: string
  parent_cost_code_uuid: string | null
  order_number: number | null
  gl_account_uuid: string | null
  description: string | null
  is_active: boolean
  update_previous_transactions: boolean
}

interface Props {
  modelValue: FormData
  editingUuid?: string
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: FormData]
}>()

const corporationStore = useCorporationStore()

const internalForm = reactive<FormData>({ ...props.modelValue })

watch(() => props.modelValue, (val) => {
  Object.assign(internalForm, val)
}, { deep: true })

watch(internalForm, (val) => {
  emit('update:modelValue', { ...val })
}, { deep: true })

function numericDotSpace(event: KeyboardEvent) {
  if (!/[0-9.\s]/.test(event.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    event.preventDefault()
  }
}
</script>
