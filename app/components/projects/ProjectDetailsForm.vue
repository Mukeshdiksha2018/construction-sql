<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-semibold text-default">
          {{ pageTitle }}
        </h2>
        <p class="text-sm text-muted mt-1">
          {{ pageDescription }}
        </p>
      </div>
      <UButton color="neutral" variant="soft" icon="i-heroicons-arrow-left" @click="goBack">
        Back to Projects
      </UButton>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-medium">
            Project Information
          </h3>
          <UBadge v-if="isViewMode" color="info" variant="soft">
            View Only
          </UBadge>
        </div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Project Name <span class="text-red-500">*</span></label>
          <UInput v-model="form.project_name" :disabled="isViewMode || saving" placeholder="Enter project name" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Project ID</label>
          <UInput v-model="form.project_id" :disabled="isViewMode || saving" placeholder="Auto-generated if empty" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Project Type</label>
          <USelect
            v-model="form.project_type_uuid"
            :items="projectTypeItems"
            :disabled="isViewMode || saving"
            placeholder="Select project type"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Service Type</label>
          <USelect
            v-model="form.service_type_uuid"
            :items="serviceTypeItems"
            :disabled="isViewMode || saving"
            placeholder="Select service type"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Customer</label>
          <USelect
            v-model="form.customer_uuid"
            :items="customerItems"
            :disabled="isViewMode || saving"
            placeholder="Select customer"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Status</label>
          <USelect
            v-model="form.project_status"
            :items="statusItems"
            :disabled="isViewMode || saving"
            placeholder="Select project status"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Start Date</label>
          <UInput v-model="form.project_start_date" type="date" :disabled="isViewMode || saving" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Estimated Completion Date</label>
          <UInput v-model="form.project_estimated_completion_date" type="date" :disabled="isViewMode || saving" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Estimated Amount</label>
          <UInput v-model.number="form.estimated_amount" type="number" min="0" step="0.01" :disabled="isViewMode || saving" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Area (Sq Ft)</label>
          <UInput v-model.number="form.area_sq_ft" type="number" min="0" :disabled="isViewMode || saving" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">No. of Rooms</label>
          <UInput v-model.number="form.no_of_rooms" type="number" min="0" :disabled="isViewMode || saving" />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="soft" @click="goBack">
            Cancel
          </UButton>
          <UButton
            v-if="!isViewMode"
            color="primary"
            :loading="saving"
            :disabled="!canSubmit"
            @click="submit"
          >
            {{ isNew ? 'Create Project' : 'Save Changes' }}
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '~/stores/projects'
import { useServiceTypesStore } from '~/stores/serviceTypes'
import { useCorporationStore } from '~/stores/corporations'

interface FormModel {
  project_name: string
  project_id: string
  project_type_uuid: string | null
  service_type_uuid: string | null
  customer_uuid: string | null
  project_status: string
  project_start_date: string
  project_estimated_completion_date: string
  estimated_amount: number
  area_sq_ft: number | null
  no_of_rooms: number | null
}

const route = useRoute()
const router = useRouter()
const toast = useToast()

const projectsStore = useProjectsStore()
const serviceTypesStore = useServiceTypesStore()
const corporationStore = useCorporationStore()

const id = computed(() => String(route.params.id ?? ''))
const isNew = computed(() => id.value === 'new')
const isViewMode = computed(() => String(route.query.mode ?? '') === 'view')
const saving = ref(false)

const projectTypeOptions = ref<Array<{ uuid: string, name: string }>>([])
const customerOptions = ref<Array<{ uuid: string, label: string }>>([])

const form = reactive<FormModel>({
  project_name: '',
  project_id: '',
  project_type_uuid: null,
  service_type_uuid: null,
  customer_uuid: null,
  project_status: 'Pending',
  project_start_date: '',
  project_estimated_completion_date: '',
  estimated_amount: 0,
  area_sq_ft: null,
  no_of_rooms: null,
})

const statusItems = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Bidding', value: 'Bidding' },
  { label: 'Started', value: 'Started' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Completed', value: 'Completed' },
  { label: 'On Hold', value: 'On Hold' },
]

const canSubmit = computed(() => form.project_name.trim().length > 0 && !!corporationStore.selectedCorporationId)
const pageTitle = computed(() => (isNew.value ? 'Add New Project' : isViewMode.value ? 'View Project' : 'Edit Project'))
const pageDescription = computed(() =>
  isNew.value
    ? 'Create a new project for the selected corporation.'
    : 'Review and update project details.',
)

const projectTypeItems = computed(() =>
  projectTypeOptions.value.map(item => ({ label: item.name, value: item.uuid })),
)

const serviceTypeItems = computed(() =>
  (serviceTypesStore.getAllServiceTypes || []).map(item => ({ label: item.name, value: item.uuid })),
)

const customerItems = computed(() => customerOptions.value.map(item => ({ label: item.label, value: item.uuid })))

function toDateInput(value: string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function hydrateForm(project: any) {
  form.project_name = project.project_name || ''
  form.project_id = project.project_id || ''
  form.project_type_uuid = project.project_type_uuid || null
  form.service_type_uuid = project.service_type_uuid || null
  form.customer_uuid = project.customer_uuid || null
  form.project_status = project.project_status || 'Pending'
  form.project_start_date = toDateInput(project.project_start_date)
  form.project_estimated_completion_date = toDateInput(project.project_estimated_completion_date)
  form.estimated_amount = Number(project.estimated_amount ?? 0)
  form.area_sq_ft = project.area_sq_ft === null || project.area_sq_ft === undefined ? null : Number(project.area_sq_ft)
  form.no_of_rooms = project.no_of_rooms === null || project.no_of_rooms === undefined ? null : Number(project.no_of_rooms)
}

async function fetchProjectTypeOptions() {
  try {
    const response = await $fetch<{ data?: Array<{ uuid: string, name: string }> }>('/api/project-types/options')
    projectTypeOptions.value = response.data ?? []
  }
  catch {
    projectTypeOptions.value = []
  }
}

async function fetchCustomers() {
  const corporationUuid = corporationStore.selectedCorporationId
  if (!corporationUuid) return

  try {
    const response = await $fetch<{ data?: Array<{
      uuid: string
      first_name?: string | null
      last_name?: string | null
      company_name?: string | null
      customer_email?: string | null
    }> }>('/api/customers/options', {
      query: { corporation_uuid: corporationUuid },
    })
    customerOptions.value = (response.data ?? []).map((item) => {
      const fullName = [item.first_name, item.last_name].filter(Boolean).join(' ')
      return {
        uuid: item.uuid,
        label: fullName || item.company_name || item.customer_email || item.uuid,
      }
    })
  }
  catch {
    customerOptions.value = []
  }
}

async function loadProjectIfEdit() {
  if (isNew.value) return
  const project = await projectsStore.fetchProject(id.value)
  hydrateForm(project)
}

async function submit() {
  if (!canSubmit.value) return
  saving.value = true
  try {
    const payload = {
      corporation_uuid: String(corporationStore.selectedCorporationId ?? ''),
      project_name: form.project_name.trim(),
      project_id: form.project_id.trim() || undefined,
      project_type_uuid: form.project_type_uuid || null,
      service_type_uuid: form.service_type_uuid || null,
      customer_uuid: form.customer_uuid || null,
      project_status: form.project_status,
      project_start_date: form.project_start_date || null,
      project_estimated_completion_date: form.project_estimated_completion_date || null,
      estimated_amount: Number(form.estimated_amount || 0),
      area_sq_ft: form.area_sq_ft,
      no_of_rooms: form.no_of_rooms,
    }

    if (isNew.value) {
      await projectsStore.createProject(payload)
      toast.add({ title: 'Success', description: 'Project created successfully', color: 'success' })
    }
    else {
      await projectsStore.updateProject(id.value, payload)
      toast.add({ title: 'Success', description: 'Project updated successfully', color: 'success' })
    }

    await router.push({ path: '/projects', query: { ...route.query, tab: 'project-details' } })
  }
  catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: err?.data?.statusMessage || err?.message || 'Failed to save project',
      color: 'error',
    })
  }
  finally {
    saving.value = false
  }
}

async function goBack() {
  await router.push({ path: '/projects', query: { ...route.query, tab: 'project-details' } })
}

onMounted(async () => {
  await Promise.all([
    fetchProjectTypeOptions(),
    serviceTypesStore.fetchServiceTypes(),
    fetchCustomers(),
  ])
  await loadProjectIfEdit()
})
</script>
