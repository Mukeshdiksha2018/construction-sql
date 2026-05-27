<template>
  <div>
    <div class="flex justify-end items-center mb-4">
      <div class="flex-1 max-w-sm mr-2">
        <UInput
          v-model="searchFilter"
          placeholder="Search project types..."
          icon="i-heroicons-magnifying-glass"
          variant="subtle"
          size="xs"
          class="w-full"
        />
      </div>
      <UButton
        icon="i-heroicons-plus"
        color="primary"
        size="xs"
        @click="openAddModal"
      >
        Add Project Type
      </UButton>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      <span class="ml-2 text-gray-600">Loading project types...</span>
    </div>

    <div v-else-if="error" class="text-red-500 text-center py-8">
      {{ error }}
    </div>

    <div v-else-if="filteredProjectTypes.length > 0">
      <UTable
        :data="filteredProjectTypes"
        :columns="columns"
        class="w-full"
      />
    </div>

    <div v-else class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <UIcon name="i-heroicons-chart-bar-square" class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-gray-500 text-lg font-medium">
        No project types found
      </p>
      <p class="text-gray-400 text-sm">
        Get started by adding your first project type
      </p>
    </div>

    <UModal
      v-model:open="showModal"
      :title="isEditing ? 'Edit Project Type' : 'Add Project Type'"
      description="Configure project type details."
      :ui="{
        content: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-1rem)] max-w-4xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-lg shadow-lg ring ring-default overflow-hidden',
        body: 'p-4 sm:p-6 max-h-[calc(100dvh-12rem)] overflow-y-auto',
      }"
      @update:open="closeModal"
    >
      <template #body>
        <div class="space-y-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Project Type Name <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="formState.name"
                placeholder="e.g., Residential Construction"
                variant="subtle"
                size="sm"
                class="w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status <span class="text-red-500">*</span>
              </label>
              <USelect
                v-model="formState.isActive"
                :items="statusOptions"
                placeholder="Select status"
                variant="subtle"
                size="sm"
                class="w-full"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <UTextarea
                v-model="formState.description"
                placeholder="Describe the project type..."
                variant="subtle"
                size="sm"
                class="w-full"
                :rows="2"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color Theme
              </label>
              <div class="space-y-2">
                <UColorPicker
                  v-model="formState.color"
                  size="sm"
                  format="hex"
                  class="w-full"
                />
                <div class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <div
                    class="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600"
                    :style="{ backgroundColor: formState.color }"
                  />
                  <span class="text-xs font-mono text-gray-600 dark:text-gray-400">{{ formState.color }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="outline" @click="closeModal">
            Cancel
          </UButton>
          <UButton
            color="primary"
            :loading="submitting"
            :disabled="!formState.name.trim()"
            @click="handleSubmit"
          >
            {{ isEditing ? 'Update' : 'Save' }} Project Type
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showDeleteModal" title="Delete Project Type">
      <template #body>
        <div class="text-center py-4">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Are you sure?
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            This will permanently delete the project type "{{ selectedProjectType?.name }}".
          </p>
          <div class="flex justify-center space-x-3">
            <UButton color="neutral" variant="ghost" @click="showDeleteModal = false">
              Cancel
            </UButton>
            <UButton
              color="error"
              :loading="deleting"
              @click="handleDelete"
            >
              Delete
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { useProjectTypesStore, type ProjectType } from '~/stores/projectTypes'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UTooltip = resolveComponent('UTooltip')

const projectTypesStore = useProjectTypesStore()
const toast = useToast()

const submitting = ref(false)
const deleting = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const selectedProjectType = ref<ProjectType | null>(null)
const searchFilter = ref('')

const statusOptions = ['Active', 'Inactive']

const formState = reactive({
  name: '',
  description: '',
  color: '#3B82F6',
  isActive: 'Active' as 'Active' | 'Inactive' | '',
})

const columns: TableColumn<ProjectType>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: false,
    cell: ({ row }) => h('div', { class: 'flex items-center space-x-3' }, [
      h('div', {
        class: 'w-3 h-3 rounded-full',
        style: { backgroundColor: row.original.color },
      }),
      h('span', { class: 'font-medium' }, row.original.name),
    ]),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    enableSorting: false,
    cell: ({ row }) => h('span', { class: 'text-gray-600 dark:text-gray-400' }, row.original.description || 'No description'),
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    enableSorting: false,
    cell: ({ row }) => h(UBadge, {
      color: row.original.isActive ? 'success' : 'neutral',
      variant: 'soft',
      size: 'sm',
    }, () => row.original.isActive ? 'Active' : 'Inactive'),
  },
  {
    accessorKey: 'actions',
    header: 'Actions',
    enableSorting: false,
    meta: { class: { th: 'text-right sticky right-0 z-10 w-24', td: 'text-right sticky right-0 w-24' } },
    cell: ({ row }) => h('div', { class: 'flex justify-end gap-1' }, [
      h(UTooltip, { text: 'Edit Project Type' }, () => [
        h(UButton, {
          icon: 'i-lucide-pencil',
          size: 'xs',
          color: 'secondary',
          variant: 'soft',
          onClick: () => openEditModal(row.original),
        }),
      ]),
      h(UTooltip, { text: 'Delete Project Type' }, () => [
        h(UButton, {
          icon: 'i-lucide-trash-2',
          size: 'xs',
          color: 'error',
          variant: 'soft',
          onClick: () => confirmDelete(row.original),
        }),
      ]),
    ]),
  },
]

const projectTypes = computed(() => projectTypesStore.projectTypes)
const loading = computed(() => projectTypesStore.loading)
const error = computed(() => projectTypesStore.error)

const filteredProjectTypes = computed(() => {
  if (!searchFilter.value.trim()) return [...projectTypes.value]
  const search = searchFilter.value.toLowerCase().trim()
  return projectTypes.value.filter((projectType) => {
    const fields = [
      projectType.name || '',
      projectType.description || '',
      projectType.isActive ? 'active' : 'inactive',
    ]
    return fields.some(field => field.toLowerCase().includes(search))
  })
})

function openAddModal() {
  isEditing.value = false
  selectedProjectType.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(projectType: ProjectType) {
  isEditing.value = true
  selectedProjectType.value = projectType
  formState.name = projectType.name
  formState.description = projectType.description || ''
  formState.color = projectType.color
  formState.isActive = projectType.isActive ? 'Active' : 'Inactive'
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  resetForm()
}

function resetForm() {
  formState.name = ''
  formState.description = ''
  formState.color = '#3B82F6'
  formState.isActive = 'Active'
}

async function handleSubmit() {
  submitting.value = true
  try {
    const payload = {
      name: formState.name,
      description: formState.description || null,
      color: formState.color,
      isActive: formState.isActive === 'Active',
    }

    if (isEditing.value && selectedProjectType.value) {
      await projectTypesStore.updateProjectType(selectedProjectType.value.id.toString(), payload)
      toast.add({ title: 'Success', description: 'Project type updated successfully', color: 'success' })
    }
    else {
      await projectTypesStore.createProjectType(payload)
      toast.add({ title: 'Success', description: 'Project type created successfully', color: 'success' })
    }

    closeModal()
  }
  catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: fetchError?.data?.statusMessage || fetchError?.message || 'Failed to save project type',
      color: 'error',
    })
  }
  finally {
    submitting.value = false
  }
}

function confirmDelete(projectType: ProjectType) {
  selectedProjectType.value = projectType
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!selectedProjectType.value) return
  deleting.value = true
  try {
    await projectTypesStore.deleteProjectType(selectedProjectType.value.id.toString())
    showDeleteModal.value = false
    selectedProjectType.value = null
    toast.add({ title: 'Success', description: 'Project type deleted successfully', color: 'success' })
  }
  catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: fetchError?.data?.statusMessage || fetchError?.message || 'Failed to delete project type',
      color: 'error',
    })
  }
  finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await projectTypesStore.fetchProjectTypes()
})
</script>
