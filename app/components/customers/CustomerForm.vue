<template>
  <UModal v-model:open="isOpen" :ui="{ content: 'max-w-lg' }">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h3 class="text-base font-semibold">{{ customer ? 'Edit Customer' : 'Add Customer' }}</h3>
        <UButton icon="i-heroicons-x-mark" size="xs" variant="solid" color="neutral" @click="isOpen = false" />
      </div>
    </template>
    <template #body>
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-default mb-1">First Name</label>
            <UInput v-model="form.first_name" placeholder="First name" size="sm" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-1">Last Name</label>
            <UInput v-model="form.last_name" placeholder="Last name" size="sm" class="w-full" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-default mb-1">Company Name</label>
          <UInput v-model="form.company_name" placeholder="Company name" size="sm" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-default mb-1">Email</label>
          <UInput v-model="form.customer_email" type="email" placeholder="Email address" size="sm" class="w-full" />
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="soft" @click="isOpen = false">Cancel</UButton>
        <UButton color="primary" :loading="saving" @click="save">Save</UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  modelValue?: boolean
  customer?: any
  initialCorporationUuid?: string | null
  initialProjectUuid?: string | null
  lockCorporation?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  customer: null,
  initialCorporationUuid: null,
  initialProjectUuid: null,
  lockCorporation: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'customer-saved': [customer?: any]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})

const saving = ref(false)
const form = ref({
  first_name: '',
  last_name: '',
  company_name: '',
  customer_email: '',
})

watch(() => props.customer, c => {
  if (c) {
    form.value = { first_name: c.first_name || '', last_name: c.last_name || '', company_name: c.company_name || '', customer_email: c.customer_email || '' }
  }
}, { immediate: true })

const save = async () => {
  saving.value = true
  const toast = useToast()
  try {
    const payload: any = {
      ...form.value,
      corporation_uuid: props.initialCorporationUuid,
      project_uuid: props.initialProjectUuid,
    }
    const method = props.customer?.uuid ? 'PUT' : 'POST'
    const url = props.customer?.uuid ? `/api/customers/${props.customer.uuid}` : '/api/customers'
    const response = await $fetch<{ data: any }>(url, { method, body: payload, credentials: 'include' })
    emit('customer-saved', response?.data)
    isOpen.value = false
    toast.add({ title: 'Success', description: 'Customer saved.', color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Error', description: e?.message || 'Failed to save customer', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>
