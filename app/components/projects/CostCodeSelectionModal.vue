<template>
  <UModal
    v-model:open="isOpen"
    fullscreen
    title="Select Cost Codes"
    description="Select cost codes to include in the estimate"
    :ui="{
      content: 'h-screen w-screen max-w-none rounded-none',
      body: 'flex-1 py-4 overflow-hidden'
    }"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-list-bullet" class="w-5 h-5 text-primary" />
          <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">Select Cost Codes</h3>
        </div>
        <div class="flex items-center gap-2">
          <UButton icon="i-heroicons-check-circle" color="primary" variant="soft" size="xs" @click="handleSelectAll">
            Select All
          </UButton>
          <UButton icon="i-heroicons-x-circle" color="error" variant="soft" size="xs" @click="handleDeselectAll">
            Deselect All
          </UButton>
        </div>
      </div>
    </template>

    <template #body>
      <div v-if="hierarchicalData.length === 0" class="text-center text-muted py-8">
        <p class="text-sm">No cost codes available</p>
      </div>

      <div v-else class="flex h-[calc(100vh-170px)] min-h-[420px] flex-col gap-4 overflow-hidden sm:flex-row">
        <div class="w-full flex-shrink-0 overflow-hidden border-b border-gray-200 pb-2 dark:border-gray-700 sm:w-64 sm:max-w-[300px] sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
          <div class="left-aligned-vertical-tabs h-full overflow-y-auto">
            <UTabs
              orientation="vertical"
              variant="pill"
              :content="false"
              :items="divisionTabs"
              :model-value="activeDivisionTab"
              class="w-full"
              @update:model-value="(value) => activeDivisionTab = String(value)"
            />
          </div>
        </div>

        <div class="min-w-0 flex-1 overflow-y-auto pl-0 sm:pl-4">
          <div v-if="!activeDivision" class="flex items-center justify-center h-full text-center text-muted py-8">
            <p class="text-sm">Select a division to view cost codes</p>
          </div>
          <div v-else class="py-4">
            <div class="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 font-semibold text-sm text-gray-900 dark:text-gray-100 sticky top-0 z-10 mb-2 rounded-lg">
              <div class="flex items-center gap-2">
                <UCheckbox
                  :model-value="isDivisionFullySelected(activeDivision)"
                  :indeterminate="isDivisionPartiallySelected(activeDivision)"
                  @update:model-value="(value) => handleDivisionToggle(activeDivision, !!value)"
                />
                <span>{{ getDivisionDisplayName(activeDivision) }}</span>
              </div>
            </div>

            <div class="divide-y divide-default/50">
              <div v-for="costCode in activeDivision.costCodes" :key="costCode.uuid" class="pl-4">
                <div class="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <UCheckbox
                    :model-value="isSelected(costCode.uuid)"
                    @update:model-value="(value) => handleToggle(costCode.uuid, !!value)"
                  />
                  <div class="flex-1 flex items-center gap-2 min-w-0">
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {{ costCode.cost_code_number }} {{ costCode.cost_code_name }}
                    </span>
                  </div>
                </div>

                <div v-if="costCode.subCostCodes && costCode.subCostCodes.length > 0" class="pl-6">
                  <div v-for="subCostCode in costCode.subCostCodes" :key="subCostCode.uuid" class="pl-2">
                    <div class="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <UCheckbox
                        :model-value="isSelected(subCostCode.uuid)"
                        @update:model-value="(value) => handleToggle(subCostCode.uuid, !!value)"
                      />
                      <div class="flex-1 flex items-center gap-2 min-w-0">
                        <span class="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {{ subCostCode.cost_code_number }} {{ subCostCode.cost_code_name }}
                        </span>
                      </div>
                    </div>

                    <div v-if="subCostCode.subSubCostCodes && subCostCode.subSubCostCodes.length > 0" class="pl-6">
                      <div v-for="subSubCostCode in subCostCode.subSubCostCodes" :key="subSubCostCode.uuid" class="pl-2">
                        <div class="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <UCheckbox
                            :model-value="isSelected(subSubCostCode.uuid)"
                            @update:model-value="(value) => handleToggle(subSubCostCode.uuid, !!value)"
                          />
                          <div class="flex-1 flex items-center gap-2 min-w-0">
                            <span class="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {{ subSubCostCode.cost_code_number }} {{ subSubCostCode.cost_code_name }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <UButton color="neutral" variant="ghost" @click="handleCancel">Cancel</UButton>
        <UButton color="primary" @click="handleConfirm">Apply Selection</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface CostCode {
  uuid: string
  cost_code_number: string
  cost_code_name: string
  subCostCodes?: SubCostCode[]
}
interface SubCostCode {
  uuid: string
  cost_code_number: string
  cost_code_name: string
  subSubCostCodes?: SubSubCostCode[]
}
interface SubSubCostCode {
  uuid: string
  cost_code_number: string
  cost_code_name: string
}
interface Division {
  uuid: string
  division_number: string
  division_name: string
  costCodes: CostCode[]
  excluded_division_numbers?: string[]
}

interface Props {
  open?: boolean
  hierarchicalData?: Division[]
  removedCostCodeUuids?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  hierarchicalData: () => [],
  removedCostCodeUuids: () => [],
})
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm', removedUuids: string[]): void
  (e: 'cancel'): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})
const localRemovedUuids = ref<Set<string>>(new Set())
const activeDivisionTab = ref<string>('')

const divisionTabs = computed(() =>
  props.hierarchicalData.map((division, index) => {
    const tabValue = division.uuid || `division-${index}`
    const label = division.division_number === 'OTHER' && division.division_name === 'OTHER COSTS'
      ? 'OTHER COSTS'
      : `${division.division_number} ${division.division_name}`
    return { label, value: tabValue }
  }),
)

const activeDivision = computed(() => {
  if (!activeDivisionTab.value) return null
  return props.hierarchicalData.find(
    (d, i) => (d.uuid || `division-${i}`) === activeDivisionTab.value,
  ) || null
})

const getDivisionDisplayName = (d: Division | null) => {
  if (!d) return ''
  return d.division_number === 'OTHER' && d.division_name === 'OTHER COSTS' ? d.division_name : `${d.division_number} ${d.division_name}`
}

watch([() => props.open, () => props.hierarchicalData], ([isOpenValue, data]) => {
  if (isOpenValue && (data as Division[]).length > 0) {
    const first = (data as Division[])[0]
    const firstTab = first?.uuid || 'division-0'
    if (!activeDivisionTab.value || !(data as Division[]).find((d, i) => (d.uuid || `division-${i}`) === activeDivisionTab.value)) {
      activeDivisionTab.value = firstTab
    }
  }
}, { immediate: true })

watch(() => props.removedCostCodeUuids, (v) => { localRemovedUuids.value = new Set(v || []) }, { immediate: true })
watch(() => props.open, (v) => { if (v) localRemovedUuids.value = new Set(props.removedCostCodeUuids || []) })

function getAllCostCodeUuids(): string[] {
  const uuids: string[] = []
  props.hierarchicalData.forEach(d => {
    d.costCodes.forEach(c => {
      uuids.push(c.uuid)
      c.subCostCodes?.forEach(s => {
        uuids.push(s.uuid)
        s.subSubCostCodes?.forEach(ss => uuids.push(ss.uuid))
      })
    })
  })
  return uuids
}

function getAllDivisionCostCodeUuids(d: Division): string[] {
  const uuids: string[] = []
  d.costCodes.forEach(c => {
    uuids.push(c.uuid)
    c.subCostCodes?.forEach(s => {
      uuids.push(s.uuid)
      s.subSubCostCodes?.forEach(ss => uuids.push(ss.uuid))
    })
  })
  return uuids
}

const isSelected = (uuid: string) => !localRemovedUuids.value.has(uuid)
const isDivisionFullySelected = (d: Division) => { const all = getAllDivisionCostCodeUuids(d); return all.length > 0 && all.every(u => !localRemovedUuids.value.has(u)) }
const isDivisionPartiallySelected = (d: Division) => { const all = getAllDivisionCostCodeUuids(d); if (!all.length) return false; const cnt = all.filter(u => !localRemovedUuids.value.has(u)).length; return cnt > 0 && cnt < all.length }

function handleToggle(uuid: string, selected: boolean | string | undefined) {
  const s = typeof selected === 'boolean' ? selected : Boolean(selected)
  if (s) localRemovedUuids.value.delete(uuid)
  else localRemovedUuids.value.add(uuid)
}

function handleDivisionToggle(d: Division, selected: boolean | string | undefined) {
  const s = typeof selected === 'boolean' ? selected : Boolean(selected)
  const all = getAllDivisionCostCodeUuids(d)
  if (s) all.forEach(u => localRemovedUuids.value.delete(u))
  else all.forEach(u => localRemovedUuids.value.add(u))
}

function handleSelectAll() { localRemovedUuids.value.clear() }
function handleDeselectAll() { getAllCostCodeUuids().forEach(u => localRemovedUuids.value.add(u)) }
function handleConfirm() { emit('confirm', Array.from(localRemovedUuids.value)); isOpen.value = false }
function handleCancel() { emit('cancel'); isOpen.value = false }
</script>

<style scoped>
.left-aligned-vertical-tabs :deep(button) {
  justify-content: flex-start !important;
  text-align: left !important;
  width: 100% !important;
  min-height: 36px !important;
  padding: 6px 8px !important;
  margin-bottom: 2px !important;
}
.left-aligned-vertical-tabs :deep(button span) {
  text-align: left !important;
  justify-content: flex-start !important;
  width: 100% !important;
  display: block !important;
  font-size: 0.8rem !important;
  line-height: 1.2 !important;
  white-space: normal !important;
  word-wrap: break-word !important;
}
</style>
