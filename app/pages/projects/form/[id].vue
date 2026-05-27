<template>
  <div class="h-[88vh] flex flex-col">
    <!-- Header with Back Button and Title -->
    <div class="flex items-center justify-between w-full mb-2 px-4 py-2 bg-default border-b border-default">
      <div class="flex items-center gap-3">
        <UButton
          color="neutral"
          variant="solid"
          icon="i-heroicons-arrow-left-solid"
          @click="goBack"
        >
          Back
        </UButton>
        <div>
          <h1 class="text-xl font-semibold text-default">
            {{ isViewMode ? 'View Project' : isLocationOnlyMode ? 'Edit Project Locations' : isEditMode ? 'Edit Project' : 'Add New Project' }}
          </h1>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          v-if="!isViewMode && (isEditMode ? hasPermission('project_edit') : hasPermission('project_create'))"
          color="primary"
          @click="submitProject"
          :loading="isSubmitting"
        >
          {{ isEditMode ? 'Update' : 'Create' }} Project
        </UButton>
        <UButton
          v-if="isViewMode && (hasPermission('project_edit') || hasPermission('project_create') || hasPermission('project_delete'))"
          color="primary"
          icon="tdesign:edit-filled"
          @click="switchToEditMode"
        >
          Edit Project
        </UButton>
      </div>
    </div>

    <!-- Form Content -->
    <div class="flex-1 overflow-hidden">
      <ProjectDetailsForm
        ref="projectDetailsForm"
        :key="form.id || 'new'"
        v-model:form="form"
        :editing-project="isEditMode"
        :readonly="formReadonly || isProjectDetailsLocked"
        :location-only-edit="isLocationOnlyMode"
        :file-upload-error="fileUploadError"
        :latest-estimate="latestEstimate"
        :loading="loading"
        :has-project-estimates="hasProjectEstimates"
        @update:form="handleFormUpdate"
        @save-temp-addresses="handleSaveTempAddresses"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiFetch = $fetch as (url: string, opts?: any) => Promise<any>
import { useCorporationStore } from '~/stores/corporations'
import { useProjectsStore } from '~/stores/projects'
import { useProjectAddressesStore } from '~/stores/projectAddresses'
import { useProjectTypesStore } from '~/stores/projectTypes'
import { useServiceTypesStore } from '~/stores/serviceTypes'
import { usePermissions } from '~/composables/usePermissions'
import { useEstimatesStore } from '~/stores/estimates'
import { useDateFormat } from '~/composables/useDateFormat'
import { useCurrencyFormat } from '~/composables/useCurrencyFormat'
import ProjectDetailsForm from '~/components/projects/ProjectDetailsForm.vue'
import { NIMBLE_MENU_ID_PROJECTS } from '~/utils/nimbleMenuIds'

definePageMeta({
  layout: 'main-layout',
  middleware: 'auth',
})

const PROJECTS_MENU_ID = NIMBLE_MENU_ID_PROJECTS

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const nimbleIntegrations = computed(() => !!config.public.nimbleIntegrations)

const corporationStore = useCorporationStore()
const projectsStore = useProjectsStore()
const projectAddressesStore = useProjectAddressesStore()
const projectTypesStore = useProjectTypesStore()
const serviceTypesStore = useServiceTypesStore()

const { hasPermission } = usePermissions()
const estimatesStore = useEstimatesStore()
const { formatDate } = useDateFormat()
const { formatCurrency } = useCurrencyFormat()

const isSubmitting = ref(false)
const fileUploadError = ref<string | null>(null)
const loading = ref(false)

const projectDetailsForm = ref<InstanceType<typeof ProjectDetailsForm> | null>(null)

const isEditMode = computed(() => route.params.id !== 'new')
const isViewMode = computed(() => route.query.mode === 'view')
const isLocationOnlyMode = computed(() => route.query.mode === 'edit-locations')
const formReadonly = computed(
  () => isViewMode.value || isLocationOnlyMode.value || (isEditMode.value && !hasPermission('project_edit'))
)

const isProjectDetailsLocked = computed(
  () => projectDetailsForm.value?.isProjectDetailsLocked === true
)
const projectEstimates = computed(() => {
  if (!form.value.id) return [] as any[]
  return estimatesStore.getEstimatesByProject(form.value.id) || []
})

const hasProjectEstimates = computed(() => (projectEstimates.value?.length || 0) > 0)

const latestEstimate = computed(() => {
  const list = [...projectEstimates.value]
  list.sort((a: any, b: any) => new Date(b.estimate_date).getTime() - new Date(a.estimate_date).getTime())
  return list[0] ?? null
})

const projectId = computed(() => route.params.id as string)
const selectedCorporationId = computed(() => corporationStore.selectedCorporationId)

const form = ref<Record<string, any>>({
  id: undefined as string | undefined,
  corporation_uuid: selectedCorporationId.value || '',
  project_name: '',
  project_id: '',
  project_type_uuid: '',
  service_type_uuid: '',
  estimated_amount: '',
  project_description: '',
  area_sq_ft: '',
  no_of_rooms: '',
  contingency_percentage: '',
  project_status: 'Pending',
  project_start_date: '',
  project_estimated_completion_date: '',
  only_total: false,
  enable_labor: false,
  enable_material: false,
  enable_location_wise: false,
  location_basis_area: false,
  location_basis_no_of_rooms: false,
  location_breakdown: [] as any[],
  customer_uuid: null as string | null,
  attachments: [] as any[],
  tempAddresses: [] as any[],
  address_type: '',
  contact_person: '',
  email: '',
  phone: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  zip_code: '',
  country: '',
})

const goBack = () => {
  projectsStore.clearCurrentProject()
  router.push({ path: '/projects', query: { ...route.query } })
}

const switchToEditMode = () => {
  router.push(`/projects/form/${projectId.value}`)
}

const resetForm = () => {
  form.value = {
    id: undefined,
    corporation_uuid: selectedCorporationId.value || '',
    project_name: '',
    project_id: '',
    project_type_uuid: '',
    service_type_uuid: '',
    estimated_amount: '',
    project_description: '',
    area_sq_ft: '',
    no_of_rooms: '',
    contingency_percentage: '',
    project_status: 'Pending',
    project_start_date: '',
    project_estimated_completion_date: '',
    only_total: false,
    enable_labor: false,
    enable_material: false,
    enable_location_wise: false,
    location_breakdown: [],
    customer_uuid: null,
    attachments: [],
    tempAddresses: [],
    address_type: '',
    contact_person: '',
    email: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
  }
  fileUploadError.value = null
}

const loadProjectData = async () => {
  if (!isEditMode.value || !projectId.value) {
    resetForm()
    projectsStore.clearCurrentProject()
    loading.value = false
    return
  }

  loading.value = true
  try {
    const loaded = await projectsStore.loadCurrentProject(projectId.value, selectedCorporationId.value || '')

    if (!loaded || !projectsStore.currentProject) {
      throw new Error('Project not found')
    }

    const projectToEdit = projectsStore.currentProject

    let existingAttachments: any[] = []
    try {
      const response = await $fetch<{ data: any[] }>('/api/projects/documents', {
        method: 'GET',
        params: { project_uuid: projectToEdit.uuid },
      })
      if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
        existingAttachments = response.data.map((doc: any) => ({
          uuid: doc.uuid,
          name: doc.document_name,
          type: doc.mime_type,
          size: doc.file_size,
          url: doc.file_url,
          file_url: doc.file_url,
          isUploaded: true,
          documentType: doc.document_type,
          description: doc.description,
          tags: doc.tags || [],
          is_primary: doc.is_primary || false,
        }))
      }
    } catch (error) {
      console.error('Error loading existing project documents:', error)
    }

    try {
      await projectAddressesStore.fetchAddresses(projectToEdit.uuid)
    } catch (error) {
      console.error('Error loading existing project addresses:', error)
    }

    if (selectedCorporationId.value) {
      try {
        await estimatesStore.fetchEstimates(selectedCorporationId.value)
      } catch (error) {
        console.error('Error loading estimates:', error)
      }
    }

    form.value = {
      id: projectToEdit.uuid,
      corporation_uuid: projectToEdit.corporation_uuid || selectedCorporationId.value || '',
      project_name: projectToEdit.project_name || '',
      project_id: projectToEdit.project_id || '',
      project_type_uuid: projectToEdit.project_type_uuid || '',
      service_type_uuid: projectToEdit.service_type_uuid || '',
      estimated_amount: String(projectToEdit.estimated_amount || ''),
      project_description: projectToEdit.project_description || '',
      area_sq_ft: String(projectToEdit.area_sq_ft || ''),
      no_of_rooms: String(projectToEdit.no_of_rooms || ''),
      contingency_percentage: String(projectToEdit.contingency_percentage || ''),
      project_status: projectToEdit.project_status || 'Pending',
      project_start_date: projectToEdit.project_start_date || '',
      project_estimated_completion_date: projectToEdit.project_estimated_completion_date || '',
      only_total: projectToEdit.only_total || false,
      enable_labor: projectToEdit.enable_labor || false,
      enable_material: projectToEdit.enable_material || false,
      enable_location_wise: projectToEdit.enable_location_wise ?? false,
      location_basis_area: projectToEdit.location_basis_area ?? false,
      location_basis_no_of_rooms: projectToEdit.location_basis_no_of_rooms ?? false,
      customer_uuid: projectToEdit.customer_uuid || null,
      attachments: existingAttachments,
      tempAddresses: [],
      location_breakdown: [],
      address_type: '',
      contact_person: '',
      email: '',
      phone: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
    }

    if (projectToEdit.enable_location_wise) {
      try {
        const breakdownRes = await $fetch<{ data: any[] }>('/api/projects/location-breakdowns', {
          method: 'GET',
          query: { project_uuid: projectToEdit.uuid },
        })
        const rows = (breakdownRes?.data || []).map((r: any) => ({
          uuid: r.uuid,
          location_uuid: r.location_uuid,
          area_sq_ft: r.area_sq_ft != null && r.area_sq_ft !== '' ? String(r.area_sq_ft) : '',
          no_of_rooms: r.no_of_rooms != null && r.no_of_rooms !== '' ? String(r.no_of_rooms) : '',
        }))
        form.value.location_breakdown = rows
      } catch (err) {
        console.error('Error loading location breakdown:', err)
      }
    }

    fileUploadError.value = null
  } catch (error) {
    console.error('Error loading project data:', error)
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: 'Failed to load project data',
      color: 'error',
      icon: 'i-heroicons-x-circle',
    })
    goBack()
  } finally {
    loading.value = false
  }
}

const handleFormUpdate = (value: any) => {
  form.value = value
}

const handleSaveTempAddresses = async (_projectUuid: string, _tempAddresses: any[]) => {
  // handled by ProjectDetailsForm internally
}

const uploadProjectDocuments = async (projectUuid: string) => {
  if (!form.value.attachments || form.value.attachments.length === 0) return

  const filesToUpload = form.value.attachments
    .filter((a: any) => !a.isUploaded && a.fileData)
    .map((a: any) => ({
      name: a.name,
      type: a.type,
      size: a.size,
      fileData: a.fileData,
      description: a.description || null,
      tags: a.tags || [],
      is_primary: a.is_primary || false,
    }))

  if (filesToUpload.length === 0) return

  try {
    const response: any = await apiFetch('/api/projects/upload-files', {
      method: 'POST',
      body: { projectUuid, files: filesToUpload },
    })

    if (response.success && response.uploadedFiles) {
      form.value.attachments = form.value.attachments.map((a: any) => {
        if (!a.isUploaded && a.fileData) {
          const uploaded = response.uploadedFiles.find((d: any) => d.document_name === a.name)
          if (uploaded) return { ...a, isUploaded: true, uuid: uploaded.uuid, file_url: uploaded.file_url }
        }
        return a
      })
    }

    if (response.errors?.length) {
      console.warn('Some files failed to upload:', response.errors)
    }
  } catch (error) {
    console.error('Error uploading documents:', error)
    throw error
  }
}

const submitProject = async () => {
  if (isSubmitting.value) return

  const detailsLocked = projectDetailsForm.value?.isProjectDetailsLocked === true

  if (!detailsLocked && projectDetailsForm.value && !projectDetailsForm.value.validateForm()) {
    return
  }

  if (detailsLocked && isEditMode.value) {
    isSubmitting.value = true
    try {
      const uuid = projectId.value
      if (!uuid) throw new Error('Project UUID is required for update')

      const pendingUploads = (form.value.attachments || []).some(
        (a: any) => !a.isUploaded && a.fileData
      )

      if (pendingUploads) await uploadProjectDocuments(uuid)

      const toast = useToast()
      toast.add({
        title: 'Success',
        description: pendingUploads ? 'Attachments saved successfully' : 'No new attachments to save',
        color: 'success',
        icon: 'i-heroicons-check-circle',
      })

      if (pendingUploads) {
        projectsStore.clearCurrentProject()
        router.push({ path: '/projects', query: { ...route.query } })
      }
    } catch (error) {
      console.error('Error saving attachments for locked project:', error)
      const toast = useToast()
      toast.add({ title: 'Error', description: 'Failed to save attachments.', color: 'error', icon: 'i-heroicons-x-circle' })
    } finally {
      isSubmitting.value = false
    }
    return
  }

  isSubmitting.value = true

  try {
    const requiredErrors: string[] = []
    if (!form.value.corporation_uuid) requiredErrors.push('Corporation is required')
    if (!form.value.project_name?.trim()) requiredErrors.push('Project Name is required')
    if (!form.value.project_id?.trim()) requiredErrors.push('Project ID is required')

    const hasArea = !!form.value.area_sq_ft && Number(form.value.area_sq_ft) > 0
    const hasRooms = !!form.value.no_of_rooms && Number(form.value.no_of_rooms) > 0

    if (!form.value.enable_location_wise) {
      if (!hasArea && !hasRooms) requiredErrors.push('Provide Area (sq ft) or Number of Rooms')
    } else {
      const rows: any[] = Array.isArray(form.value.location_breakdown) ? form.value.location_breakdown : []
      const basisArea = !!form.value.location_basis_area
      const basisRooms = !!form.value.location_basis_no_of_rooms

      const invalidBasisArea = basisArea && rows.some(row => {
        const rowArea = row?.area_sq_ft != null && row.area_sq_ft !== '' ? Number(row.area_sq_ft) : 0
        return rowArea <= 0
      })
      const invalidBasisRooms = basisRooms && rows.some(row => {
        const rowRooms = row?.no_of_rooms != null && row.no_of_rooms !== '' ? Number(row.no_of_rooms) : 0
        return rowRooms <= 0
      })

      if (invalidBasisArea || invalidBasisRooms) {
        requiredErrors.push('For each location, fill the selected basis column (Area or No. of Rooms) in every row.')
      }
    }

    const hasLayoutOption = form.value.only_total || form.value.enable_labor || form.value.enable_material
    if (!hasLayoutOption) {
      const toast = useToast()
      toast.add({
        title: 'Project Estimate Layout Required',
        description: 'Please select at least one layout option: "Only Total" or enable "Labor" and/or "Material" columns.',
        color: 'error',
        icon: 'i-heroicons-x-circle',
      })
      isSubmitting.value = false
      return
    }

    if (requiredErrors.length > 0) {
      const toast = useToast()
      toast.add({ title: 'Missing required information', description: requiredErrors[0], color: 'error', icon: 'i-heroicons-x-circle' })
      isSubmitting.value = false
      return
    }

    // Address validation
    if (isEditMode.value) {
      try {
        await projectAddressesStore.fetchAddresses(projectId.value)
      } catch {}
      const savedAddresses: any[] = projectAddressesStore.getAddresses(projectId.value) || []
      const hasAny = savedAddresses.length > 0
      const hasPrimary = savedAddresses.some((a: any) => !!a.is_primary)
      if (!hasAny || !hasPrimary) {
        const toast = useToast()
        toast.add({
          title: 'Addresses required',
          description: !hasAny ? 'Add at least one address to the project.' : 'Select a Primary address before saving.',
          color: 'error',
          icon: 'i-heroicons-x-circle',
        })
        return
      }
    } else {
      const tempAddresses: any[] = form.value.tempAddresses || []
      const hasAny = tempAddresses.length > 0
      const hasPrimary = tempAddresses.some((a: any) => !!a.is_primary)
      if (!hasAny || !hasPrimary) {
        const toast = useToast()
        toast.add({
          title: 'Addresses required',
          description: !hasAny ? 'Add at least one address to the project.' : 'Select a Primary address before saving.',
          color: 'error',
          icon: 'i-heroicons-x-circle',
        })
        return
      }
    }

    const optionalUuidFields = ['project_type_uuid', 'service_type_uuid', 'project_address_uuid', 'customer_uuid'] as const
    const sanitizedForm: any = { ...form.value }
    for (const field of optionalUuidFields) {
      const raw = sanitizedForm[field]
      if (typeof raw === 'string' && raw.trim() === '') {
        delete sanitizedForm[field]
      }
    }

    const projectData: any = {
      ...sanitizedForm,
      project_start_date: form.value.project_start_date || new Date().toISOString().split('T')[0],
    }
    delete projectData.attachments

    let response: any
    if (isEditMode.value) {
      if (!projectId.value) throw new Error('Project UUID is required for update')
      response = await projectsStore.updateProject({ uuid: projectId.value, ...projectData })
    } else {
      response = await projectsStore.createProject(projectData)
    }

    if (response) {
      const createdUuid = response.uuid || projectId.value

      if (!isEditMode.value && createdUuid && Array.isArray(form.value.tempAddresses) && form.value.tempAddresses.length > 0) {
        try {
          for (const tempAddress of form.value.tempAddresses) {
            await projectAddressesStore.createAddress({
              project_uuid: createdUuid,
              address_type: tempAddress.address_type,
              contact_person: tempAddress.contact_person,
              email: tempAddress.email,
              phone: tempAddress.phone,
              address_line_1: tempAddress.address_line_1,
              address_line_2: tempAddress.address_line_2,
              city: tempAddress.city,
              state: tempAddress.state,
              zip_code: tempAddress.zip_code,
              country: tempAddress.country,
              is_primary: !!tempAddress.is_primary,
            })
          }
          await projectAddressesStore.fetchAddresses(createdUuid)
          form.value.tempAddresses = []
        } catch (addrErr) {
          console.error('Error saving addresses for new project:', addrErr)
          const toast = useToast()
          toast.add({ title: 'Warning', description: 'Project created but failed to save some addresses', color: 'warning', icon: 'i-heroicons-exclamation-triangle' })
        }
      }

      // Handle location breakdown
      const projectUuidForBreakdown = response.uuid || projectId.value
      const breakdownRows = Array.isArray(form.value.location_breakdown) ? form.value.location_breakdown : []
      const hasBreakdownRows = form.value.enable_location_wise && breakdownRows.length > 0
      try {
        if (isEditMode.value && form.value.enable_location_wise === false) {
          const existingRes = await $fetch<{ data: any[] }>('/api/projects/location-breakdowns', { query: { project_uuid: projectUuidForBreakdown } })
          for (const row of (existingRes?.data || [])) {
            await apiFetch('/api/projects/location-breakdowns', { method: 'DELETE', query: { uuid: row.uuid } })
          }
        } else if (isEditMode.value && form.value.enable_location_wise && breakdownRows.length === 0) {
          const existingRes = await $fetch<{ data: any[] }>('/api/projects/location-breakdowns', { query: { project_uuid: projectUuidForBreakdown } })
          for (const row of (existingRes?.data || [])) {
            await apiFetch('/api/projects/location-breakdowns', { method: 'DELETE', query: { uuid: row.uuid } })
          }
        } else if (hasBreakdownRows) {
          if (!isEditMode.value) {
            for (const row of form.value.location_breakdown) {
              if (!row.location_uuid) continue
              await apiFetch('/api/projects/location-breakdowns', {
                method: 'POST',
                body: { project_uuid: projectUuidForBreakdown, location_uuid: row.location_uuid, area_sq_ft: row.area_sq_ft || null, no_of_rooms: row.no_of_rooms || null },
              })
            }
          } else {
            const existingRes = await $fetch<{ data: any[] }>('/api/projects/location-breakdowns', { query: { project_uuid: projectUuidForBreakdown } })
            const existing = existingRes?.data || []
            const formUuids = new Set((form.value.location_breakdown || []).map((r: any) => r.uuid).filter(Boolean))
            for (const row of existing) {
              if (!formUuids.has(row.uuid)) {
                await apiFetch('/api/projects/location-breakdowns', { method: 'DELETE', query: { uuid: row.uuid } })
              }
            }
            const existingUuids = new Set(existing.map((r: any) => r.uuid))
            for (const row of form.value.location_breakdown) {
              if (!row.location_uuid) continue
              if (row.uuid && existingUuids.has(row.uuid)) {
                await apiFetch('/api/projects/location-breakdowns', { method: 'PUT', body: { uuid: row.uuid, location_uuid: row.location_uuid, area_sq_ft: row.area_sq_ft || null, no_of_rooms: row.no_of_rooms || null } })
              } else {
                await apiFetch('/api/projects/location-breakdowns', { method: 'POST', body: { project_uuid: projectUuidForBreakdown, location_uuid: row.location_uuid, area_sq_ft: row.area_sq_ft || null, no_of_rooms: row.no_of_rooms || null } })
              }
            }
          }
        }
      } catch (breakdownErr) {
        console.error('Error saving location breakdown:', breakdownErr)
        const toast = useToast()
        toast.add({ title: 'Warning', description: 'Project saved but location-wise breakdown could not be saved.', color: 'warning', icon: 'i-heroicons-exclamation-triangle' })
      }

      if (form.value.attachments?.length > 0) {
        try {
          await uploadProjectDocuments(response.uuid || projectId.value)
        } catch (uploadError) {
          console.error('Error uploading documents:', uploadError)
          const toast = useToast()
          toast.add({ title: 'Warning', description: 'Project saved but some files failed to upload', color: 'warning', icon: 'i-heroicons-exclamation-triangle' })
        }
      }

      const toast = useToast()
      toast.add({
        title: 'Success',
        description: isEditMode.value ? 'Project updated successfully' : 'Project created successfully',
        color: 'success',
        icon: 'i-heroicons-check-circle',
      })

      projectsStore.clearCurrentProject()
      router.push({ path: '/projects', query: { ...route.query } })
    }
  } catch (error) {
    console.error('Error submitting project:', error)
    const toast = useToast()
    toast.add({ title: 'Error', description: 'Failed to save project', color: 'error', icon: 'i-heroicons-x-circle' })
  } finally {
    isSubmitting.value = false
  }
}

const fetchRequiredData = async () => {
  try {
    if (selectedCorporationId.value) {
      await Promise.all([
        projectsStore.fetchProjectsMetadata(selectedCorporationId.value),
        projectTypesStore.fetchProjectTypes(),
        serviceTypesStore.fetchServiceTypes(),
      ])
    }

    await loadProjectData()

    if (selectedCorporationId.value && !isEditMode.value) {
      try {
        await estimatesStore.fetchEstimates(selectedCorporationId.value)
      } catch (error) {
        console.error('Error loading estimates:', error)
      }
    }
  } catch (err) {
    console.error('Error fetching required data:', err)
    loading.value = false
  }
}

watch(selectedCorporationId, () => {
  fetchRequiredData()
}, { immediate: true })

watch(() => route.params.id, () => {
  loadProjectData()
})

onMounted(async () => {
  if (nimbleIntegrations.value && !route.query.menuId) {
    await router.replace({ path: route.path, query: { ...route.query, menuId: PROJECTS_MENU_ID } })
  }
  await fetchRequiredData()
})

onUnmounted(() => {
  projectsStore.clearCurrentProject()
})
</script>
