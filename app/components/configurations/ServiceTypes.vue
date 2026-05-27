<template>
  <div>
    <div class="flex justify-end items-center mb-4">
      <div class="flex-1 max-w-sm mr-2">
        <UInput
          v-model="searchFilter"
          placeholder="Search service types..."
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
        Add Service Type
      </UButton>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      <span class="ml-2 text-gray-600">Loading service types...</span>
    </div>

    <div v-else-if="error" class="text-red-500 text-center py-8">
      {{ error }}
    </div>

    <div v-else-if="filteredServiceTypes.length > 0">
      <UTable
        :data="filteredServiceTypes"
        :columns="columns"
        class="w-full"
      />
    </div>

    <div v-else class="text-center py-12">
      <div class="text-gray-400 mb-4">
        <UIcon name="i-heroicons-scale" class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-gray-500 text-lg font-medium">
        No service types found
      </p>
      <p class="text-gray-400 text-sm">
        Get started by adding your first service type
      </p>
    </div>

    <UModal
      v-model:open="showModal"
      :title="isEditing ? 'Edit Service Type' : 'Add Service Type'"
      description="Configure service type details."
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
                Service Type Name <span class="text-red-500">*</span>
              </label>
              <UInput
                v-model="formState.name"
                placeholder="e.g., General Construction, Electrical Services"
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
                placeholder="Describe the service type and what it includes..."
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
            {{ isEditing ? 'Update' : 'Save' }} Service Type
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showDeleteModal" title="Delete Service Type">
      <template #body>
        <div class="text-center py-4">
          <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Are you sure?
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            This will permanently delete the service type "{{ selectedServiceType?.name }}".
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
import { useServiceTypesStore, type ServiceType } from '~/stores/serviceTypes'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UTooltip = resolveComponent('UTooltip')

const serviceTypesStore = useServiceTypesStore()
const toast = useToast()

const submitting = ref(false)
const deleting = ref(false)
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const selectedServiceType = ref<ServiceType | null>(null)
const searchFilter = ref('')

const statusOptions = ['Active', 'Inactive']

const formState = reactive({
  name: '',
  description: '',
  color: '#3D5C7C',
  isActive: 'Active' as 'Active' | 'Inactive' | '',
})

const columns: TableColumn<ServiceType>[] = [
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
      h(UTooltip, { text: 'Edit Service Type' }, () => [
        h(UButton, {
          icon: 'i-lucide-pencil',
          size: 'xs',
          color: 'secondary',
          variant: 'soft',
          onClick: () => openEditModal(row.original),
        }),
      ]),
      h(UTooltip, { text: 'Delete Service Type' }, () => [
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

const serviceTypes = computed(() => serviceTypesStore.serviceTypes)
const loading = computed(() => serviceTypesStore.loading)
const error = computed(() => serviceTypesStore.error)

const filteredServiceTypes = computed(() => {
  if (!searchFilter.value.trim()) return [...serviceTypes.value]
  const search = searchFilter.value.toLowerCase().trim()
  return serviceTypes.value.filter((serviceType) => {
    const fields = [
      serviceType.name || '',
      serviceType.description || '',
      serviceType.isActive ? 'active' : 'inactive',
    ]
    return fields.some(field => field.toLowerCase().includes(search))
  })
})

function openAddModal() {
  isEditing.value = false
  selectedServiceType.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(serviceType: ServiceType) {
  isEditing.value = true
  selectedServiceType.value = serviceType
  formState.name = serviceType.name
  formState.description = serviceType.description || ''
  formState.color = serviceType.color
  formState.isActive = serviceType.isActive ? 'Active' : 'Inactive'
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  resetForm()
}

function resetForm() {
  formState.name = ''
  formState.description = ''
  formState.color = '#3D5C7C'
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

    if (isEditing.value && selectedServiceType.value) {
      await serviceTypesStore.updateServiceType(selectedServiceType.value.id.toString(), payload)
      toast.add({ title: 'Success', description: 'Service type updated successfully', color: 'success' })
    }
    else {
      await serviceTypesStore.createServiceType(payload)
      toast.add({ title: 'Success', description: 'Service type created successfully', color: 'success' })
    }

    closeModal()
  }
  catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: fetchError?.data?.statusMessage || fetchError?.message || 'Failed to save service type',
      color: 'error',
    })
  }
  finally {
    submitting.value = false
  }
}

function confirmDelete(serviceType: ServiceType) {
  selectedServiceType.value = serviceType
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!selectedServiceType.value) return
  deleting.value = true
  try {
    await serviceTypesStore.deleteServiceType(selectedServiceType.value.id.toString())
    showDeleteModal.value = false
    selectedServiceType.value = null
    toast.add({ title: 'Success', description: 'Service type deleted successfully', color: 'success' })
  }
  catch (error: unknown) {
    const fetchError = error as { data?: { statusMessage?: string }, message?: string }
    toast.add({
      title: 'Error',
      description: fetchError?.data?.statusMessage || fetchError?.message || 'Failed to delete service type',
      color: 'error',
    })
  }
  finally {
    deleting.value = false
  }
}

onMounted(async () => {
  await serviceTypesStore.fetchServiceTypes()
})
</script>
