<template>
  <UModal
    v-model:open="open"
    :title="editing ? 'Edit Vendor' : 'Add New Vendor'"
    description="Configure vendor details in Nimble Business."
    :ui="modalUi"
    @update:open="onOpenChange"
  >
    <template #body>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-default mb-2">
            Corporation <span class="text-red-500">*</span>
          </label>
          <CorporationSelect
            v-model="form.corporation_id"
            :disabled="!!editing"
            placeholder="Select corporation"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-default mb-2">
            Vendor Name <span class="text-red-500">*</span>
          </label>
          <UInput
            v-model="form.name"
            variant="subtle"
            placeholder="Vendor name"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-default mb-2">Company Name</label>
          <UInput
            v-model="form.company_name"
            variant="subtle"
            placeholder="Company name"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-default mb-2">Chart of Account</label>
          <ChartOfAccountsSelect
            v-model="form.account_id"
            :corporation-uuid="form.corporation_id"
            placeholder="Select account"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-default mb-2">Status</label>
          <USelect
            v-model="form.status"
            :items="statusOptions"
            class="w-full"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-default mb-2">Tax ID</label>
            <UInput
              v-model="form.tax_id"
              variant="subtle"
              placeholder="Tax ID"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-2">Contact Person</label>
            <UInput
              v-model="form.contact_person_name"
              variant="subtle"
              placeholder="Contact person"
              class="w-full"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-default mb-2">Credit Limit</label>
          <UInput
            v-model="form.credit_limit"
            type="number"
            variant="subtle"
            placeholder="0.00"
            class="w-full"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton color="neutral" variant="outline" @click="close">
          Cancel
        </UButton>
        <UButton
          color="primary"
          :loading="submitting"
          :disabled="!isValid"
          @click="submit"
        >
          {{ editing ? 'Update' : 'Save' }} Vendor
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import CorporationSelect from '~/components/shared/CorporationSelect.vue'
import ChartOfAccountsSelect from '~/components/shared/ChartOfAccountsSelect.vue'
import { useVendorStore, type NimbleDbVendor } from '~/stores/vendors'
import { useCorporationStore } from '~/stores/corporations'

const props = defineProps<{
  vendor?: NimbleDbVendor | null
}>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const vendorStore = useVendorStore()
const corpStore = useCorporationStore()
const toast = useToast()

const submitting = ref(false)

const modalUi = {
  content: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-1rem)] max-w-2xl max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-lg shadow-lg ring ring-default overflow-hidden',
  body: 'p-4 sm:p-6 max-h-[calc(100dvh-12rem)] overflow-y-auto',
}

const statusOptions = [
  { label: 'Active', value: 1 },
  { label: 'Inactive', value: 0 },
]

const emptyForm = () => ({
  corporation_id: corpStore.selectedCorporation?.id ?? '',
  name: '',
  company_name: '',
  account_id: '',
  status: 1,
  tax_id: '',
  contact_person_name: '',
  credit_limit: '' as string | number,
})

const form = ref(emptyForm())

const editing = computed(() => !!props.vendor?.vendor_id)

const isValid = computed(() =>
  form.value.corporation_id.trim() !== '' && form.value.name.trim() !== '',
)

function resetForm() {
  form.value = emptyForm()
  if (props.vendor) {
    form.value = {
      corporation_id: props.vendor.corporation_id,
      name: props.vendor.name,
      company_name: props.vendor.company_name ?? '',
      account_id: props.vendor.account_id ?? '',
      status: props.vendor.status === 3 ? 1 : props.vendor.status,
      tax_id: props.vendor.tax_id ?? '',
      contact_person_name: props.vendor.contact_person_name ?? '',
      credit_limit: props.vendor.credit_limit ?? '',
    }
  }
}

watch(() => props.vendor, resetForm, { immediate: true })

watch(() => corpStore.selectedCorporation?.id, (id) => {
  if (!editing.value && id && !form.value.corporation_id) {
    form.value.corporation_id = id
  }
})

function onOpenChange(value: boolean) {
  if (!value) resetForm()
}

function close() {
  open.value = false
}

async function submit() {
  if (!isValid.value) return

  submitting.value = true
  try {
    const payload = {
      corporation_id: form.value.corporation_id,
      name: form.value.name.trim(),
      company_name: form.value.company_name.trim() || null,
      account_id: form.value.account_id || null,
      status: form.value.status,
      tax_id: form.value.tax_id.trim() || null,
      contact_person_name: form.value.contact_person_name.trim() || null,
      credit_limit: form.value.credit_limit === '' ? null : Number(form.value.credit_limit),
    }

    if (editing.value && props.vendor) {
      await vendorStore.updateNimbleVendor(props.vendor.vendor_id, payload)
      toast.add({ title: 'Vendor updated', color: 'success' })
    }
    else {
      await vendorStore.createNimbleVendor(payload)
      toast.add({ title: 'Vendor created', color: 'success' })
    }

    emit('saved')
    close()
  }
  catch (err: unknown) {
    const e = err as Record<string, unknown>
    const message
      = (e?.data as Record<string, unknown>)?.statusMessage as string
        || (e?.statusMessage as string)
        || (err as Error)?.message
        || 'Failed to save vendor'
    toast.add({ title: 'Error', description: message, color: 'error' })
  }
  finally {
    submitting.value = false
  }
}
</script>
