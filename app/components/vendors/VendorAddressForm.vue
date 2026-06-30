<template>
  <UModal
    v-model:open="open"
    :ui="modalUi"
    @update:open="onOpenChange"
  >
    <template #header>
      <div class="flex items-center justify-between w-full gap-4">
        <h3 class="text-lg font-semibold text-primary">
          {{ editing ? 'Edit Address' : 'Add Address' }}
        </h3>
        <div class="flex items-center gap-2">
          <UButton
            color="primary"
            :loading="submitting"
            @click="submit"
          >
            Save
          </UButton>
          <UButton
            icon="i-heroicons-x-mark"
            color="neutral"
            variant="ghost"
            @click="close"
          />
        </div>
      </div>
    </template>

    <template #body>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-default mb-1">Name</label>
            <UInput v-model="form.name" variant="subtle" size="sm" class="w-full" />
          </div>
          <div>
            <label class="block text-xs font-medium text-default mb-1">Address</label>
            <UTextarea v-model="form.address" variant="subtle" size="sm" :rows="3" class="w-full" />
          </div>
          <div>
            <label class="block text-xs font-medium text-default mb-1">City</label>
            <UInput v-model="form.city" variant="subtle" size="sm" class="w-full" />
          </div>
          <div>
            <label class="block text-xs font-medium text-default mb-1">Country</label>
            <USelect
              v-model="form.country_id"
              :items="countryOptions"
              placeholder="Select country"
              size="sm"
              class="w-full"
              @update:model-value="onCountryChange"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-default mb-1">State</label>
            <USelect
              v-model="form.state_id"
              :items="stateOptions"
              placeholder="Select state"
              size="sm"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-default mb-1">Zipcode</label>
            <UInput v-model="form.zip_code" variant="subtle" size="sm" class="w-full" />
          </div>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-default mb-1">Address Type</label>
            <USelect v-model="form.address_type" :items="addressTypeOptions" size="sm" class="w-full" />
          </div>
          <div>
            <label class="block text-xs font-medium text-default mb-1">Mobile Num.</label>
            <UInput v-model="form.mobile_num" variant="subtle" size="sm" class="w-full" />
          </div>
          <div>
            <label class="block text-xs font-medium text-default mb-1">Alternative Num.</label>
            <UInput v-model="form.alternative_num" variant="subtle" size="sm" class="w-full" />
          </div>
          <div>
            <label class="block text-xs font-medium text-default mb-1">Work Num.</label>
            <UInput v-model="form.work_num" variant="subtle" size="sm" class="w-full" />
          </div>
          <div>
            <label class="block text-xs font-medium text-default mb-1">Fax Num.</label>
            <UInput v-model="form.fax_num" variant="subtle" size="sm" class="w-full" />
          </div>
          <div>
            <label class="block text-xs font-medium text-default mb-1">EmailID</label>
            <UInput v-model="form.email" variant="subtle" size="sm" class="w-full" />
          </div>
          <div>
            <label class="block text-xs font-medium text-default mb-1">Website</label>
            <UInput v-model="form.website" variant="subtle" size="sm" class="w-full" />
          </div>

          <div class="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              class="flex items-center justify-between px-3 py-2 rounded border text-sm"
              :class="form.is_default ? 'border-primary bg-primary/5' : 'border-default'"
              @click="form.is_default = !form.is_default"
            >
              <span>Default</span>
              <UIcon :name="form.is_default ? 'i-heroicons-check-circle-solid' : 'i-heroicons-circle'" class="w-5 h-5" />
            </button>
            <button
              type="button"
              class="flex items-center justify-between px-3 py-2 rounded border text-sm"
              :class="form.is_active ? 'border-success bg-success/10' : 'border-default'"
              @click="form.is_active = !form.is_active"
            >
              <span>Active</span>
              <UIcon :name="form.is_active ? 'i-heroicons-check-circle-solid' : 'i-heroicons-circle'" class="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useVendorStore, type VendorAddressRecord } from '~/stores/vendors'

const props = defineProps<{
  vendorId?: string | null
  vendorName?: string | null
  address?: VendorAddressRecord | null
}>()

const open = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  saved: []
}>()

const vendorStore = useVendorStore()
const toast = useToast()
const submitting = ref(false)

const countries = ref<Array<{ id: number, name: string }>>([])
const states = ref<Array<{ id: number, name: string, country_id: number }>>([])

const modalUi = {
  content: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-1rem)] max-w-3xl max-h-[calc(100dvh-1rem)] rounded-lg shadow-lg ring ring-default overflow-hidden',
  body: 'p-4 sm:p-6 max-h-[calc(100dvh-12rem)] overflow-y-auto',
  footer: 'hidden',
}

const addressTypeOptions = [
  { label: 'Default', value: 0 },
  { label: 'Source', value: 1 },
  { label: 'Manufacturing', value: 2 },
]

const emptyForm = () => ({
  name: '',
  address: '',
  city: '',
  country_id: undefined as number | undefined,
  state_id: undefined as number | undefined,
  zip_code: '',
  address_type: 0,
  mobile_num: '',
  alternative_num: '',
  work_num: '',
  fax_num: '',
  email: '',
  website: '',
  is_default: false,
  is_active: true,
})

const form = ref(emptyForm())

const editing = computed(() => !!props.address?.vendor_address_id)

const countryOptions = computed(() =>
  countries.value.map(c => ({ label: c.name, value: c.id })),
)

const stateOptions = computed(() =>
  states.value.map(s => ({ label: s.name, value: s.id })),
)

async function loadCountries() {
  const data = await $fetch<{ countries: Array<{ id: number, name: string }> }>(
    '/api/nimble-lookups/countries',
    { credentials: 'include' },
  )
  countries.value = data.countries ?? []
}

async function loadStates(countryId?: number) {
  const data = await $fetch<{ states: Array<{ id: number, name: string, country_id: number }> }>(
    '/api/nimble-lookups/states',
    {
      query: countryId ? { country_id: countryId } : {},
      credentials: 'include',
    },
  )
  states.value = data.states ?? []
}

function resetForm() {
  form.value = emptyForm()
  if (props.address) {
    form.value = {
      name: props.address.contact_name?.trim() || props.vendorName?.trim() || '',
      address: props.address.address_line_1 ?? '',
      city: props.address.city ?? '',
      country_id: props.address.country_id ?? undefined,
      state_id: props.address.state_id ?? undefined,
      zip_code: props.address.zip_code ?? '',
      address_type: props.address.address_type ?? 0,
      mobile_num: props.address.mobile_num ?? '',
      alternative_num: props.address.alternative_num ?? '',
      work_num: props.address.work_num ?? '',
      fax_num: props.address.fax_num ?? '',
      email: props.address.email ?? '',
      website: props.address.website ?? '',
      is_default: props.address.is_default,
      is_active: props.address.status === 1,
    }
  }
  else if (props.vendorName?.trim()) {
    form.value.name = props.vendorName.trim()
  }
}

async function onCountryChange(countryId: number | undefined) {
  form.value.state_id = undefined
  await loadStates(countryId)
}

function onOpenChange(value: boolean) {
  if (!value) resetForm()
}

function close() {
  open.value = false
}

async function submit() {
  if (!props.vendorId) {
    toast.add({ title: 'Save the vendor first', color: 'warning' })
    return
  }

  submitting.value = true
  try {
    const payload = {
      name: form.value.name.trim() || null,
      address: form.value.address.trim() || null,
      city: form.value.city.trim() || null,
      country_id: form.value.country_id ?? null,
      state_id: form.value.state_id ?? null,
      zip_code: form.value.zip_code.trim() || null,
      address_type: form.value.address_type,
      mobile_num: form.value.mobile_num.trim() || null,
      alternative_num: form.value.alternative_num.trim() || null,
      work_num: form.value.work_num.trim() || null,
      fax_num: form.value.fax_num.trim() || null,
      email: form.value.email.trim() || null,
      website: form.value.website.trim() || null,
      is_default: form.value.is_default,
      is_active: form.value.is_active,
    }

    if (editing.value && props.address) {
      await vendorStore.updateVendorAddress(
        props.vendorId,
        props.address.vendor_address_id,
        payload,
      )
      toast.add({ title: 'Address updated', color: 'success' })
    }
    else {
      await vendorStore.createVendorAddress(props.vendorId, payload)
      toast.add({ title: 'Address created', color: 'success' })
    }

    emit('saved')
    close()
  }
  catch (err: unknown) {
    const e = err as Record<string, unknown>
    toast.add({
      title: 'Save failed',
      description: (e?.statusMessage as string) || (err as Error).message,
      color: 'error',
    })
  }
  finally {
    submitting.value = false
  }
}

watch([open, () => props.address, () => props.vendorName], async ([isOpen]) => {
  if (!isOpen) return
  resetForm()
  await loadCountries()
  await loadStates(form.value.country_id)
}, { deep: true })
</script>
