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
              <SharedChartOfAccountsSelect
                :model-value="internalForm.gl_account_uuid ?? undefined"
                :corporation-uuid="corporationStore.selectedCorporationId ?? undefined"
                placeholder="Select GL Account (optional)"
                size="sm"
                class-name="w-full"
                :disabled="readonly"
                @update:model-value="(v) => internalForm.gl_account_uuid = v ?? null"
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

        <!-- Preferred items (existing cost code only) -->
        <UCard v-if="props.editingUuid" variant="soft">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-base font-bold text-default flex items-center gap-2">
              <UIcon name="i-heroicons-cube-solid" class="w-5 h-5 text-primary-600" />
              Preferred Items
            </h4>
            <UButton
              v-if="!readonly"
              icon="i-heroicons-plus"
              size="xs"
              color="primary"
              @click="openPreferredItemsModal"
            >
              Add / Manage Items
            </UButton>
          </div>
          <p v-if="preferredItemsLoading" class="text-xs text-muted">Loading items…</p>
          <p v-else-if="!preferredItemsForConfig.length" class="text-xs text-muted">
            No preferred items yet. Use “Add / Manage Items” to attach items to this cost code.
          </p>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-default text-left text-muted">
                  <th class="py-2 pr-2">Item Name</th>
                  <th class="py-2 pr-2">Spec</th>
                  <th class="py-2 pr-2">Project</th>
                  <th class="py-2 pr-2">Unit Cost</th>
                  <th class="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in preferredItemsForConfig"
                  :key="item.uuid"
                  class="border-b border-default/50"
                >
                  <td class="py-2 pr-2">{{ item.item_name || '—' }}</td>
                  <td class="py-2 pr-2 font-mono">{{ item.item_sequence || '—' }}</td>
                  <td class="py-2 pr-2">{{ getProjectLabel(item.project_uuid) }}</td>
                  <td class="py-2 pr-2">{{ item.unit_price ?? '—' }}</td>
                  <td class="py-2">{{ item.status || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>
    </div>

    <SharedPreferredItemsAddEditModal
      v-if="props.editingUuid"
      v-model="showPreferredItemsModal"
      mode="embedded"
      :corporation-uuid="corporationStore.selectedCorporationId || ''"
      :cost-code-configuration-uuid="props.editingUuid"
      :cost-code-label="costCodeDisplayLabel"
      :allow-embedded-project-select="true"
      :lock-embedded-cost-code-selection="true"
      @saved="onPreferredItemsSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { useCorporationStore } from '~/stores/corporations'
import { useProjectsStore } from '~/stores/projects'

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
const projectsStore = useProjectsStore()

const internalForm = reactive<FormData>({ ...props.modelValue })
const showPreferredItemsModal = ref(false)
const preferredItemsForConfig = ref<any[]>([])
const preferredItemsLoading = ref(false)

const costCodeDisplayLabel = computed(() => {
  const num = internalForm.cost_code_number || ''
  const name = internalForm.cost_code_name || ''
  return [num, name].filter(Boolean).join(' — ') || 'Cost code'
})

const normalizeUuid = (value?: string | null) => String(value ?? '').trim().toLowerCase()

async function loadPreferredItemsForConfig() {
  const corpUuid = corporationStore.selectedCorporationId
  const configUuid = props.editingUuid
  if (!corpUuid || !configUuid) {
    preferredItemsForConfig.value = []
    return
  }
  preferredItemsLoading.value = true
  try {
    const { data } = await $fetch<{ data: any[] }>('/api/preferred-items', {
      query: { corporation_uuid: corpUuid },
      credentials: 'include',
    })
    const key = normalizeUuid(configUuid)
    preferredItemsForConfig.value = (data ?? []).filter(
      item => normalizeUuid(item.cost_code_configuration_uuid) === key,
    )
  }
  catch {
    preferredItemsForConfig.value = []
  }
  finally {
    preferredItemsLoading.value = false
  }
}

function getProjectLabel(projectUuid?: string | null) {
  if (!projectUuid) return '—'
  const project = projectsStore.projects.find(
    p => normalizeUuid(p.uuid) === normalizeUuid(projectUuid),
  )
  return project ? `${project.project_name}` : projectUuid
}

function openPreferredItemsModal() {
  if (!props.editingUuid) return
  showPreferredItemsModal.value = true
}

async function onPreferredItemsSaved() {
  await loadPreferredItemsForConfig()
  showPreferredItemsModal.value = false
}

watch(() => props.modelValue, (val) => {
  Object.assign(internalForm, val)
}, { deep: true })

watch(internalForm, (val) => {
  emit('update:modelValue', { ...val })
}, { deep: true })

watch(
  () => [props.editingUuid, corporationStore.selectedCorporationId] as const,
  async ([editingUuid, corpUuid]) => {
    if (editingUuid && corpUuid) {
      if (!projectsStore.projects.length) {
        await projectsStore.fetchProjects(corpUuid).catch(() => {})
      }
      await loadPreferredItemsForConfig()
    }
    else {
      preferredItemsForConfig.value = []
    }
  },
  { immediate: true },
)

onMounted(async () => {
  const corpUuid = corporationStore.selectedCorporationId
  if (corpUuid && props.editingUuid && !projectsStore.projects.length) {
    await projectsStore.fetchProjects(corpUuid).catch(() => {})
  }
})

function numericDotSpace(event: KeyboardEvent) {
  if (!/[0-9.\s]/.test(event.key) && !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    event.preventDefault()
  }
}
</script>
