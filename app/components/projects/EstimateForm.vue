<template>
  <div class="w-full min-w-0 overflow-x-auto">
    <div ref="leftPanel" class="min-w-[800px] max-w-full pr-3">
      <div class="mb-3 flex flex-col gap-4">
        <!-- Row 1: Basic Estimate Information -->
        <div class="flex flex-col">
          <div class="mb-3">
            <UCard variant="soft">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <template v-if="isLoading">
                  <div v-for="i in 4" :key="i" class="min-w-0">
                    <USkeleton class="h-3 w-24 mb-1" />
                    <USkeleton class="h-9 w-full" />
                  </div>
                </template>

                <template v-else>
                  <!-- Corporation -->
                  <div class="min-w-0">
                    <label class="block text-xs font-medium text-default mb-1">Corporation</label>
                    <SharedCorporationSelect
                      :model-value="(props.editingEstimate ? corpStore.selectedCorporationId : estimateCreationStore.selectedCorporationUuid) ?? undefined"
                      placeholder="Select corporation"
                      size="sm"
                      class="w-full"
                      :disabled="isReadOnlyEstimate || editingEstimate"
                      @update:model-value="handleCorporationChange"
                    />
                  </div>

                  <!-- Estimate Number -->
                  <div class="min-w-0">
                    <label class="block text-xs font-medium text-default mb-1 flex items-center gap-1">
                      Estimate Number <span class="text-red-500">*</span>
                    </label>
                    <UInput :model-value="form.estimate_number" placeholder="Estimate Number" size="sm" class="w-full" disabled />
                  </div>

                  <!-- Project -->
                  <div class="min-w-0">
                    <label class="block text-xs font-medium text-default mb-1 flex items-center gap-1">
                      Project <span class="text-red-500">*</span>
                    </label>
                    <USelectMenu
                      :key="`project-select-${estimateCreationStore.selectedCorporationUuid || 'none'}-${projectOptions.length}`"
                      v-model="form.project_uuid"
                      :items="projectOptions"
                      :loading="isProjectSelectLoading"
                      placeholder="Select project"
                      size="sm"
                      class="w-full"
                      value-key="value"
                      label-key="label"
                      :disabled="isReadOnlyEstimate || isProjectSelectLoading"
                      @update:model-value="(value) => handleFormUpdate('project_uuid', value)"
                    />
                  </div>

                  <!-- Estimate Date -->
                  <div class="min-w-0">
                    <label class="block text-xs font-medium text-default mb-1 flex items-center gap-1">
                      Estimate Date <span class="text-red-500">*</span>
                    </label>
                    <UPopover v-model:open="estimateDatePopoverOpen" :disabled="isReadOnlyEstimate">
                      <UButton
                        color="neutral"
                        variant="outline"
                        icon="i-heroicons-calendar-days"
                        class="w-full justify-start"
                        size="sm"
                        :disabled="isReadOnlyEstimate"
                      >
                        {{ estimateDateDisplayText }}
                      </UButton>
                      <template #content>
                        <UCalendar
                          v-model="estimateDateValue"
                          class="p-2"
                          :disabled="isReadOnlyEstimate"
                          @update:model-value="estimateDatePopoverOpen = false"
                        />
                      </template>
                    </UPopover>
                  </div>
                </template>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Row 2: Line Items -->
        <div class="flex flex-col">
          <div class="mb-3 space-y-4">
            <UCard variant="soft">
              <template v-if="isLoading">
                <div class="flex items-center justify-between mb-3">
                  <USkeleton class="h-6 w-32" />
                </div>
                <div class="space-y-3">
                  <div class="border border-default rounded-md p-4">
                    <div v-for="i in 3" :key="i" class="grid grid-cols-6 gap-4 py-2 border-t border-default">
                      <USkeleton class="h-4 w-24" />
                      <USkeleton class="h-4 w-32" />
                      <USkeleton class="h-4 w-16" />
                      <USkeleton class="h-4 w-20" />
                      <USkeleton class="h-4 w-16" />
                      <USkeleton class="h-4 w-20" />
                    </div>
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <UIcon name="i-heroicons-list-bullet" class="w-5 h-5 text-primary" />
                    Line Items
                  </h4>
                  <UButton
                    v-if="!isReadOnlyEstimate && form.project_uuid"
                    icon="i-heroicons-adjustments-horizontal"
                    color="neutral"
                    variant="solid"
                    size="sm"
                    @click="openCostCodeSelectionModal"
                  >
                    Configure Cost Codes
                  </UButton>
                </div>

                <div v-if="form.project_uuid && !isCheckingExistingEstimate" class="overflow-x-auto">
                  <ProjectsEstimateLineItemsTable
                    :model-value="form.line_items"
                    :project-uuid="form.project_uuid"
                    :readonly="isReadOnlyEstimate"
                    :editing-estimate="editingEstimate"
                    :estimate-uuid="form.uuid"
                    v-model:deletedUuids="form.removed_cost_code_uuids"
                    @update:model-value="(value) => handleFormUpdate('line_items', value)"
                    @open-cost-code-selection="(costCode, division) => openCostCodeSelectionModal(costCode, division)"
                  />
                </div>
                <div v-else-if="isCheckingExistingEstimate" class="py-6 text-center">
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
                  <p class="text-sm text-muted">Checking for existing estimates...</p>
                </div>
                <div v-else class="py-6 text-sm text-muted">Select a project to configure line items.</div>
              </template>
            </UCard>
          </div>
        </div>
      </div>
    </div>

    <!-- Cost Code Selection Modal -->
    <ProjectsCostCodeSelectionModal
      :open="isCostCodeSelectionModalOpen"
      :hierarchical-data="hierarchicalDataForModal"
      :removed-cost-code-uuids="form.removed_cost_code_uuids || []"
      @update:open="isCostCodeSelectionModalOpen = $event"
      @confirm="handleCostCodeSelectionConfirm"
      @cancel="handleCostCodeSelectionCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'
import { useCorporationStore } from '~/stores/corporations'
import { useProjectsStore } from '~/stores/projects'
import { useEstimateCreationStore } from '~/stores/estimateCreation'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import { useApiClient } from '~/composables/useApiClient'
import { useCostCodeDivisionsStore } from '~/stores/costCodeDivisions'
import { useCostCodeConfigurationsStore } from '~/stores/costCodeConfigurations'

declare function useToast(): { add: (opts: any) => void }

interface Props {
  form: any
  editingEstimate: boolean
  readonly?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), { readonly: false, loading: false })
const emit = defineEmits<{
  'update:form': [value: any]
  'validation-change': [isValid: boolean]
}>()

const corpStore = useCorporationStore()
const projectsStore = useProjectsStore()
const estimateCreationStore = useEstimateCreationStore()
const divisionsStore = useCostCodeDivisionsStore()
const configurationsStore = useCostCodeConfigurationsStore()
const { apiFetch } = useApiClient()
const { formatCurrency } = useCurrencyFormat()

const isLoading = computed(() => props.loading)
const isProjectSelectLoading = computed(() => props.editingEstimate ? projectsStore.loading : estimateCreationStore.loading)
const leftPanel = ref<HTMLElement | null>(null)
const estimateDatePopoverOpen = ref(false)
const isCostCodeSelectionModalOpen = ref(false)
const hierarchicalDataForModal = ref<any[]>([])
const hasShownModalForProject = ref<Set<string>>(new Set())
const isCheckingExistingEstimate = ref(false)

function formatCurrencyInline(value: any) {
  const num = parseFloat(value)
  return formatCurrency(Number.isFinite(num) ? num : 0)
}

const isReadOnlyEstimate = computed(() => props.readonly)

const df = new DateFormatter('en-US', { dateStyle: 'medium' })

const estimateDateValue = computed({
  get: () => {
    if (!props.form.estimate_date) return null
    const d = new Date(props.form.estimate_date)
    return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
  },
  set: (value: CalendarDate | null) => {
    if (value) {
      handleFormUpdate('estimate_date', `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`)
    }
    else {
      handleFormUpdate('estimate_date', null)
    }
  },
})

const estimateDateDisplayText = computed(() => {
  if (!estimateDateValue.value) return 'Select estimate date'
  return df.format(estimateDateValue.value.toDate(getLocalTimeZone()))
})

const projectOptions = computed(() => {
  const corpUuid = props.editingEstimate
    ? (props.form.corporation_uuid || corpStore.selectedCorporationId)
    : (estimateCreationStore.selectedCorporationUuid || props.form.corporation_uuid)

  if (!corpUuid) return []

  const allProjects = props.editingEstimate ? (projectsStore.projects || []) : (estimateCreationStore.projects || [])
  let filtered = allProjects.filter((p: any) => p.corporation_uuid === corpUuid && p.is_active !== false)

  if (props.editingEstimate && props.form.project_uuid) {
    const found = filtered.find((p: any) => p.uuid === props.form.project_uuid)
    if (!found) {
      const current = allProjects.find((p: any) => p.uuid === props.form.project_uuid) || props.form.project
      if (current) filtered = [current, ...filtered]
    }
  }

  return filtered.map((p: any) => ({
    uuid: p.uuid,
    value: p.uuid,
    label: `${p.project_name || p.project_id || 'Unnamed'} (${p.project_id || p.uuid})`,
  }))
})

const handleCorporationChange = async (corpUuid: string | undefined) => {
  if (!corpUuid || props.editingEstimate) return
  handleFormUpdate('project_uuid', '')
  handleFormUpdate('line_items', [])
  handleFormUpdate('corporation_uuid', corpUuid)
  hasShownModalForProject.value.clear()
  await estimateCreationStore.setCorporationAndFetchData(corpUuid)
}

const getProjectContingencyPercent = (): number => {
  if (!props.form.project_uuid) return 0
  const projects = props.editingEstimate ? projectsStore.projects : estimateCreationStore.projects
  const project = projects.find((p: any) => p.uuid === props.form.project_uuid)
  if (!project) return 0
  const parsed = parseFloat(String(project.contingency_percentage ?? ''))
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
}

const handleFormUpdate = (field: string, value: any) => {
  const updated = { ...props.form, [field]: value }

  if (field === 'line_items') {
    const baseTotal = (value || []).reduce((sum: number, item: any) => sum + (parseFloat(item.total_amount) || 0), 0)
    const contingencyTotal = (value || []).reduce((sum: number, item: any) => {
      if (item.contingency_enabled === true) {
        const base = parseFloat(item.total_amount) || 0
        let pct = parseFloat(item.contingency_percentage)
        if (isNaN(pct)) pct = getProjectContingencyPercent()
        return sum + base * (pct / 100)
      }
      return sum
    }, 0)
    updated.total_amount = baseTotal + contingencyTotal
  }

  if (['total_amount', 'tax_amount', 'discount_amount', 'line_items'].includes(field)) {
    const total = parseFloat(updated.total_amount) || 0
    const tax = parseFloat(updated.tax_amount) || 0
    const discount = parseFloat(updated.discount_amount) || 0
    updated.final_amount = total + tax - discount
  }

  emit('update:form', updated)
}

const isValid = computed(() => {
  const f = props.form
  return !!(f.estimate_number && f.project_uuid && f.estimate_date && f.total_amount && f.final_amount)
})

watch(() => isValid.value, val => emit('validation-change', val), { immediate: true })

// ── Cost code selection modal ────────────────────────────────────────────────
const buildHierarchicalData = (divisions: any[], configurations: any[]): any[] => {
  if (!divisions?.length || !configurations?.length) return []

  const mainDivisions = divisions
    .filter(d => d?.is_active !== false && d?.exclude_in_estimates_and_reports !== true)
    .sort((a, b) => {
      const diff = (a.division_order || 0) - (b.division_order || 0)
      if (diff !== 0) return diff
      return `${a.division_number || ''} ${a.division_name || ''}`.localeCompare(`${b.division_number || ''} ${b.division_name || ''}`)
    })

  const excludedUuids = new Set(
    divisions.filter(d => d?.is_active !== false && d?.exclude_in_estimates_and_reports === true).map(d => d.uuid),
  )

  const makeCostCodes = (parentUuid: string | null) =>
    configurations
      .filter(c => c?.is_active !== false && (parentUuid ? c.parent_cost_code_uuid === parentUuid : !c.parent_cost_code_uuid))
      .sort((a, b) => (a.order || 0) - (b.order || 0))

  const mapCostCode = (cc: any): any => ({
    ...cc,
    subCostCodes: makeCostCodes(cc.uuid).map(sub => ({
      ...sub,
      subSubCostCodes: makeCostCodes(sub.uuid),
    })),
  })

  const result = mainDivisions.map(div => ({
    ...div,
    costCodes: configurations
      .filter(c => c.division_uuid === div.uuid && c.is_active !== false && !c.parent_cost_code_uuid)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(mapCostCode),
  }))

  const otherCostCodes = configurations
    .filter(c => (!c.division_uuid || excludedUuids.has(c.division_uuid)) && c.is_active !== false && !c.parent_cost_code_uuid)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map(mapCostCode)

  if (otherCostCodes.length > 0) {
    result.push({
      uuid: 'other-costs', division_number: 'OTHER', division_name: 'OTHER COSTS',
      division_order: 999, is_active: true, exclude_in_estimates_and_reports: true,
      costCodes: otherCostCodes,
    })
  }

  return result
}

const openCostCodeSelectionModal = async (selectedCostCode?: any, selectedDivision?: any) => {
  const corpUuid = props.editingEstimate
    ? (props.form.corporation_uuid || corpStore.selectedCorporationId)
    : (estimateCreationStore.selectedCorporationUuid || props.form.corporation_uuid)

  if (!corpUuid) return

  try {
    let divisions: any[] = []
    let configurations: any[] = []

    if (props.editingEstimate) {
      if (!divisionsStore.getActiveDivisions(corpUuid)?.length) await divisionsStore.fetchDivisions(corpUuid)
      if (!configurationsStore.getActiveConfigurations(corpUuid)?.length) await configurationsStore.fetchConfigurations(corpUuid)
      divisions = divisionsStore.getActiveDivisions(corpUuid) || []
      configurations = configurationsStore.getActiveConfigurations(corpUuid) || []
    }
    else {
      if (!estimateCreationStore.costCodeDivisions.length) await estimateCreationStore.setCorporationAndFetchData(corpUuid)
      divisions = estimateCreationStore.getActiveDivisions || []
      configurations = estimateCreationStore.getActiveConfigurations || []
    }

    let full = buildHierarchicalData(divisions, configurations)

    if (selectedCostCode && selectedDivision) {
      const div = full.find(d => d.uuid === selectedDivision.uuid || (selectedDivision.division_number === 'OTHER' && d.division_number === 'OTHER'))
      if (div) {
        const parent = div.costCodes?.find((cc: any) => cc.uuid === selectedCostCode.uuid)
        if (parent) full = [{ ...div, costCodes: [JSON.parse(JSON.stringify(parent))] }]
        else full = []
      }
      else { full = [] }
    }

    hierarchicalDataForModal.value = full
    if (full.length > 0) isCostCodeSelectionModalOpen.value = true
  }
  catch (err) {
    console.error('Error loading cost code data:', err)
  }
}

const handleCostCodeSelectionConfirm = (removedUuids: string[]) => handleFormUpdate('removed_cost_code_uuids', removedUuids)
const handleCostCodeSelectionCancel = () => {}

watch(() => props.form.project_uuid, async (newUuid, oldUuid) => {
  if (!newUuid || newUuid === oldUuid || hasShownModalForProject.value.has(newUuid) || isReadOnlyEstimate.value || props.editingEstimate) return

  const corpUuid = estimateCreationStore.selectedCorporationUuid || props.form.corporation_uuid
  if (!corpUuid) return

  isCheckingExistingEstimate.value = true
  try {
    const response: any = await apiFetch('/api/estimates', { query: { corporation_uuid: corpUuid, project_uuid: newUuid, page: 1, page_size: 1 } })
    const existing = response?.data || []
    if (existing.length > 0) {
      const pn = existing[0]?.project?.project_name || 'this project'
      const en = existing[0]?.estimate_number || 'N/A'
      const toast = useToast()
      toast.add({ title: 'Estimate Already Exists', description: `An estimate (${en}) already exists for ${pn}. Please edit the existing estimate instead.`, color: 'warning', icon: 'i-heroicons-exclamation-triangle' })
      handleFormUpdate('project_uuid', '')
      return
    }
  }
  catch { /* continue */ }
  finally { isCheckingExistingEstimate.value = false }

  hasShownModalForProject.value.add(newUuid)
  await openCostCodeSelectionModal()
}, { immediate: false })

watch(() => estimateCreationStore.selectedCorporationUuid, async (newCorpUuid, oldCorpUuid) => {
  if (props.editingEstimate || !newCorpUuid || newCorpUuid === oldCorpUuid) return
  const hasProjects = estimateCreationStore.projects.some((p: any) => p.corporation_uuid === newCorpUuid)
  if (!hasProjects) await estimateCreationStore.setCorporationAndFetchData(newCorpUuid)
}, { immediate: true })

onMounted(async () => {
  if (!props.editingEstimate && corpStore.selectedCorporationId) {
    await estimateCreationStore.setCorporationAndFetchData(corpStore.selectedCorporationId)
  }
  else if (props.editingEstimate && props.form.corporation_uuid) {
    const hasProjects = projectsStore.projects.some((p: any) => p.corporation_uuid === props.form.corporation_uuid)
    if (!hasProjects) await projectsStore.fetchProjects(props.form.corporation_uuid)
  }
})
</script>
