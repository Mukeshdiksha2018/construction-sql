<template>
  <div class="space-y-2">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-semibold text-default">
        Address Details
      </h4>
      <UButton
        size="xs"
        color="primary"
        variant="soft"
        icon="i-heroicons-plus"
        :disabled="!vendorId"
        @click="openCreate"
      >
        Add New Address
      </UButton>
    </div>

    <div v-if="loading" class="py-4 text-center text-sm text-muted">
      Loading addresses...
    </div>

    <div v-else-if="!addresses.length" class="py-6 text-center text-sm text-muted border border-dashed border-default rounded-md">
      No addresses yet.
    </div>

    <div v-else class="overflow-auto border border-default rounded-md">
      <table class="min-w-full text-xs">
        <thead class="bg-muted/40">
          <tr>
            <th class="px-2 py-2 text-left font-medium">Address</th>
            <th class="px-2 py-2 text-left font-medium">City</th>
            <th class="px-2 py-2 text-left font-medium">Country</th>
            <th class="px-2 py-2 text-left font-medium">State</th>
            <th class="px-2 py-2 text-left font-medium">Zip</th>
            <th class="px-2 py-2 text-left font-medium">Name</th>
            <th class="px-2 py-2 text-left font-medium">Type</th>
            <th class="px-2 py-2 text-left font-medium">Default</th>
            <th class="px-2 py-2 text-left font-medium">Status</th>
            <th class="px-2 py-2 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in addresses"
            :key="row.vendor_address_id"
            class="border-t border-default hover:bg-accented/40"
          >
            <td class="px-2 py-2 max-w-[180px] truncate">{{ row.address_line_1 || '—' }}</td>
            <td class="px-2 py-2">{{ row.city || '—' }}</td>
            <td class="px-2 py-2">{{ row.country_name || '—' }}</td>
            <td class="px-2 py-2">{{ row.state_name || '—' }}</td>
            <td class="px-2 py-2">{{ row.zip_code || '—' }}</td>
            <td class="px-2 py-2">{{ row.contact_name || '—' }}</td>
            <td class="px-2 py-2">{{ addressTypeLabel(row.address_type) }}</td>
            <td class="px-2 py-2">{{ row.is_default ? 'Yes' : 'No' }}</td>
            <td class="px-2 py-2 capitalize">{{ row.status_label }}</td>
            <td class="px-2 py-2">
              <div class="flex justify-end gap-1">
                <UButton
                  icon="tdesign:edit-filled"
                  size="xs"
                  color="secondary"
                  variant="soft"
                  @click="openEdit(row)"
                />
                <UButton
                  icon="mingcute:delete-fill"
                  size="xs"
                  color="error"
                  variant="soft"
                  @click="requestDelete(row)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <VendorsVendorAddressForm
      v-model="showForm"
      :vendor-id="vendorId"
      :address="editingAddress"
      @saved="onAddressSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useVendorStore, type VendorAddressRecord } from '~/stores/vendors'

const props = defineProps<{
  vendorId?: string | null
}>()

const vendorStore = useVendorStore()
const toast = useToast()

const addresses = ref<VendorAddressRecord[]>([])
const loading = ref(false)
const showForm = ref(false)
const editingAddress = ref<VendorAddressRecord | null>(null)

function addressTypeLabel(type: number | null) {
  if (type === 1) return 'Source'
  if (type === 2) return 'Manufacturing'
  if (type === 0) return 'Default'
  return '—'
}

async function loadAddresses() {
  if (!props.vendorId) {
    addresses.value = []
    return
  }
  loading.value = true
  try {
    addresses.value = await vendorStore.fetchVendorAddresses(props.vendorId)
  }
  catch (err: unknown) {
    toast.add({
      title: 'Failed to load addresses',
      description: (err as Error).message,
      color: 'error',
    })
  }
  finally {
    loading.value = false
  }
}

function openCreate() {
  editingAddress.value = null
  showForm.value = true
}

function openEdit(row: VendorAddressRecord) {
  editingAddress.value = row
  showForm.value = true
}

async function requestDelete(row: VendorAddressRecord) {
  if (!props.vendorId) return
  try {
    await vendorStore.deleteVendorAddress(props.vendorId, row.vendor_address_id)
    toast.add({ title: 'Address removed', color: 'success' })
    await loadAddresses()
  }
  catch (err: unknown) {
    toast.add({
      title: 'Delete failed',
      description: (err as Error).message,
      color: 'error',
    })
  }
}

async function onAddressSaved() {
  await loadAddresses()
}

watch(() => props.vendorId, () => {
  loadAddresses()
}, { immediate: true })
</script>
