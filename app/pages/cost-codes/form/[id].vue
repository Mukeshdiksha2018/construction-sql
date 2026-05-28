<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <UButton
          icon="i-heroicons-arrow-left"
          variant="ghost"
          size="sm"
          color="neutral"
          @click="handleBack"
        />
        <div>
          <h1 class="text-lg font-bold text-gray-900 dark:text-gray-100">
            {{ pageTitle }}
          </h1>
          <p class="text-xs text-gray-500">
            {{ isNew ? 'Fill in the details below to create a new cost code configuration.' : 'Update cost code configuration details.' }}
          </p>
        </div>
      </div>

      <div v-if="!isViewMode" class="flex items-center gap-2">
        <UButton
          color="secondary"
          variant="soft"
          size="sm"
          :disabled="saving"
          @click="handleBack"
        >
          Cancel
        </UButton>
        <UButton
          color="primary"
          size="sm"
          :loading="saving"
          icon="i-heroicons-check"
          @click="handleSave"
        >
          {{ isNew ? 'Save' : 'Update' }}
        </UButton>
        <UButton
          v-if="isNew"
          color="secondary"
          variant="solid"
          size="sm"
          :loading="savingNew"
          @click="handleSaveAndNew"
        >
          Save & New
        </UButton>
      </div>

      <div v-else class="flex items-center gap-2">
        <UButton color="secondary" variant="soft" size="sm" @click="handleEdit">
          <UIcon name="tdesign:edit-filled" class="mr-1" /> Edit
        </UButton>
        <UButton color="neutral" variant="soft" size="sm" @click="handleBack">
          Back
        </UButton>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loadingConfig" class="flex justify-center py-12">
      <div class="text-center">
        <div class="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto mb-4" />
        <p class="text-muted">Loading configuration...</p>
      </div>
    </div>

    <!-- Form -->
    <ProjectsCostCodeConfigurationForm
      v-else
      v-model="form"
      :editing-uuid="isNew ? undefined : String(id)"
      :readonly="isViewMode"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCostCodeConfigurationsStore } from '~/stores/costCodeConfigurations'
import { useCorporationStore } from '~/stores/corporations'

definePageMeta({
  layout: 'main-layout',
  middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const configurationsStore = useCostCodeConfigurationsStore()
const corporationStore = useCorporationStore()
const toast = useToast()

const id = computed(() => route.params.id as string)
const isNew = computed(() => id.value === 'new')
const isViewMode = computed(() => route.query.mode === 'view')

const pageTitle = computed(() => {
  if (isViewMode.value) return 'View Cost Code Configuration'
  return isNew.value ? 'Add Cost Code Configuration' : 'Edit Cost Code Configuration'
})

const saving = ref(false)
const savingNew = ref(false)
const loadingConfig = ref(false)

const form = ref({
  division_uuid: null as string | null,
  cost_code_number: '',
  cost_code_name: '',
  parent_cost_code_uuid: null as string | null,
  order_number: null as number | null,
  gl_account_uuid: null as string | null,
  description: null as string | null,
  is_active: true,
  update_previous_transactions: false,
})

const validate = () => {
  if (!form.value.cost_code_number.trim()) {
    toast.add({ title: 'Validation Error', description: 'Cost code number is required', color: 'error', icon: 'i-heroicons-exclamation-triangle' })
    return false
  }
  if (!form.value.cost_code_name.trim()) {
    toast.add({ title: 'Validation Error', description: 'Cost code name is required', color: 'error', icon: 'i-heroicons-exclamation-triangle' })
    return false
  }
  if (!corporationStore.selectedCorporationId) {
    toast.add({ title: 'Validation Error', description: 'Please select a corporation first', color: 'error', icon: 'i-heroicons-exclamation-triangle' })
    return false
  }
  return true
}

const handleSave = async () => {
  if (!validate()) return
  saving.value = true
  try {
    if (isNew.value) {
      await configurationsStore.createConfiguration({
        ...form.value,
        corporation_uuid: corporationStore.selectedCorporationId!,
        is_active: true,
      })
      toast.add({ title: 'Cost code configuration created successfully!', icon: 'i-heroicons-check-circle' })
    }
    else {
      await configurationsStore.updateConfiguration(String(id.value), form.value)
      toast.add({ title: 'Cost code configuration updated successfully!', icon: 'i-heroicons-check-circle' })
    }
    handleBack()
  }
  catch (error: any) {
    const msg = error?.data?.statusMessage || error?.message || 'An error occurred while saving'
    toast.add({ title: 'Failed to save configuration', description: msg, color: 'error', icon: 'i-heroicons-exclamation-triangle' })
  }
  finally {
    saving.value = false
  }
}

const handleSaveAndNew = async () => {
  if (!validate()) return
  savingNew.value = true
  try {
    await configurationsStore.createConfiguration({
      ...form.value,
      corporation_uuid: corporationStore.selectedCorporationId!,
      is_active: true,
    })
    toast.add({ title: 'Cost code configuration created successfully!', icon: 'i-heroicons-check-circle' })
    form.value = { division_uuid: null, cost_code_number: '', cost_code_name: '', parent_cost_code_uuid: null, order_number: null, gl_account_uuid: null, description: null, is_active: true, update_previous_transactions: false }
  }
  catch (error: any) {
    const msg = error?.data?.statusMessage || error?.message || 'An error occurred while saving'
    toast.add({ title: 'Failed to save configuration', description: msg, color: 'error', icon: 'i-heroicons-exclamation-triangle' })
  }
  finally {
    savingNew.value = false
  }
}

const handleBack = () => {
  const query = { ...route.query }
  delete query.mode
  router.push({ path: '/projects', query: { ...query, tab: 'cost-codes', subTab: 'cost-codes-configuration' } })
}

const handleEdit = () => {
  const query = { ...route.query }
  delete query.mode
  router.push({ query })
}

onMounted(async () => {
  if (!isNew.value) {
    const existing = configurationsStore.getConfigurationById(String(id.value))
    if (existing) {
      form.value = {
        division_uuid: existing.division_uuid ?? null,
        cost_code_number: existing.cost_code_number,
        cost_code_name: existing.cost_code_name,
        parent_cost_code_uuid: existing.parent_cost_code_uuid ?? null,
        order_number: existing.order_number ?? null,
        gl_account_uuid: existing.gl_account_uuid ?? null,
        description: existing.description ?? null,
        is_active: existing.is_active,
        update_previous_transactions: existing.update_previous_transactions ?? false,
      }
    }
    else {
      loadingConfig.value = true
      try {
        const { data } = await $fetch<{ data: any }>(`/api/cost-code-configurations/${id.value}`)
        if (data) {
          form.value = {
            division_uuid: data.division_uuid ?? null,
            cost_code_number: data.cost_code_number,
            cost_code_name: data.cost_code_name,
            parent_cost_code_uuid: data.parent_cost_code_uuid ?? null,
            order_number: data.order_number ?? null,
            gl_account_uuid: data.gl_account_uuid ?? null,
            description: data.description ?? null,
            is_active: data.is_active,
            update_previous_transactions: data.update_previous_transactions ?? false,
          }
        }
      }
      catch {
        toast.add({ title: 'Error', description: 'Failed to load configuration', color: 'error', icon: 'i-heroicons-exclamation-triangle' })
      }
      finally {
        loadingConfig.value = false
      }
    }
  }
})
</script>
