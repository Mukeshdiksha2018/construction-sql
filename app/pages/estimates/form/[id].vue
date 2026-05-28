<template>
  <div class="space-y-2">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <UButton color="neutral" variant="solid" icon="i-heroicons-arrow-left" @click="goBack">
          Back
        </UButton>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          {{ isViewMode ? 'View Estimate' : editingEstimate ? 'Edit Estimate' : 'Create New Estimate' }}
        </h1>
      </div>

      <!-- Project summary stats -->
      <div v-if="!loading && selectedProject" class="flex-1 flex justify-center">
        <UCard variant="soft" class="w-auto min-w-[400px]" :ui="{ body: 'px-1 sm:py-1 py-1' }">
          <div class="flex items-center gap-3 px-1">
            <div class="flex items-center gap-1">
              <span class="text-[10px] font-medium text-muted">{{ hasArea ? 'Area:' : 'Rooms:' }}</span>
              <span class="text-xs font-bold text-primary">
                {{ hasArea ? (effectiveArea > 0 ? `${effectiveArea} sqft` : 'N/A') : (effectiveRooms > 0 ? effectiveRooms : 'N/A') }}
              </span>
            </div>
            <div class="flex items-center gap-1 border-x border-default/30 px-2">
              <span class="text-[10px] font-medium text-muted">Total:</span>
              <span class="text-xs font-bold text-primary">{{ formatCurrencyInline(form.total_amount) }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-[10px] font-medium text-muted">{{ hasArea ? 'Per Sqft:' : 'Per Room:' }}</span>
              <span class="text-xs font-bold text-success">{{ formatCurrencyInline(perUnitEstimate) }}</span>
            </div>
          </div>
        </UCard>
      </div>

      <div class="flex items-center gap-3">
        <UButton
          v-if="editingEstimate && form.uuid && hasPermission('project_estimates_view')"
          icon="i-heroicons-shield-check-solid"
          color="info"
          variant="outline"
          size="sm"
          @click="showAuditLogModal = true"
        >
          View Audit Log
        </UButton>

        <template v-if="!isViewMode">
          <UButton
            data-testid="btn-save-draft"
            color="primary"
            variant="solid"
            icon="i-heroicons-check"
            :disabled="!isFormValid || saving"
            :loading="saving"
            @click="handleSaveAndClose"
          >
            Save & Close
          </UButton>
          <UButton
            data-testid="btn-save-new"
            color="primary"
            variant="outline"
            icon="i-heroicons-document-plus"
            :disabled="!isFormValid || saving"
            :loading="saving"
            @click="handleSaveAndNew"
          >
            Save & New
          </UButton>
        </template>

        <UButton
          v-if="isViewMode && hasPermission('project_estimates_edit')"
          color="primary"
          icon="tdesign:edit-filled"
          @click="switchToEditMode"
        >
          Edit Estimate
        </UButton>
      </div>
    </div>

    <!-- Form -->
    <div v-if="error" class="text-center py-12">
      <UAlert icon="i-heroicons-exclamation-triangle" color="error" variant="soft" :title="error" description="Please try refreshing the page." />
    </div>

    <ProjectsEstimateForm
      v-else
      :form="form"
      :editing-estimate="editingEstimate"
      :readonly="isViewMode"
      :loading="loading"
      @update:form="updateForm"
      @validation-change="onValidationChange"
    />

    <!-- Audit Log Modal -->
    <UModal
      v-model:open="showAuditLogModal"
      title="Estimate Audit Log"
      :description="`Audit trail for ${form.estimate_number || 'this estimate'}`"
      size="2xl"
      :ui="{ body: 'p-6' }"
    >
      <template #body>
        <ProjectsEstimateAuditTimeline
          :audit-log="form.audit_log || []"
          :estimate-uuid="form.uuid || ''"
          @logs-loaded="(l) => auditLogsCount = l.length"
        />
      </template>
      <template #footer>
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-500">{{ auditLogsCount }} audit entries</div>
          <UButton color="neutral" variant="solid" @click="showAuditLogModal = false">Close</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCorporationStore } from '~/stores/corporations'
import { useEstimatesStore } from '~/stores/estimates'
import { useEstimateCreationStore } from '~/stores/estimateCreation'
import { useProjectsStore } from '~/stores/projects'
import { usePermissions } from '~/composables/usePermissions'
import { useUTCDateFormat } from '~/composables/useUTCDateFormat'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'

declare function useToast(): { add: (opts: any) => void }

definePageMeta({
  layout: 'main-layout',
  middleware: 'auth',
})

const router = useRouter()
const route = useRoute()
const corporationStore = useCorporationStore()
const estimatesStore = useEstimatesStore()
const projectsStore = useProjectsStore()
const estimateCreationStore = useEstimateCreationStore()
const { hasPermission, isReady } = usePermissions()
const { toUTCString, fromUTCString, getCurrentLocal } = useUTCDateFormat()
const { formatCurrency } = useCurrencyFormat()

const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const isFormValid = ref(false)
const showAuditLogModal = ref(false)
const auditLogsCount = ref(0)

function formatCurrencyInline(value: any) {
  const n = parseFloat(value)
  return formatCurrency(Number.isFinite(n) ? n : 0)
}

const form = ref<any>({
  estimate_number: '',
  project_uuid: '',
  corporation_uuid: '',
  estimate_date: '',
  valid_until: '',
  status: 'Draft',
  total_amount: 0,
  tax_amount: 0,
  discount_amount: 0,
  final_amount: 0,
  notes: '',
  line_items: [],
  attachments: [],
  removed_cost_code_uuids: [],
  audit_log: [],
})

const estimateId = computed(() => route.params.id as string)
const editingEstimate = computed(() => estimateId.value !== 'new')
const isViewMode = computed(() => route.query.mode === 'view')
const projectUuidFromQuery = computed(() => {
  const v = route.query?.projectUuid
  return typeof v === 'string' && v.length > 0 ? v : undefined
})

function generateEstimateNumber() {
  if (form.value.estimate_number) return form.value.estimate_number
  const corpId = estimateCreationStore.selectedCorporationUuid || corporationStore.selectedCorporation?.uuid || form.value.corporation_uuid
  if (!corpId) return 'ES-1'
  const existing = estimatesStore.estimates.filter((e: any) => e.corporation_uuid === corpId)
  let max = 0
  for (const e of existing) {
    const n = parseInt(String(e.estimate_number || '').replace(/^(ES|EST)-/i, ''), 10)
    if (!isNaN(n)) max = Math.max(max, n)
  }
  return `ES-${max + 1}`
}

// Project header stats
const selectedProject = computed(() => {
  if (!form.value.project_uuid) return null
  if (projectsStore.currentProject?.uuid === form.value.project_uuid) return projectsStore.currentProject
  return projectsStore.projects.find((p: any) => p.uuid === form.value.project_uuid) || null
})

const effectiveRooms = computed(() => {
  const p = selectedProject.value
  if (!p) return 0
  return parseFloat(String(p.no_of_rooms ?? 0)) || 0
})

const effectiveArea = computed(() => {
  const p = selectedProject.value
  if (!p) return 0
  return parseFloat(String(p.area_sq_ft ?? 0)) || 0
})

const hasArea = computed(() => effectiveArea.value > 0)

const perUnitEstimate = computed(() => {
  const total = parseFloat(form.value.total_amount) || 0
  if (hasArea.value) return effectiveArea.value > 0 ? total / effectiveArea.value : 0
  return effectiveRooms.value > 0 ? total / effectiveRooms.value : 0
})

const updateForm = (updatedForm: any) => { form.value = { ...updatedForm } }
const onValidationChange = (v: boolean) => { isFormValid.value = v }

const goBack = () => {
  const fromProjectId = route.query?.fromProjectId
  if (typeof fromProjectId === 'string' && fromProjectId) {
    router.push({ path: `/projects/form/${fromProjectId}`, query: { ...route.query } })
  }
  else {
    router.push({ path: '/projects', query: { ...route.query, tab: 'estimates' } })
  }
}

const navigateToEstimatesList = () => router.push({ path: '/projects', query: { ...route.query, tab: 'estimates' } })

const switchToEditMode = () => {
  const q = { ...route.query }
  delete q.mode
  router.push({ path: `/estimates/form/${estimateId.value}`, query: q })
}

const loadEstimate = async () => {
  if (!editingEstimate.value) {
    form.value.corporation_uuid = estimateCreationStore.selectedCorporationUuid || corporationStore.selectedCorporation?.uuid || ''
    if (!form.value.estimate_number) form.value.estimate_number = generateEstimateNumber()
    form.value.estimate_date = getCurrentLocal()
    if (projectUuidFromQuery.value) {
      form.value.project_uuid = projectUuidFromQuery.value
      const corpUuid = estimateCreationStore.selectedCorporationUuid || corporationStore.selectedCorporation?.uuid
      if (corpUuid) projectsStore.loadCurrentProject(projectUuidFromQuery.value, corpUuid).catch(() => {})
    }
    return
  }

  loading.value = true
  error.value = null
  try {
    let estimate: any = estimatesStore.getEstimateByUuid(estimateId.value)
    // Always fetch fresh from API when editing
    try {
      const response: any = await $fetch(`/api/estimates/${estimateId.value}`)
      if (response?.data) estimate = response.data
    }
    catch { /* use stored */ }

    if (!estimate) throw new Error('Estimate not found')

    form.value = {
      uuid: estimate.uuid || '',
      estimate_number: estimate.estimate_number || '',
      project_uuid: estimate.project_uuid || '',
      corporation_uuid: estimate.corporation_uuid || '',
      estimate_date: fromUTCString(estimate.estimate_date || ''),
      valid_until: fromUTCString(estimate.valid_until || ''),
      status: estimate.status || 'Draft',
      total_amount: estimate.total_amount || 0,
      tax_amount: estimate.tax_amount || 0,
      discount_amount: estimate.discount_amount || 0,
      final_amount: estimate.final_amount || 0,
      notes: estimate.notes || '',
      line_items: Array.isArray(estimate.line_items) ? estimate.line_items : [],
      attachments: Array.isArray(estimate.attachments) ? estimate.attachments : [],
      removed_cost_code_uuids: Array.isArray(estimate.removed_cost_code_uuids) ? estimate.removed_cost_code_uuids : [],
      audit_log: Array.isArray(estimate.audit_log) ? estimate.audit_log : [],
      project: estimate.project || null,
    }
  }
  catch (err: any) {
    error.value = err.message || 'Failed to load estimate'
  }
  finally {
    loading.value = false
  }
}

const saveEstimate = async (afterSave: 'new' | 'close' = 'close') => {
  if (!isFormValid.value) {
    const toast = useToast()
    toast.add({ title: 'Validation Error', description: 'Please fill in all required fields', color: 'error', icon: 'i-heroicons-x-circle' })
    return
  }

  saving.value = true
  try {
    const corpUuid = editingEstimate.value
      ? (form.value.corporation_uuid || corporationStore.selectedCorporation?.uuid)
      : (estimateCreationStore.selectedCorporationUuid || form.value.corporation_uuid || corporationStore.selectedCorporation?.uuid)

    if (!corpUuid) throw new Error('Corporation is required to save estimate')

    const payload = {
      ...form.value,
      corporation_uuid: corpUuid,
      estimate_date: toUTCString(form.value.estimate_date) as any,
      status: form.value.status as 'Draft' | 'Ready' | 'Approved',
    }

    let success = false
    if (editingEstimate.value) {
      success = await estimatesStore.updateEstimate({ uuid: estimateId.value, ...payload })
    }
    else {
      success = await estimatesStore.createEstimate(payload)
    }

    if (success) {
      const toast = useToast()
      toast.add({ title: 'Success', description: editingEstimate.value ? 'Estimate updated successfully' : 'Estimate created successfully', color: 'success', icon: 'i-heroicons-check-circle' })
      await estimatesStore.fetchEstimates(corpUuid)
      if (!editingEstimate.value) estimateCreationStore.clearStore()

      if (afterSave === 'new') {
        const q = { ...route.query }
        delete (q as any).mode
        await router.push({ path: '/estimates/form/new', query: q })
        form.value = {
          estimate_number: '',
          project_uuid: '',
          corporation_uuid: estimateCreationStore.selectedCorporationUuid || corpUuid,
          estimate_date: getCurrentLocal(),
          valid_until: '',
          status: 'Draft',
          total_amount: 0,
          tax_amount: 0,
          discount_amount: 0,
          final_amount: 0,
          notes: '',
          line_items: [],
          attachments: [],
          removed_cost_code_uuids: [],
        }
        form.value.estimate_number = generateEstimateNumber()
      }
      else {
        navigateToEstimatesList()
      }
    }
    else {
      throw new Error('Failed to save estimate')
    }
  }
  catch (err: any) {
    const toast = useToast()
    toast.add({ title: 'Error', description: err.message || 'Failed to save estimate', color: 'error', icon: 'i-heroicons-x-circle' })
  }
  finally {
    saving.value = false
  }
}

const handleSaveAndClose = () => saveEstimate('close')
const handleSaveAndNew = () => saveEstimate('new')

// Sync corporation from TopBar if creating new
watch(() => corporationStore.selectedCorporationId, (id) => {
  if (id && !editingEstimate.value && !estimateCreationStore.selectedCorporationUuid) {
    form.value.corporation_uuid = id
    if (!form.value.estimate_number || form.value.estimate_number === 'ES-1') {
      form.value.estimate_number = generateEstimateNumber()
    }
  }
}, { immediate: true })

watch(() => estimateCreationStore.selectedCorporationUuid, (id) => {
  if (id && !editingEstimate.value) {
    form.value.corporation_uuid = id
    if (!form.value.estimate_number || form.value.estimate_number === 'ES-1') {
      form.value.estimate_number = generateEstimateNumber()
    }
  }
}, { immediate: true })

watch(() => form.value.project_uuid, async (uuid) => {
  if (uuid) {
    const corpUuid = editingEstimate.value
      ? (corporationStore.selectedCorporation?.uuid || form.value.corporation_uuid)
      : (estimateCreationStore.selectedCorporationUuid || form.value.corporation_uuid || corporationStore.selectedCorporation?.uuid)
    if (corpUuid && projectsStore.currentProject?.uuid !== uuid) {
      await projectsStore.loadCurrentProject(uuid, corpUuid)
    }
  }
}, { immediate: true })

onMounted(async () => {
  await nextTick()
  if (isReady.value) {
    if (editingEstimate.value && !hasPermission('project_estimates_edit')) {
      const toast = useToast()
      toast.add({ title: 'Access Denied', description: 'You don\'t have permission to edit estimates', color: 'error', icon: 'i-heroicons-x-circle' })
      navigateToEstimatesList()
      return
    }
    if (!editingEstimate.value && !hasPermission('project_estimates_create')) {
      const toast = useToast()
      toast.add({ title: 'Access Denied', description: 'You don\'t have permission to create estimates', color: 'error', icon: 'i-heroicons-x-circle' })
      navigateToEstimatesList()
      return
    }
    await loadEstimate()
  }
})
</script>
